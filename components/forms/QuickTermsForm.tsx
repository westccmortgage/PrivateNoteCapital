"use client";

import { track } from "@/lib/analytics";
import { useState } from "react";
import { readAttribution } from "@/lib/attribution";

// Short lead form for the home page and the hard money page. It posts to the same
// /api/financing route as the full financing form, so leads reach the CRM the same way.
const LOAN_OPTIONS = [
  { value: "fix_and_flip", label: "Fix and flip" },
  { value: "rehabilitation", label: "Ground-up or major rehab" },
  { value: "bridge", label: "Bridge loan" },
  { value: "dscr_takeout", label: "Rental (DSCR)" },
  { value: "auction_acquisition", label: "Auction or REO purchase" },
  { value: "private_capital", label: "Something else" },
];

const STATES = [
  ["CA", "California"], ["FL", "Florida"], ["TX", "Texas"], ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"],
  ["AR", "Arkansas"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "Washington, DC"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"],
  ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const field =
  "w-full rounded-md border border-hairlineStrong bg-white px-3.5 py-3 text-[16px] text-navy placeholder:text-[#6F8077] hover:border-navy-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";
const label = "mb-1.5 block text-[13px] font-bold text-navy";

export function QuickTermsForm({ defaultType = "", compact = false }: { defaultType?: string; compact?: boolean }) {
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
        body: JSON.stringify({ ...payload, notes: `Quick terms form. ${payload.notes || ""}`.trim(), attribution: readAttribution() }),
      });
      const json = await res.json();
      if (!res.ok) setErr(json.errors || [json.error || "Please check the form and try again."]);
      else {
        track("generate_lead", { form: "quick_terms", loan_type: String(payload.financingType || "") });
        setDone("Thanks. We have your deal and will call you to go over the numbers.");
      }
    } catch {
      setErr(["We could not send that. Check your connection and try again."]);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card bg-white p-7 text-navy shadow-lift" role="status">
        <p className="font-serif text-2xl font-extrabold tracking-display">Request received</p>
        <p className="mt-2 text-[16px] text-navy-soft">{done}</p>
        <p className="mt-3 text-[13px] text-navy-muted">Not a commitment to lend. Terms depend on the property, credit and experience.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-card bg-white p-5 text-left text-navy shadow-lift sm:p-6" noValidate={false}>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company<input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        <label className="block">
          <span className={label}>Loan type</span>
          <select name="financingType" required defaultValue={defaultType} className={field}>
            <option value="" disabled>
              Choose one
            </option>
            {LOAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Property state</span>
          <select name="state" defaultValue="" className={field}>
            <option value="">Choose a state</option>
            {STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Purchase price</span>
          <input name="purchasePrice" inputMode="numeric" placeholder="$400,000" className={field} />
        </label>
        <label className="block">
          <span className={label}>First name</span>
          <input name="firstName" required autoComplete="given-name" className={field} />
        </label>
        <label className="block">
          <span className={label}>Phone</span>
          <input name="phone" type="tel" required autoComplete="tel" className={field} />
        </label>
        <label className="block">
          <span className={label}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
      </div>
      {err.length ? (
        <ul className="mt-3 rounded-md bg-[#FBEFD6] px-3.5 py-2.5 text-sm font-semibold text-warn" role="alert">
          {err.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-navy-muted">
          Checking terms uses a soft credit pull and does not affect your score.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-md bg-signal px-7 py-3.5 text-[16px] font-bold text-signal-ink hover:bg-signal-hover disabled:opacity-60"
        >
          {busy ? "Sending" : "Get my terms"}
        </button>
      </div>
    </form>
  );
}
