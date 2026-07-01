// GRCRM integration for PrivateNoteCapital.
//
// The site never stores data itself — it forwards leads to GRCRM's lead-inbound
// webhook (the token lives in the URL) in the exact shape GRCRM expects:
//   { name, email, phone, message }
// If GRCRM_LEAD_WEBHOOK_URL / GRCRM_WEBHOOK_URL is unset, this is a no-op (logs
// only) so the app keeps working before the webhook is wired up.

export interface GRCRMResult {
  configured: boolean;
  sent: boolean;
  status?: number;
  message: string;
}

export interface LeadInput {
  name?: string;
  email?: string;
  phone?: string;
  message: string;
}

const NOT_CONFIGURED_MESSAGE =
  "Lead saved locally. GRCRM connection is not configured yet.";

/** Forward a simple lead to GRCRM's lead-inbound webhook. Best-effort. */
export async function sendLeadToGRCRM(lead: LeadInput): Promise<GRCRMResult> {
  const url = process.env.GRCRM_LEAD_WEBHOOK_URL || process.env.GRCRM_WEBHOOK_URL;
  if (!url) {
    console.log(`[grcrm] lead webhook not set. Lead: ${lead.name ?? "—"} / ${lead.email ?? "—"}`);
    return { configured: false, sent: false, message: NOT_CONFIGURED_MESSAGE };
  }
  const body = JSON.stringify({
    name: lead.name ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    message: lead.message,
  });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-PNC-Source": "PrivateNoteCapital.com" },
      body,
    });
    return res.ok
      ? { configured: true, sent: true, status: res.status, message: "Lead sent to GRCRM." }
      : {
          configured: true,
          sent: false,
          status: res.status,
          message: "Lead saved; GRCRM will be retried.",
        };
  } catch (err) {
    console.error("[grcrm] lead webhook error:", err);
    return { configured: true, sent: false, message: "Lead saved; GRCRM will be retried." };
  }
}
