import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileText, Landmark } from "lucide-react";
import { Shell, Section, H2, Kicker, Button, Card } from "@/components/ui";
import { YieldIllustrator } from "@/components/private-debt/YieldIllustrator";
import { UNDERWRITING_GUIDELINES, NOT_AN_OFFER, RISK_DISCLOSURE } from "@/lib/trust-deed";

export const metadata: Metadata = {
  title: "Private Debt",
  description:
    "Private Note Capital's capital-partner program: conservatively underwritten, real-estate-secured California trust deeds. Not an offer of securities.",
};

export default function PrivateDebtPage() {
  return (
    <>
      <Section className="pt-12 sm:pt-16">
        <div className="max-w-3xl">
          <Kicker>Private Debt · Capital partners</Kicker>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-navy sm:text-4xl">
            Conservatively underwritten California trust deeds
          </h1>
          <p className="mt-4 text-lg text-navy-muted">
            Alongside our foreclosure marketplace, Private Note Capital connects capital partners
            with real-estate-secured private mortgage notes — first-position, low-LTV, documented.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button href="/private-debt/investors">Become a capital partner</Button>
            <Button href="/private-debt/review" variant="ghost">Request a consultation</Button>
          </div>
        </div>
      </Section>

      <Section className="py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Low loan-to-value", d: "Generally up to ~65% LTV on a 1st deed of trust, with an equity cushion beneath every note." },
            { icon: Landmark, t: "First-position priority", d: "Senior, first-to-be-repaid claims against recorded California real estate." },
            { icon: FileText, t: "Documented exit", d: "Underwritten to a realistic repayment — sale, refinance, or term payoff." },
          ].map((c) => (
            <Card key={c.t} className="p-5">
              <c.icon size={20} className="text-accent" />
              <p className="mt-2 font-serif text-lg font-semibold text-navy">{c.t}</p>
              <p className="mt-1 text-sm text-navy-muted">{c.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <Kicker>How we underwrite</Kicker>
            <H2>Discipline before yield</H2>
            <div className="mt-5 flex flex-col gap-4">
              {UNDERWRITING_GUIDELINES.map((g) => (
                <div key={g.title}>
                  <p className="font-semibold text-navy">{g.title}</p>
                  <p className="mt-0.5 text-sm text-navy-muted">{g.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <YieldIllustrator />
          </div>
        </div>
      </Section>

      <Section className="py-8">
        <Card className="p-5">
          <p className="text-sm text-navy-muted">{NOT_AN_OFFER}</p>
          <p className="mt-2 text-sm text-navy-muted">{RISK_DISCLOSURE}</p>
          <p className="mt-3 text-sm">
            <Link href="/private-debt/faq" className="font-semibold text-accent hover:underline">Read the FAQ →</Link>
          </p>
        </Card>
      </Section>
    </>
  );
}
