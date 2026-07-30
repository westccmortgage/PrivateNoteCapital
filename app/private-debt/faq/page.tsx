import type { Metadata } from "next";
import { Shell } from "@/components/ui";
import { NOT_AN_OFFER, RISK_DISCLOSURE } from "@/lib/trust-deed";

export const metadata: Metadata = {
  title: "Private Debt FAQ",
  description: "Common questions about Private Note Capital's trust-deed / private-note capital-partner program.",
};

const FAQ: [string, string][] = [
  ["What is a trust-deed / private-note investment?", "A private mortgage note secured by a recorded deed of trust against real estate. The note pays interest, typically interest-only, with principal returned at payoff. The property is the collateral."],
  ["What loan-to-value do you target?", "Conservative leverage — generally up to about 65% LTV on a first deed of trust, lower for specialized collateral. A meaningful equity cushion sits beneath every note."],
  ["First position or second?", "We emphasize first-position deeds of trust — the senior, first-to-be-repaid claim. Subordinate positions are considered only selectively and underwritten to combined leverage."],
  ["Are returns guaranteed?", "No. Yields are not guaranteed, and these investments involve risk including possible loss of principal and expected income. Nothing here is a projection or promise of any return."],
  ["Is requesting information an obligation?", "No. Requesting information creates no obligation and is not an agreement to invest. Any opportunity, if and when available, is offered only through definitive documents and only to investors for whom it is suitable."],
  ["Who operates the program?", "West Coast Capital Mortgage Inc. (NMLS 2817729). Each file is reviewed by licensed professionals before it is presented to a capital partner."],
];

export default function PrivateDebtFaqPage() {
  return (
    <Shell className="py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold text-navy">Private Debt — FAQ</h1>
        <div className="mt-6 flex flex-col gap-5">
          {FAQ.map(([q, a]) => (
            <section key={q}>
              <h2 className="font-serif text-lg font-semibold text-navy">{q}</h2>
              <p className="mt-1 text-[15px] text-navy-soft">{a}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 border-t border-hairline pt-4 text-xs text-navy-muted">
          <p>{NOT_AN_OFFER}</p>
          <p className="mt-2">{RISK_DISCLOSURE}</p>
        </div>
      </div>
    </Shell>
  );
}
