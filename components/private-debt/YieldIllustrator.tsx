"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { illustrateYield, ILLUSTRATOR_BOUNDS, ILLUSTRATOR_DISCLAIMER } from "@/lib/trust-deed";

// Neutral interest-only arithmetic illustration. Not a quote, offer, or promise.
// Styled in the shared design system (navy/accent on ivory).
export function YieldIllustrator() {
  const [principal, setPrincipal] = useState<number>(ILLUSTRATOR_BOUNDS.principal.default);
  const [rate, setRate] = useState<number>(ILLUSTRATOR_BOUNDS.rate.default);
  const [term, setTerm] = useState<number>(ILLUSTRATOR_BOUNDS.term.default);

  const y = useMemo(() => illustrateYield(principal, rate, term), [principal, rate, term]);

  return (
    <Card className="p-5 sm:p-6">
      <p className="font-serif text-lg font-semibold text-navy">Illustrate interest-only income</p>
      <p className="mt-1 text-sm text-navy-muted">
        Move the sliders to see a neutral arithmetic example. Illustration only.
      </p>

      <div className="mt-5 grid gap-5">
        <Slider label="Principal" value={principal} display={formatMoney(principal)}
          min={ILLUSTRATOR_BOUNDS.principal.min} max={ILLUSTRATOR_BOUNDS.principal.max}
          step={ILLUSTRATOR_BOUNDS.principal.step} onChange={setPrincipal} />
        <Slider label="Annual rate" value={rate} display={`${rate}%`}
          min={ILLUSTRATOR_BOUNDS.rate.min} max={ILLUSTRATOR_BOUNDS.rate.max}
          step={ILLUSTRATOR_BOUNDS.rate.step} onChange={setRate} />
        <Slider label="Term" value={term} display={`${term} mo`}
          min={ILLUSTRATOR_BOUNDS.term.min} max={ILLUSTRATOR_BOUNDS.term.max}
          step={ILLUSTRATOR_BOUNDS.term.step} onChange={setTerm} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Monthly" value={formatMoney(y.monthlyIncome)} />
        <Stat label="Annual" value={formatMoney(y.annualIncome)} />
        <Stat label="Over term" value={formatMoney(y.totalInterest)} />
      </div>

      <p className="mt-4 text-xs text-navy-muted">{ILLUSTRATOR_DISCLAIMER}</p>
    </Card>
  );
}

function Slider({
  label, value, display, min, max, step, onChange,
}: {
  label: string; value: number; display: string; min: number; max: number; step: number; onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-navy-muted">{label}</span>
        <span className="tnum text-[15px] font-semibold text-navy">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full accent-accent"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-3 text-center">
      <p className="font-mono text-[10px] uppercase tracking-wide text-navy-muted">{label}</p>
      <p className="tnum mt-0.5 text-[15px] font-semibold text-navy">{value}</p>
    </div>
  );
}
