"use client";

import { useState } from "react";
import { Button, Field, inputCls } from "@/components/ui";
import { readAttribution } from "@/lib/attribution";

// Reusable name/email/phone/message form for book-review and general contact.
// Posts to the given endpoint with an optional request_type; routes through the
// single GRCRM integration. Honeypot-protected.
export function SimpleInquiryForm({
  endpoint,
  requestType,
  messageLabel = "Message",
  messagePlaceholder,
  submitLabel = "Send",
  successText = "Thanks — your message was received. We'll get back to you shortly.",
}: {
  endpoint: string;
  requestType?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  submitLabel?: string;
  successText?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string[]>([]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr([]);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(requestType ? { request_type: requestType } : {}),
          company: fd.get("company"), // honeypot
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message"),
          sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
          attribution: readAttribution(),
        }),
      });
      const json = await res.json();
      if (!res.ok) setErr(json.errors || [json.error || "Please review the form."]);
      else setDone(true);
    } catch {
      setErr(["Network error. Please try again."]);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-hairline bg-surface p-6 text-center shadow-soft">
        <p className="font-serif text-lg text-navy">Thank you</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-navy-muted">{successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5 shadow-soft">
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" required><input name="firstName" required className={inputCls} /></Field>
        <Field label="Last name"><input name="lastName" className={inputCls} /></Field>
        <Field label="Email" required><input name="email" type="email" required className={inputCls} /></Field>
        <Field label="Phone" hint="(optional)"><input name="phone" type="tel" className={inputCls} /></Field>
      </div>
      <Field label={messageLabel} hint="(optional)">
        <textarea name="message" rows={4} className={inputCls} placeholder={messagePlaceholder} />
      </Field>
      {err.length ? (
        <ul className="rounded-lg bg-[#F5EBDD] px-3 py-2 text-sm text-warn">
          {err.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      ) : null}
      <Button type="submit" disabled={busy} full>{busy ? "Sending…" : submitLabel}</Button>
    </form>
  );
}
