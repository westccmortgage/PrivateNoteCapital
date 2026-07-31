// GRCRM integration for the foreclosure platform. SERVER ONLY.
//
// GRCRM is internal — never surfaced to the public. This module reuses the
// EXISTING approved intake pattern (the lead-inbound webhook that the prior app
// already used: a POST whose canonical shape is { name, email, phone, message }).
// We do NOT invent GRCRM API endpoints. Structured fields are attached alongside
// the canonical four so a GRCRM-side handler can map them to Contact / Lead /
// Property Interest / Follow-up Task; a handler that only reads the canonical
// four still works unchanged.
//
// The webhook URL (token embedded) and optional HMAC secret live in server env
// only and never reach the browser.

import crypto from "node:crypto";
import { serverEnv } from "@/lib/env.server";
import { formatMoney } from "@/lib/format";
import { labelFor, FINANCING_TYPES, FORECLOSURE_STAGES } from "@/lib/constants";

export interface CrmLead {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  actionType: string; // interest_action
  financingType?: string;
  requestedAmount?: number | null;
  state?: string;
  county?: string;
  propertyId?: string;
  propertyAddress?: string;
  auctionDate?: string;
  // County-collector source references (retained on every property inquiry).
  sourceName?: string; // e.g. palm_beach_county | la_county_recorder
  apn?: string; // APN / PCN / AIN
  caseNumber?: string; // Palm Beach case number
  documentNumber?: string; // LA recorder document number
  foreclosureStage?: string;
  investorExperience?: string;
  notes?: string;
  sourceDetail?: string; // e.g. "financing form", "property page"
  // Private-debt / investor metadata (present only for investor inquiries).
  capitalRange?: string;
  lienPreference?: string;
  timeline?: string;
  sourceUrl?: string; // the page the inquiry came from
  submittedAt?: string; // ISO; set by the caller (recordInterest)
  utm?: { source?: string; medium?: string; campaign?: string };
  referrer?: string;
  consentAt?: string;
}

// Delivery states (Section 8 of the remediation spec). Distinguish a definite
// success/rejection from retryable failures and ambiguous timeouts.
export type DeliveryState =
  | "delivered" // 2xx from the receiver
  | "rejected" // 4xx (except 429) — do NOT retry blindly
  | "retry_pending" // 429/5xx/network — safe to retry
  | "sending_unknown" // request sent but response never arrived (timeout) — ambiguous
  | "not_configured"; // no webhook URL

export interface CrmResult {
  configured: boolean;
  sent: boolean; // true only when state === "delivered"
  status?: number;
  state: DeliveryState;
  eventId: string;
  message: string;
}

/**
 * Deterministic sender event ID from the meaningful content of a submission.
 * The SAME logical submission yields the SAME id (idempotency identity for the
 * sender), so a retry is recognizable. NOTE: the verified GRCRM receiver has no
 * idempotency-key support — it dedupes contacts by email/phone only — so this ID
 * provides sender-side traceability, not exactly-once delivery.
 */
export function eventIdFor(lead: CrmLead): string {
  const basis = [
    lead.actionType,
    (lead.email || "").toLowerCase(),
    lead.phone || "",
    lead.propertyId || "",
    lead.financingType || "",
    lead.requestedAmount ?? "",
  ].join("|");
  return "pnc_" + crypto.createHash("sha256").update(basis).digest("hex").slice(0, 24);
}

const ACTION_LABEL: Record<string, string> = {
  save: "Saved property",
  track_auction: "Auction tracking",
  deal_review: "Deal review request",
  financing_request: "Financing request",
  watchlist: "Weekly watchlist subscription",
  investor_inquiry: "Private-debt investor inquiry",
  book_review: "Consultation / deal-review request",
  contact: "General contact",
};

/** Suggested opportunity title. Foreclosure: "[County] Auction Acquisition —
 *  [Address]". Private-debt/contact: a capital-partner/contact title. */
export function opportunityTitle(lead: CrmLead): string {
  if (lead.actionType === "investor_inquiry") {
    return `Capital Partner — ${fullName(lead) || lead.email || "Investor inquiry"}`;
  }
  if (lead.actionType === "book_review" || lead.actionType === "contact") {
    return `${ACTION_LABEL[lead.actionType]} — ${fullName(lead) || lead.email || "Inquiry"}`;
  }
  const county = lead.county ? `${lead.county} ` : "";
  const kind =
    lead.financingType === "auction_acquisition" || lead.actionType === "track_auction"
      ? "Auction Acquisition"
      : lead.financingType
        ? labelFor(FINANCING_TYPES, lead.financingType)
        : "Property Interest";
  const addr = lead.propertyAddress || lead.state || "Opportunity";
  return `${county}${kind} — ${addr}`.trim();
}

/** Suggested follow-up task. */
export function followUpTask(lead: CrmLead): string {
  if (lead.actionType === "investor_inquiry")
    return `Contact capital partner ${fullName(lead) || lead.email || ""}`.trim();
  if (lead.actionType === "book_review" || lead.actionType === "contact")
    return `Follow up with ${fullName(lead) || lead.email || "the contact"}`;
  const addr = lead.propertyAddress || "the property";
  return lead.auctionDate
    ? `Contact investor regarding ${addr} before ${lead.auctionDate}`
    : `Contact investor regarding ${addr}`;
}

function fullName(lead: CrmLead): string {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
}

/** Human-readable message body (the canonical `message` field). */
export function buildMessage(lead: CrmLead): string {
  const lines = [
    `[${ACTION_LABEL[lead.actionType] || lead.actionType}] via PrivateNoteCapital.com`,
    lead.sourceDetail ? `Source: ${lead.sourceDetail}` : null,
    ``,
    lead.propertyAddress ? `Property: ${lead.propertyAddress}` : null,
    lead.propertyId ? `Property ID: ${lead.propertyId}` : null,
    lead.state || lead.county
      ? `Location: ${[lead.county && `${lead.county} County`, lead.state].filter(Boolean).join(", ")}`
      : null,
    lead.apn ? `APN / PCN: ${lead.apn}` : null,
    lead.caseNumber ? `Case number: ${lead.caseNumber}` : null,
    lead.documentNumber ? `Recorder document #: ${lead.documentNumber}` : null,
    lead.sourceName ? `Source: ${lead.sourceName}` : null,
    lead.foreclosureStage ? `Foreclosure stage: ${lead.foreclosureStage}` : null,
    lead.auctionDate ? `Auction date: ${lead.auctionDate}` : null,
    lead.financingType ? `Financing: ${labelFor(FINANCING_TYPES, lead.financingType)}` : null,
    lead.requestedAmount != null ? `Requested amount: ${formatMoney(lead.requestedAmount)}` : null,
    lead.investorExperience ? `Investor experience: ${lead.investorExperience}` : null,
    // Private-debt / investor metadata (only present for investor inquiries).
    lead.capitalRange ? `Capital to deploy: ${lead.capitalRange}` : null,
    lead.lienPreference ? `Lien preference: ${lead.lienPreference}` : null,
    lead.timeline ? `Timeline: ${lead.timeline}` : null,
    ``,
    lead.notes ? `Notes: ${lead.notes}` : null,
    ``,
    `Suggested opportunity: ${opportunityTitle(lead)}`,
    `Suggested task: ${followUpTask(lead)}`,
  ].filter((l) => l !== null);
  return lines.join("\n");
}

/** Full payload. The verified GRCRM lead-inbound receiver reads only the flat
 *  scalar fields (name/first_name/last_name/email/phone/message→notes); it maps
 *  those into a deduped Contact. The structured objects below are additive and
 *  currently IGNORED by that receiver (kept for forward-compatibility and because
 *  the same data is already embedded in `message`). See
 *  docs/GRCRM-CONTRACT-MAPPING.md. */
export function buildGrcrmPayload(lead: CrmLead): Record<string, unknown> {
  return {
    // Flat scalars the receiver actually maps (verified against lead-inbound.mjs):
    name: fullName(lead) || lead.email || "Website lead",
    first_name: lead.firstName ?? "",
    last_name: lead.lastName ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    message: buildMessage(lead), // → receiver `notes` (carries all context)
    external_event_id: eventIdFor(lead), // sender traceability (receiver ignores)
    // Structured extras (a GRCRM handler MAY map these; safe to ignore):
    source: "Private Note Capital",
    request_type: lead.actionType,
    submitted_at: lead.submittedAt ?? "",
    source_url: lead.sourceUrl ?? "",
    sourceDetail: lead.sourceDetail ?? "",
    contact: {
      firstName: lead.firstName ?? "",
      lastName: lead.lastName ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
    },
    propertyInterest: {
      propertyId: lead.propertyId ?? "",
      propertyAddress: lead.propertyAddress ?? "",
      state: lead.state ?? "",
      county: lead.county ?? "",
      actionType: lead.actionType,
      financingType: lead.financingType ?? "",
      requestedAmount: lead.requestedAmount ?? null,
      auctionDate: lead.auctionDate ?? "",
      investorExperience: lead.investorExperience ?? "",
      // County-collector source references (Section 17).
      sourceName: lead.sourceName ?? "",
      apn: lead.apn ?? "",
      caseNumber: lead.caseNumber ?? "",
      documentNumber: lead.documentNumber ?? "",
      foreclosureStage: lead.foreclosureStage ?? "",
      stageLabel: lead.foreclosureStage ? labelFor(FORECLOSURE_STAGES, lead.foreclosureStage) : "",
    },
    privateDebt: {
      capitalRange: lead.capitalRange ?? "",
      lienPreference: lead.lienPreference ?? "",
      timeline: lead.timeline ?? "",
    },
    opportunity: { title: opportunityTitle(lead) },
    task: { title: followUpTask(lead) },
    attribution: {
      utmSource: lead.utm?.source ?? "",
      utmMedium: lead.utm?.medium ?? "",
      utmCampaign: lead.utm?.campaign ?? "",
      referrer: lead.referrer ?? "",
      consentAt: lead.consentAt ?? "",
    },
  };
}

/** Classify an HTTP status into a delivery state (verified receiver semantics). */
export function classifyStatus(status: number): DeliveryState {
  if (status >= 200 && status < 300) return "delivered";
  if (status === 429) return "retry_pending"; // rate limited — retry later
  if (status >= 500) return "retry_pending"; // server-side — retry
  if (status >= 400) return "rejected"; // 400/401/403/413/422 — do not retry blindly
  return "retry_pending";
}

/** Classify a thrown fetch error. A timeout/abort is AMBIGUOUS (the request may
 *  have been received); any other network error is retryable. */
export function classifyError(err: unknown): DeliveryState {
  return err instanceof Error && err.name === "AbortError" ? "sending_unknown" : "retry_pending";
}

const GRCRM_TIMEOUT_MS = 8_000;

/**
 * Forward a lead to the GRCRM lead-inbound webhook. Best-effort; never throws.
 * The token is embedded in serverEnv.grcrmWebhookUrl (?token=…) — the verified
 * receiver's credential. Returns an explicit DeliveryState so the caller can
 * persist it and never report "success" merely because the request was sent.
 */
export async function sendToGRCRM(lead: CrmLead): Promise<CrmResult> {
  const eventId = eventIdFor(lead);
  const url = serverEnv.grcrmWebhookUrl;
  if (!url) {
    console.log(`[grcrm] webhook not configured; lead stored locally (action=${lead.actionType}).`);
    return { configured: false, sent: false, state: "not_configured", eventId, message: "GRCRM not configured (lead stored locally)." };
  }
  const payload = buildGrcrmPayload(lead);
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-PNC-Source": "PrivateNoteCapital.com",
    // Idempotency hint for any future receiver support (current receiver ignores it).
    "X-PNC-Event-Id": eventId,
  };
  // The verified receiver authenticates by the URL token, NOT HMAC. We still send
  // a signature when a secret is configured (harmless, forward-compatible).
  if (serverEnv.grcrmWebhookSecret) {
    const sig = crypto.createHmac("sha256", serverEnv.grcrmWebhookSecret).update(body).digest("hex");
    headers["X-PNC-Signature"] = `sha256=${sig}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GRCRM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
    const state = classifyStatus(res.status);
    return {
      configured: true,
      sent: state === "delivered",
      status: res.status,
      state,
      eventId,
      message:
        state === "delivered"
          ? "Lead delivered to GRCRM."
          : state === "rejected"
            ? `GRCRM rejected the lead (${res.status}).`
            : `GRCRM temporarily unavailable (${res.status}); will retry.`,
    };
  } catch (err) {
    // Timeout/abort → ambiguous (request may have been received); network → retry.
    const state = classifyError(err);
    console.error("[grcrm] webhook error:", err instanceof Error ? err.message : "unknown");
    return {
      configured: true,
      sent: false,
      state,
      eventId,
      message:
        state === "sending_unknown"
          ? "GRCRM send timed out; delivery unknown."
          : "GRCRM request failed; will retry.",
    };
  } finally {
    clearTimeout(timer);
  }
}
