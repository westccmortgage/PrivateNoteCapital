"use client";

import { useState } from "react";
import { Button, Field, inputCls } from "@/components/ui";
import { FINANCING_TYPES, PROPERTY_TYPES, INVESTOR_EXPERIENCE } from "@/lib/constants";
import { SUPPORTED_STATES } from "@/lib/site";
import { readAttribution } from "@/lib/attribution";

export interface FinancingInitial {
  financingType?: string;
  propertyId?: string;
  propertyAddress?: string;
  state?: string;
  county?: string;
  intent?: string;
}

// Short initial review form. No unnecessary sensitive borrower data at this stage.
export function FinancingForm({ initial = {} }: { initial?: FinancingInitial }) {
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr([]);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/financing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          propertyId: initial.propertyId || "",
          county: initial.county || "",
          attribution: readAttribution(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.errors || [json.error || "Please review the form."]);
      } else {
        setDone(json.message || "Request received. A representative will reach out.");
      }
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
        <p className="mt-2 text-sm text-navy-muted">{done}</p>
        <p className="mt-2 text-xs text-navy-muted">Financing is not guaranteed and is subject to review. Not a commitment to lend.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5 shadow-soft">
      {/* Honeypot — hidden from users; bots that fill it are silently dropped. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {initial.propertyAddress ? (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          Connected to: <strong>{initial.propertyAddress}</strong>
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" required><input name="firstName" required className={inputCls} /></Field>
        <Field label="Last name"><input name="lastName" className={inputCls} /></Field>
        <Field label="Email" required><input name="email" type="email" required className={inputCls} /></Field>
        <Field label="Phone" required><input name="phone" type="tel" required className={inputCls} /></Field>
      </div>

      <Field label="Financing type" required>
        <select name="financingType" required defaultValue={initial.financingType || ""} className={inputCls}>
          <option value="" disabled>Select…</option>
          {FINANCING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>

      <Field label="Property address or selected property" hint={initial.propertyId ? "(property linked)" : undefined}>
        <input name="propertyAddress" defaultValue={initial.propertyAddress || ""} className={inputCls} placeholder="123 Main St, City, ST" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="State">
          <select name="state" defaultValue={initial.state || ""} className={inputCls}>
            <option value="">Select…</option>
            {SUPPORTED_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Property type">
          <select name="propertyType" className={inputCls}>
            <option value="">Select…</option>
            {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Purchase price or expected bid"><input name="purchasePrice" inputMode="numeric" className={inputCls} placeholder="$" /></Field>
        <Field label="Requested loan amount"><input name="requestedAmount" inputMode="numeric" className={inputCls} placeholder="$" /></Field>
        <Field label="Estimated repairs"><input name="estimatedRepairs" inputMode="numeric" className={inputCls} placeholder="$" /></Field>
        <Field label="Closing or auction date"><input name="closingOrAuctionDate" type="date" className={inputCls} /></Field>
        <Field label="Investor experience">
          <select name="investorExperience" className={inputCls}>
            <option value="">Select…</option>
            {INVESTOR_EXPERIENCE.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Brief notes"><textarea name="notes" rows={3} className={inputCls} placeholder="Exit strategy, timeline, questions…" /></Field>

      {err.length ? (
        <ul className="rounded-lg bg-[#F5EBDD] px-3 py-2 text-sm text-warn">
          {err.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      ) : null}

      <Button type="submit" disabled={busy} full>{busy ? "Submitting…" : "Request financing review"}</Button>
      <p className="text-xs text-navy-muted">
        This is an initial review request, not a full application. Financing is not guaranteed and is subject to review. Not a commitment to lend.
      </p>
    </form>
  );
}
