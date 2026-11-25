"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Field, inputCls } from "@/components/ui";
import {
  PROPERTY_TYPES,
  COUNTIES,
  AUCTION_HORIZONS,
  FINANCING_TYPES,
  INVESTOR_EXPERIENCE,
} from "@/lib/constants";
import { SUPPORTED_STATES } from "@/lib/site";
import { readAttribution } from "@/lib/attribution";

// Weekly Watchlist subscription. Alerts are NOT sent until explicit consent.
export function WatchlistForm() {
  const [state, setState] = useState("FL");
  const [counties, setCounties] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (done) doneRef.current?.scrollIntoView({ block: "center" }); }, [done]);
  const [err, setErr] = useState<string[]>([]);

  function toggle(list: string[], set: (v: string[]) => void, v: string) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr([]);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pnc_hp: fd.get("pnc_hp"), // honeypot
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          state,
          counties,
          propertyTypes: types,
          minPrice: fd.get("minPrice"),
          maxPrice: fd.get("maxPrice"),
          auctionHorizon: fd.get("auctionHorizon"),
          financingType: fd.get("financingType"),
          investorExperience: fd.get("investorExperience"),
          consent,
          attribution: readAttribution(),
        }),
      });
      const json = await res.json();
      if (!res.ok) setErr(json.errors || [json.error || "Please review the form."]);
      else setDone(json.message || "Your Florida auction preferences were saved.");
    } catch {
      setErr(["Network error. Please try again."]);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div ref={doneRef} className="rounded-card border border-hairline bg-surface p-6 text-center shadow-soft">
        <p className="font-serif text-lg text-navy">Subscribed</p>
        <p className="mt-2 text-sm text-navy-muted">{done}</p>
      </div>
    );
  }

  const countyOptions = state ? COUNTIES[state] ?? [] : [];

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-5 shadow-soft">
      {/* Honeypot — hidden from users; bots that fill it are silently dropped. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave this empty<input name="pnc_hp" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" required><input name="firstName" required autoComplete="given-name" className={inputCls} /></Field>
        <Field label="Last name"><input name="lastName" autoComplete="family-name" className={inputCls} /></Field>
        <Field label="Email" required><input name="email" type="email" required autoComplete="email" className={inputCls} /></Field>
        <Field label="Phone" hint="(optional)"><input name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[^0-9]*([0-9][^0-9]*){10,15}" title="Enter a phone number with 10 to 15 digits" className={inputCls} /></Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="State">
          <select className={inputCls} value={state} onChange={(e) => { setState(e.target.value); setCounties([]); }}>
            {SUPPORTED_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Auction date horizon">
          <select name="auctionHorizon" className={inputCls}>
            {AUCTION_HORIZONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </Field>
        <Field label="Min price"><input name="minPrice" inputMode="numeric" className={inputCls} placeholder="$" /></Field>
        <Field label="Max price"><input name="maxPrice" inputMode="numeric" className={inputCls} placeholder="$" /></Field>
        <Field label="Preferred financing">
          <select name="financingType" className={inputCls}>
            <option value="">No preference</option>
            {FINANCING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Investor experience">
          <select name="investorExperience" className={inputCls}>
            <option value="">Select…</option>
            {INVESTOR_EXPERIENCE.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </Field>
      </div>

      {countyOptions.length ? (
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold text-navy">Counties</legend>
          <div className="flex flex-wrap gap-2">
            {countyOptions.map((c) => (
              <button key={c} type="button" onClick={() => toggle(counties, setCounties, c)}
                className={`rounded-md border px-3 py-1 text-sm ${counties.includes(c) ? "border-accent bg-accent-soft text-accent-ink" : "border-hairlineStrong bg-surface text-navy-soft"}`}>
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold text-navy">Property types</legend>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => toggle(types, setTypes, t.value)}
              className={`rounded-md border px-3 py-1 text-sm ${types.includes(t.value) ? "border-accent bg-accent-soft text-accent-ink" : "border-hairlineStrong bg-surface text-navy-soft"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-navy">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
        <span>I consent to receive the weekly watchlist by email. I can unsubscribe anytime. (Required. Nothing is sent without your opt-in.)</span>
      </label>

      {err.length ? (
        <ul className="rounded-lg bg-[#F5EBDD] px-3 py-2 text-sm text-warn">
          {err.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      ) : null}

      <Button type="submit" disabled={busy} full>{busy ? "Subscribing…" : "Subscribe to weekly watchlist"}</Button>
    </form>
  );
}
