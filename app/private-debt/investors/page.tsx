import type { Metadata } from "next";
import { Shell, Kicker, Card } from "@/components/ui";
import { InvestorIntake } from "@/components/private-debt/InvestorIntake";
import { PARTNER_DELIVERABLES, SUITABILITY_NOTE } from "@/lib/trust-deed";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Become a Capital Partner",
  description: "Request information about participating in conservatively underwritten California trust deeds.",
};

export default function InvestorsPage() {
  return (
    <Shell className="py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <Kicker>Private Debt · Investors</Kicker>
          <h1 className="font-serif text-3xl font-semibold text-navy">Become a capital partner</h1>
          <p className="mt-3 text-navy-muted">
            Request information about how our capital partners participate in real-estate-secured
            private mortgage notes. No obligation.
          </p>
          <Card className="mt-6 p-5">
            <p className="font-serif text-lg font-semibold text-navy">With each opportunity you receive</p>
            <ul className="mt-3 flex flex-col gap-2">
              {PARTNER_DELIVERABLES.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-navy-soft">
                  <Check size={16} className="mt-0.5 shrink-0 text-positive" /> {d}
                </li>
              ))}
            </ul>
          </Card>
          <p className="mt-4 text-xs text-navy-muted">{SUITABILITY_NOTE}</p>
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <InvestorIntake />
        </div>
      </div>
    </Shell>
  );
}
