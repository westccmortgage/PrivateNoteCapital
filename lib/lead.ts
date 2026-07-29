// Server-side lead pipeline: persist a property_interest (service role, RLS-safe)
// then forward to GRCRM, then record the CRM outcome. SERVER ONLY.
//
// Never logs passwords/tokens. Failures are captured, not thrown, so a lead is
// never lost to a transient CRM outage.

import { getAdminSupabase } from "@/lib/supabase/server";
import { sendToGRCRM, type CrmLead } from "@/lib/crm";
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
  const crmLead: CrmLead = {
    firstName: rec.firstName,
    lastName: rec.lastName,
    email: rec.email,
    phone: rec.phone,
    actionType: rec.actionType,
    financingType: rec.financingType ?? undefined,
    requestedAmount: rec.requestedAmount ?? null,
    state: rec.state,
    county: rec.county,
    propertyId: rec.propertyId ?? undefined,
    propertyAddress: rec.propertyAddress,
    auctionDate: rec.auctionDate ?? undefined,
    investorExperience: rec.investorExperience,
    notes: rec.notes,
    sourceDetail: rec.sourceDetail,
    utm: {
      source: rec.attribution?.utm_source,
      medium: rec.attribution?.utm_medium,
      campaign: rec.attribution?.utm_campaign,
    },
    referrer: rec.attribution?.referrer,
    consentAt: rec.consent ? nowIso : undefined,
  };

  // 1) Forward to GRCRM (best-effort).
  const crm = await sendToGRCRM(crmLead);

  // 2) Persist the interest with the CRM outcome (best-effort; no-op if DB unset).
  let stored = false;
  const admin = getAdminSupabase();
  if (admin) {
    const { error } = await admin.from("property_interests").insert({
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
      notes: rec.notes ?? null,
      utm_source: rec.attribution?.utm_source ?? null,
      utm_medium: rec.attribution?.utm_medium ?? null,
      utm_campaign: rec.attribution?.utm_campaign ?? null,
      referrer: rec.attribution?.referrer ?? null,
      consent_at: rec.consent ? nowIso : null,
      crm_forwarded: crm.sent,
      crm_error: crm.sent ? null : crm.message,
    });
    stored = !error;
    if (error) console.error("[lead] insert error:", error.message);
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
