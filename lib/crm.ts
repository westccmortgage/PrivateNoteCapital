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
import { env } from "@/lib/env";
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
  investorExperience?: string;
  notes?: string;
  sourceDetail?: string; // e.g. "financing form", "property page"
  utm?: { source?: string; medium?: string; campaign?: string };
  referrer?: string;
  consentAt?: string;
}

export interface CrmResult {
  configured: boolean;
  sent: boolean;
  status?: number;
  message: string;
}

const ACTION_LABEL: Record<string, string> = {
  save: "Saved property",
  track_auction: "Auction tracking",
  deal_review: "Deal review request",
  financing_request: "Financing request",
  watchlist: "Weekly watchlist subscription",
};

/** Suggested opportunity title: "[County] Auction Acquisition — [Property Address]". */
export function opportunityTitle(lead: CrmLead): string {
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
    lead.auctionDate ? `Auction date: ${lead.auctionDate}` : null,
    lead.financingType ? `Financing: ${labelFor(FINANCING_TYPES, lead.financingType)}` : null,
    lead.requestedAmount != null ? `Requested amount: ${formatMoney(lead.requestedAmount)}` : null,
    lead.investorExperience ? `Investor experience: ${lead.investorExperience}` : null,
    ``,
    lead.notes ? `Notes: ${lead.notes}` : null,
    ``,
    `Suggested opportunity: ${opportunityTitle(lead)}`,
    `Suggested task: ${followUpTask(lead)}`,
  ].filter((l) => l !== null);
  return lines.join("\n");
}

/** Full structured payload. Canonical four + structured extras + suggestions. */
export function buildGrcrmPayload(lead: CrmLead): Record<string, unknown> {
  return {
    // Canonical (back-compatible with the existing lead-inbound handler):
    name: fullName(lead) || lead.email || "Website lead",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    message: buildMessage(lead),
    // Structured extras (a GRCRM handler MAY map these; safe to ignore):
    source: "Private Note Capital",
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
      stageLabel: lead.notes ? "" : labelFor(FORECLOSURE_STAGES, ""),
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

/** Forward a structured lead to GRCRM. Best-effort; never throws. */
export async function sendToGRCRM(lead: CrmLead): Promise<CrmResult> {
  const url = env.grcrmWebhookUrl;
  if (!url) {
    console.log(`[grcrm] webhook not configured. Lead action=${lead.actionType} email=${lead.email ?? "—"}`);
    return { configured: false, sent: false, message: "GRCRM not configured (lead stored locally)." };
  }
  const payload = buildGrcrmPayload(lead);
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-PNC-Source": "PrivateNoteCapital.com",
  };
  if (env.grcrmWebhookSecret) {
    const sig = crypto.createHmac("sha256", env.grcrmWebhookSecret).update(body).digest("hex");
    headers["X-PNC-Signature"] = `sha256=${sig}`;
  }
  try {
    const res = await fetch(url, { method: "POST", headers, body });
    return res.ok
      ? { configured: true, sent: true, status: res.status, message: "Lead sent to GRCRM." }
      : { configured: true, sent: false, status: res.status, message: `GRCRM returned ${res.status}.` };
  } catch (err) {
    console.error("[grcrm] webhook error:", err instanceof Error ? err.message : err);
    return { configured: true, sent: false, message: "GRCRM request failed; lead stored." };
  }
}
