"use client";

import { useState } from "react";
import { Button, Field, inputCls } from "@/components/ui";
import { COMPANY } from "@/lib/company";
import { SUITABILITY_NOTE } from "@/lib/trust-deed";
import { readAttribution } from "@/lib/attribution";

const CAPITAL_RANGES = ["Under $50K", "$50K – $250K", "$250K – $1M", "$1M – $5M", "$5M+"];
const LIEN_PREF = ["1st position", "Either 1st or 2nd", "No preference"];
const TIMELINES = ["Ready now", "1–3 months", "Exploring / researching"];

// Capital-partner intake, styled in the shared design system. Consent-gated;
// forwarded through the single GRCRM integration. Not an offer of securities.
export function InvestorIntake() {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string[]>([]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr([]);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/private-debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "investor_inquiry",
          company: fd.get("company"), // honeypot
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          capitalRange: fd.get("capitalRange"),
          lienPreference: fd.get("lienPreference"),
          timeline: fd.get("timeline"),
          message: fd.get("message"),
          consent,
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
        <p className="font-serif text-lg text-navy">Thank you — request received.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-navy-muted">
          A representative from {COMPANY.legalName} will reach out with information. This is not an
          offer of securities or a commitment of any kind.
        </p>
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
        <Field label="Capital to deploy" hint="(optional)">
          <select name="capitalRange" className={inputCls}>
            <option value="">Select…</option>
            {CAPITAL_RANGES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Lien preference" hint="(optional)">
          <select name="lienPreference" className={inputCls}>
            <option value="">Select…</option>
            {LIEN_PREF.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Timeline" hint="(optional)">
        <select name="timeline" className={inputCls}>
          <option value="">Select…</option>
          {TIMELINES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Anything you'd like us to know" hint="(optional)">
        <textarea name="message" rows={3} className={inputCls} />
      </Field>

      <label className="flex items-start gap-2 text-sm text-navy">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        <span>
          I agree to be contacted by {COMPANY.legalName} about capital-partner opportunities. {SUITABILITY_NOTE}
        </span>
      </label>

      {err.length ? (
        <ul className="rounded-lg bg-[#F5EBDD] px-3 py-2 text-sm text-warn">
          {err.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      ) : null}

      <Button type="submit" disabled={busy} full>{busy ? "Sending…" : "Request information"}</Button>
      <p className="text-xs text-navy-muted">Requesting information creates no obligation and is not an agreement to invest.</p>
    </form>
  );
}
