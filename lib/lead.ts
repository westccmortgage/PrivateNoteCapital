// Server-side lead pipeline: persist a property_interest (service role, RLS-safe)
// then forward to GRCRM, then record the CRM outcome. SERVER ONLY.
//
// Never logs passwords/tokens. Failures are captured, not thrown, so a lead is
// never lost to a transient CRM outage.

import { getAdminSupabase } from "@/lib/supabase/server";
import { sendToGRCRM, eventIdFor, type CrmLead } from "@/lib/crm";
import { sendNotificationEmail } from "@/lib/notify";

export interface InterestRecord {
  userId?: string | null;
  propertyId?: string | null;
  actionType: string;
  financingType?: string | null;
  requestedAmount?: number | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  state?: string;
  county?: string;
  propertyAddress?: string;
  auctionDate?: string | null;
  investorExperience?: string;
  notes?: string;
  sourceDetail?: string;
  sourceUrl?: string;
  // Private-debt / investor metadata (investor inquiries only).
  capitalRange?: string;
  lienPreference?: string;
  timeline?: string;
  attribution?: { utm_source?: string; utm_medium?: string; utm_campaign?: string; referrer?: string };
  consent?: boolean;
}

export interface LeadOutcome {
  stored: boolean;
  crmForwarded: boolean;
  crmMessage: string;
  emailed: boolean;
}

export async function recordInterest(rec: InterestRecord): Promise<LeadOutcome> {
  const nowIso = new Date().toISOString();
  const admin = getAdminSupabase();

  // Retain the county-collector source references on every property inquiry
  // (Section 17): APN/PCN/AIN, Palm Beach case number, LA recorder document
  // number, source, stage. Looked up from the property when we have its id.
  const ref = await loadPropertyRef(admin, rec.propertyId ?? null);

  const crmLead: CrmLead = {
    firstName: rec.firstName,
    lastName: rec.lastName,
    email: rec.email,
    phone: rec.phone,
    actionType: rec.actionType,
    financingType: rec.financingType ?? undefined,
    requestedAmount: rec.requestedAmount ?? null,
    state: rec.state,
    county: rec.county || ref?.county || undefined,
    propertyId: rec.propertyId ?? undefined,
    propertyAddress: rec.propertyAddress || ref?.address || undefined,
    auctionDate: rec.auctionDate ?? ref?.current_auction_date ?? undefined,
    sourceName: ref?.source_name ?? undefined,
    apn: ref?.apn ?? undefined,
    caseNumber: ref?.case_number ?? undefined,
    documentNumber: ref?.document_number ?? undefined,
    foreclosureStage: ref?.foreclosure_stage ?? undefined,
    investorExperience: rec.investorExperience,
    notes: rec.notes,
    sourceDetail: rec.sourceDetail,
    sourceUrl: rec.sourceUrl,
    capitalRange: rec.capitalRange,
    lienPreference: rec.lienPreference,
    timeline: rec.timeline,
    submittedAt: nowIso,
    utm: {
      source: rec.attribution?.utm_source,
      medium: rec.attribution?.utm_medium,
      campaign: rec.attribution?.utm_campaign,
    },
    referrer: rec.attribution?.referrer,
    consentAt: rec.consent ? nowIso : undefined,
  };

  const eventId = eventIdFor(crmLead);

  // 1) DURABLE CAPTURE FIRST: persist the interest (state="received") BEFORE the
  //    external CRM call, so a crash mid-send never loses the lead. No-op if the
  //    DB is unconfigured (then the email fallback + logs are the only capture —
  //    documented limitation).
  let stored = false;
  let interestId: string | null = null;
  if (admin) {
    const { data, error } = await admin
      .from("property_interests")
      .insert({
        user_id: rec.userId ?? null,
        property_id: rec.propertyId ?? null,
        action_type: rec.actionType,
        financing_type: rec.financingType ?? null,
        requested_amount: rec.requestedAmount ?? null,
        first_name: rec.firstName ?? null,
        last_name: rec.lastName ?? null,
        email: rec.email ?? null,
        phone: rec.phone ?? null,
        state: rec.state ?? null,
        county: rec.county ?? null,
        investor_experience: rec.investorExperience ?? null,
        notes:
          [
            rec.notes,
            rec.capitalRange ? `Capital: ${rec.capitalRange}` : null,
            rec.lienPreference ? `Lien: ${rec.lienPreference}` : null,
            rec.timeline ? `Timeline: ${rec.timeline}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || null,
        utm_source: rec.attribution?.utm_source ?? null,
        utm_medium: rec.attribution?.utm_medium ?? null,
        utm_campaign: rec.attribution?.utm_campaign ?? null,
        referrer: rec.attribution?.referrer ?? null,
        consent_at: rec.consent ? nowIso : null,
        event_id: eventId,
        delivery_state: "received",
        crm_forwarded: false,
        crm_error: null,
      })
      .select("id")
      .maybeSingle();
    stored = !error;
    interestId = (data?.id as string) ?? null;
    if (error) console.error("[lead] insert error:", error.message);
  }

  // 2) Forward to GRCRM (best-effort; classified delivery state).
  const crm = await sendToGRCRM(crmLead);

  // 3) Record the delivery outcome on the persisted row.
  if (admin && interestId) {
    await admin
      .from("property_interests")
      .update({
        delivery_state: crm.state,
        crm_forwarded: crm.state === "delivered",
        crm_error: crm.state === "delivered" ? null : crm.message,
      })
      .eq("id", interestId);
  }

  // 3) Email fallback so no lead is lost before the CRM/DB are wired.
  const email = await sendNotificationEmail(
    `New ${rec.actionType} — ${[rec.firstName, rec.lastName].filter(Boolean).join(" ") || rec.email || "lead"}`,
    [
      `Action: ${rec.actionType}`,
      `Name: ${[rec.firstName, rec.lastName].filter(Boolean).join(" ") || "—"}`,
      `Email: ${rec.email ?? "—"}`,
      `Phone: ${rec.phone ?? "—"}`,
      rec.propertyAddress ? `Property: ${rec.propertyAddress}` : "",
      rec.financingType ? `Financing: ${rec.financingType}` : "",
      rec.notes ? `Notes: ${rec.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    rec.email,
  );

  if (!crm.sent) console.warn(`[lead] CRM not forwarded (${crm.message}) for action=${rec.actionType}`);

  return { stored, crmForwarded: crm.sent, crmMessage: crm.message, emailed: email.sent };
}

interface PropertyRef {
  source_name: string | null;
  apn: string | null;
  case_number: string | null;
  document_number: string | null;
  county: string | null;
  address: string | null;
  foreclosure_stage: string | null;
  current_auction_date: string | null;
}

/** Load a property's source references for the lead. Selects rich/provider-meta
 *  columns only when they exist (0004/0005 optional), so it never errors. */
async function loadPropertyRef(
  admin: ReturnType<typeof getAdminSupabase>,
  propertyId: string | null,
): Promise<PropertyRef | null> {
  if (!admin || !propertyId) return null;
  // Try the full select first; fall back to core columns if 0004/0005 absent.
  const full = await admin
    .from("foreclosure_properties")
    .select("source_name, apn, case_number, document_number, county, address, foreclosure_stage, current_auction_date")
    .eq("id", propertyId)
    .maybeSingle();
  if (!full.error && full.data) return full.data as PropertyRef;
  const core = await admin
    .from("foreclosure_properties")
    .select("source_name, apn, county, address, foreclosure_stage, current_auction_date")
    .eq("id", propertyId)
    .maybeSingle();
  if (core.error || !core.data) return null;
  return { ...(core.data as Partial<PropertyRef>), case_number: null, document_number: null } as PropertyRef;
}
