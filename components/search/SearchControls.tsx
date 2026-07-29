"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button, Field, inputCls } from "@/components/ui";
import {
  FORECLOSURE_STAGES,
  PROPERTY_TYPES,
  COUNTIES,
} from "@/lib/constants";
import { SUPPORTED_STATES } from "@/lib/site";
import { toQueryString } from "@/lib/search";

// Primary hero search. Builds a shareable /search URL from the controls.
export function SearchControls({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [cityZip, setCityZip] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [stage, setStage] = useState("");
  const [auctionFrom, setAuctionFrom] = useState("");
  const [auctionTo, setAuctionTo] = useState("");
  const [bidMin, setBidMin] = useState("");
  const [bidMax, setBidMax] = useState("");
  const [valueMin, setValueMin] = useState("");
  const [valueMax, setValueMax] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cityZipIsZip = /^\d{4,5}$/.test(cityZip.trim());
    const qs = toQueryString({
      state: state || undefined,
      county: county || undefined,
      city: cityZipIsZip ? undefined : cityZip.trim() || undefined,
      zip: cityZipIsZip ? cityZip.trim() : undefined,
      propertyTypes: propertyType ? [propertyType] : [],
      stages: stage ? [stage] : [],
      auctionFrom: auctionFrom || undefined,
      auctionTo: auctionTo || undefined,
      openingBidMin: bidMin ? Number(bidMin) : undefined,
      openingBidMax: bidMax ? Number(bidMax) : undefined,
      valueMin: valueMin ? Number(valueMin) : undefined,
      valueMax: valueMax ? Number(valueMax) : undefined,
    });
    router.push(`/search${qs ? `?${qs}` : ""}`);
  }

  const counties = state ? COUNTIES[state] ?? [] : [];

  return (
    <form
      onSubmit={submit}
      className="rounded-card border border-hairline bg-surface p-4 shadow-soft sm:p-5"
      aria-label="Search foreclosure opportunities"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="State">
          <select className={inputCls} value={state} onChange={(e) => { setState(e.target.value); setCounty(""); }}>
            <option value="">All states</option>
            {SUPPORTED_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="County">
          <select className={inputCls} value={county} onChange={(e) => setCounty(e.target.value)} disabled={!state}>
            <option value="">{state ? "All counties" : "Select a state"}</option>
            {counties.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="City or ZIP">
          <input className={inputCls} value={cityZip} onChange={(e) => setCityZip(e.target.value)} placeholder="e.g. Riverside or 33301" />
        </Field>
        <Field label="Property type">
          <select className={inputCls} value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Foreclosure stage">
          <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">Any stage</option>
            {FORECLOSURE_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Auction date range">
          <div className="flex gap-2">
            <input type="date" className={inputCls} value={auctionFrom} onChange={(e) => setAuctionFrom(e.target.value)} aria-label="Auction date from" />
            <input type="date" className={inputCls} value={auctionTo} onChange={(e) => setAuctionTo(e.target.value)} aria-label="Auction date to" />
          </div>
        </Field>
        <Field label="Opening bid range">
          <div className="flex gap-2">
            <input inputMode="numeric" className={inputCls} value={bidMin} onChange={(e) => setBidMin(e.target.value)} placeholder="Min" aria-label="Opening bid min" />
            <input inputMode="numeric" className={inputCls} value={bidMax} onChange={(e) => setBidMax(e.target.value)} placeholder="Max" aria-label="Opening bid max" />
          </div>
        </Field>
        <Field label="Estimated value range">
          <div className="flex gap-2">
            <input inputMode="numeric" className={inputCls} value={valueMin} onChange={(e) => setValueMin(e.target.value)} placeholder="Min" aria-label="Estimated value min" />
            <input inputMode="numeric" className={inputCls} value={valueMax} onChange={(e) => setValueMax(e.target.value)} placeholder="Max" aria-label="Estimated value max" />
          </div>
        </Field>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="submit" className="sm:w-auto" full>
          <Search size={18} /> Search Properties
        </Button>
        {!compact ? (
          <Button href="/watchlist" variant="ghost" full className="sm:w-auto">
            Get Weekly Watchlist
          </Button>
        ) : null}
      </div>
    </form>
  );
}
