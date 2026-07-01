"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Info } from "lucide-react";
import { illustrateYield, ILLUSTRATOR_BOUNDS, ILLUSTRATOR_DISCLAIMER } from "@/lib/trust-deed";

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function Field({
  label,
  suffix,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  suffix?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-[12px] font-semibold uppercase tracking-wide text-navy-muted">
          {label}
        </label>
        <span className="text-[15px] font-semibold text-navy">
          {suffix === "$" ? money(value) : `${value}${suffix ?? ""}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-navy"
      />
    </div>
  );
}

export default function YieldIllustrator() {
  const [principal, setPrincipal] = useState<number>(ILLUSTRATOR_BOUNDS.principal.default);
  const [rate, setRate] = useState<number>(ILLUSTRATOR_BOUNDS.rate.default);
  const [term, setTerm] = useState<number>(ILLUSTRATOR_BOUNDS.term.default);

  const r = useMemo(() => illustrateYield(principal, rate, term), [principal, rate, term]);

  return (
    <div className="glass-card overflow-hidden rounded-card shadow-lift">
      <div className="flex items-center justify-between border-b border-hairline bg-white/50 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Gauge size={19} />
          </span>
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-navy">
              Trust-Deed Yield Illustrator
            </h3>
            <p className="text-[12.5px] text-navy-muted">Illustrative arithmetic · not an offer</p>
          </div>
        </div>
        <span className="hidden rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold sm:inline-block">
          Illustration
        </span>
      </div>

      <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-8">
        <div className="space-y-6">
          <Field
            label="Investment amount"
            suffix="$"
            value={principal}
            min={ILLUSTRATOR_BOUNDS.principal.min}
            max={1_000_000}
            step={ILLUSTRATOR_BOUNDS.principal.step}
            onChange={setPrincipal}
          />
          <Field
            label="Note rate"
            suffix="%"
            value={rate}
            min={ILLUSTRATOR_BOUNDS.rate.min}
            max={ILLUSTRATOR_BOUNDS.rate.max}
            step={ILLUSTRATOR_BOUNDS.rate.step}
            onChange={setRate}
          />
          <Field
            label="Term (months)"
            suffix=" mo"
            value={term}
            min={ILLUSTRATOR_BOUNDS.term.min}
            max={ILLUSTRATOR_BOUNDS.term.max}
            step={ILLUSTRATOR_BOUNDS.term.step}
            onChange={setTerm}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            key={r.monthlyIncome}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="col-span-2 rounded-2xl border border-gold/25 bg-gold/[0.07] p-5"
          >
            <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-muted">
              Illustrative monthly income
            </p>
            <p className="mt-1 text-[30px] font-semibold tracking-tight text-navy">
              {money(r.monthlyIncome)}
            </p>
          </motion.div>
          <div className="rounded-2xl border border-hairline bg-white/70 p-4">
            <p className="text-[11.5px] font-medium uppercase tracking-wide text-navy-muted">
              Per year
            </p>
            <p className="mt-1 text-[19px] font-semibold text-navy">{money(r.annualIncome)}</p>
          </div>
          <div className="rounded-2xl border border-hairline bg-white/70 p-4">
            <p className="text-[11.5px] font-medium uppercase tracking-wide text-navy-muted">
              Over the term
            </p>
            <p className="mt-1 text-[19px] font-semibold text-navy">{money(r.totalInterest)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 border-t border-hairline bg-white/40 px-6 py-4 sm:px-8">
        <Info size={15} className="mt-0.5 shrink-0 text-navy-muted" />
        <p className="text-[12px] leading-relaxed text-navy-muted">{ILLUSTRATOR_DISCLAIMER}</p>
      </div>
    </div>
  );
}
