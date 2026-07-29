"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button, Field, inputCls } from "@/components/ui";
import {
  FORECLOSURE_STAGES,
  PROPERTY_TYPES,
  COUNTIES,
  SORT_OPTIONS,
} from "@/lib/constants";
import { SUPPORTED_STATES } from "@/lib/site";
import { ADAPTERS } from "@/lib/adapters";
import { toQueryString, type SearchFilter } from "@/lib/search";

const CLASSES = [
  { value: "residential", label: "Residential" },
  { value: "multifamily", label: "Multifamily" },
  { value: "commercial", label: "Commercial" },
];

// Full filter set. Renders inline on desktop and as a bottom sheet on mobile.
export function FilterPanel({ filter }: { filter: SearchFilter }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<SearchFilter>(filter);

  function set<K extends keyof SearchFilter>(key: K, v: SearchFilter[K]) {
    setF((prev) => ({ ...prev, [key]: v }));
  }
  function toggle(key: "propertyTypes" | "stages" | "classes", v: string) {
    setF((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  }

  function apply() {
    const qs = toQueryString({ ...f, page: 1 });
    router.push(`/search${qs ? `?${qs}` : ""}`);
    setOpen(false);
  }
  function reset() {
    router.push("/search");
    setOpen(false);
  }

  const counties = f.state ? COUNTIES[f.state] ?? [] : [];

  const body = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="State">
          <select className={inputCls} value={f.state ?? ""} onChange={(e) => set("state", (e.target.value || undefined) as SearchFilter["state"])}>
            <option value="">All</option>
            {SUPPORTED_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="County">
          <select className={inputCls} value={f.county ?? ""} onChange={(e) => set("county", e.target.value || undefined)} disabled={!f.state}>
            <option value="">All</option>
            {counties.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="City">
          <input className={inputCls} value={f.city ?? ""} onChange={(e) => set("city", e.target.value || undefined)} />
        </Field>
        <Field label="ZIP">
          <input className={inputCls} value={f.zip ?? ""} onChange={(e) => set("zip", e.target.value || undefined)} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold text-navy">Class</legend>
        <div className="flex flex-wrap gap-2">
          {CLASSES.map((c) => (
            <Chip key={c.value} active={f.classes.includes(c.value)} onClick={() => toggle("classes", c.value)}>{c.label}</Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold text-navy">Property type</legend>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <Chip key={t.value} active={f.propertyTypes.includes(t.value)} onClick={() => toggle("propertyTypes", t.value)}>{t.label}</Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold text-navy">Foreclosure stage</legend>
        <div className="flex flex-wrap gap-2">
          {FORECLOSURE_STAGES.map((s) => (
            <Chip key={s.value} active={f.stages.includes(s.value)} onClick={() => toggle("stages", s.value)}>{s.label}</Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Auction from"><input type="date" className={inputCls} value={f.auctionFrom ?? ""} onChange={(e) => set("auctionFrom", e.target.value || undefined)} /></Field>
        <Field label="Auction to"><input type="date" className={inputCls} value={f.auctionTo ?? ""} onChange={(e) => set("auctionTo", e.target.value || undefined)} /></Field>
        <Field label="Opening bid min"><input inputMode="numeric" className={inputCls} value={f.openingBidMin ?? ""} onChange={(e) => set("openingBidMin", e.target.value ? Number(e.target.value) : undefined)} /></Field>
        <Field label="Opening bid max"><input inputMode="numeric" className={inputCls} value={f.openingBidMax ?? ""} onChange={(e) => set("openingBidMax", e.target.value ? Number(e.target.value) : undefined)} /></Field>
        <Field label="Est. value min"><input inputMode="numeric" className={inputCls} value={f.valueMin ?? ""} onChange={(e) => set("valueMin", e.target.value ? Number(e.target.value) : undefined)} /></Field>
        <Field label="Est. value max"><input inputMode="numeric" className={inputCls} value={f.valueMax ?? ""} onChange={(e) => set("valueMax", e.target.value ? Number(e.target.value) : undefined)} /></Field>
        <Field label="Est. equity min"><input inputMode="numeric" className={inputCls} value={f.equityMin ?? ""} onChange={(e) => set("equityMin", e.target.value ? Number(e.target.value) : undefined)} /></Field>
        <Field label="Data source">
          <select className={inputCls} value={f.source ?? ""} onChange={(e) => set("source", e.target.value || undefined)}>
            <option value="">All sources</option>
            {ADAPTERS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Sort by">
        <select className={inputCls} value={f.sort} onChange={(e) => set("sort", e.target.value)}>
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>

      <div className="flex gap-2">
        <Button onClick={apply} full>Apply filters</Button>
        <Button onClick={reset} variant="ghost">Reset</Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Button variant="ghost" onClick={() => setOpen(true)} full>
          <SlidersHorizontal size={18} /> Filters
        </Button>
      </div>

      {/* Desktop inline */}
      <div className="hidden rounded-card border border-hairline bg-surface p-4 shadow-soft lg:block">
        {body}
      </div>

      {/* Mobile bottom sheet */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-navy/40" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border-t border-hairline bg-canvas p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-serif text-lg font-semibold text-navy">Filters</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg border border-hairline p-2"><X size={18} /></button>
            </div>
            {body}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent-ink"
          : "border-hairlineStrong bg-surface text-navy-soft hover:border-navy-muted"
      }`}
    >
      {children}
    </button>
  );
}
