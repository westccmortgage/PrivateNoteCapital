// Optional email forwarding so leads are never lost — even before GRCRM is
// wired up. Paste ONE env var into Netlify and submissions start arriving by
// email. Best-effort: if nothing is configured, this is a no-op and the app
// keeps working. No SDK dependency — plain fetch.
//
// Providers (auto-detected, in priority order):
//   1. RESEND_API_KEY        — Resend (https://resend.com). Most control.
//   2. WEB3FORMS_ACCESS_KEY  — Web3Forms (https://web3forms.com). Free, paste-and-go.
//   3. FORMSUBMIT_EMAIL      — FormSubmit (https://formsubmit.co). No signup.

import { COMPANY } from "./company";

export interface NotifyResult {
  sent: boolean;
  provider?: "resend" | "web3forms" | "formsubmit" | "none";
  reason?: string;
}

async function viaResend(
  subject: string,
  text: string,
  replyTo?: string,
): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, provider: "none" };
  const to = process.env.NOTIFY_EMAIL || COMPANY.email;
  const from = process.env.NOTIFY_FROM || "CADeed <onboarding@resend.dev>";
  try {
    const body: Record<string, unknown> = { from, to, subject, text };
    if (replyTo) body.reply_to = replyTo;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok
      ? { sent: true, provider: "resend" }
      : { sent: false, provider: "resend", reason: `status ${res.status}` };
  } catch {
    return { sent: false, provider: "resend", reason: "request failed" };
  }
}

async function viaWeb3Forms(
  subject: string,
  text: string,
  replyTo?: string,
): Promise<NotifyResult> {
  const key = process.env.WEB3FORMS_ACCESS_KEY;
  if (!key) return { sent: false, provider: "none" };
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: key,
        subject,
        from_name: "CADeed.com",
        replyto: replyTo,
        message: text,
      }),
    });
    return res.ok
      ? { sent: true, provider: "web3forms" }
      : { sent: false, provider: "web3forms", reason: `status ${res.status}` };
  } catch {
    return { sent: false, provider: "web3forms", reason: "request failed" };
  }
}

async function viaFormSubmit(
  subject: string,
  text: string,
  replyTo?: string,
): Promise<NotifyResult> {
  const email = process.env.FORMSUBMIT_EMAIL;
  if (!email) return { sent: false, provider: "none" };
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ _subject: subject, message: text, _replyto: replyTo, _template: "table" }),
    });
    return res.ok
      ? { sent: true, provider: "formsubmit" }
      : { sent: false, provider: "formsubmit", reason: `status ${res.status}` };
  } catch {
    return { sent: false, provider: "formsubmit", reason: "request failed" };
  }
}

/**
 * Send a plain-text notification email through whichever provider is configured
 * (Resend → Web3Forms → FormSubmit). No-op if none is set. `replyTo` lets you
 * reply straight to the lead.
 */
export async function sendNotificationEmail(
  subject: string,
  text: string,
  replyTo?: string,
): Promise<NotifyResult> {
  if (process.env.RESEND_API_KEY) return viaResend(subject, text, replyTo);
  if (process.env.WEB3FORMS_ACCESS_KEY) return viaWeb3Forms(subject, text, replyTo);
  if (process.env.FORMSUBMIT_EMAIL) return viaFormSubmit(subject, text, replyTo);
  return { sent: false, provider: "none", reason: "no email provider configured" };
}
