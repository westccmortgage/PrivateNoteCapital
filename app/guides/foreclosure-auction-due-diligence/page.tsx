import type { Metadata } from "next";
import Link from "next/link";
import { Shell, Section, Kicker, H2, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Foreclosure Auction Due Diligence Checklist",
  description: "A practical checklist for reviewing California and Florida foreclosure auction opportunities, property risks, title, cash requirements, and financing timelines.",
  alternates: { canonical: "/guides/foreclosure-auction-due-diligence" },
};

const checks = [
  {
    title: "Confirm the auction at its official source",
    detail: "Check the trustee, clerk or applicable auction authority for current date, time, sale status, deposit requirements, bidding rules and postponements. Third-party aggregation can lag.",
  },
  {
    title: "Research title and lien exposure",
    detail: "Have a qualified local title professional or attorney examine ownership, lien priority, judgments, tax claims, surviving encumbrances and recording history. Do not assume foreclosure clears every lien.",
  },
  {
    title: "Investigate occupancy and property condition",
    detail: "Determine whether inspection or access is permitted. Account for unknown repairs, occupants, possession procedures, insurance and restrictions. Never trespass to inspect.",
  },
  {
    title: "Set a maximum all-in acquisition cost",
    detail: "Model the bid, deposits, closing expenses, potential surviving obligations, repairs, carrying costs, taxes, insurance, professional fees and a contingency. Verify values independently.",
  },
  {
    title: "Have capital ready before bidding",
    detail: "Confirm deadlines and acceptable forms of payment with the auction authority. A financing inquiry or conditional review is not a commitment and may not meet auction settlement deadlines.",
  },
  {
    title: "Reconfirm immediately before the sale",
    detail: "Auction statuses, bids and legal proceedings can change rapidly. Verify the record directly with the administering authority immediately before acting.",
  },
];

export default function AuctionDueDiligencePage() {
  return (
    <Shell>
      <Section className="pt-12 sm:pt-16">
        <div className="max-w-3xl">
          <Kicker>Investor education · California &amp; Florida</Kicker>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-navy sm:text-4xl">
            Foreclosure auction due diligence checklist
          </h1>
          <p className="mt-4 text-lg text-navy-muted">
            A useful opportunity starts with a verified record, clear cost assumptions, and a realistic path to settlement — not a headline discount.
          </p>
          <p className="mt-3 text-sm text-navy-muted">
            Auction procedures and buyer risks vary by jurisdiction and sale type. This is general educational information, not legal, title, investment or lending advice.
          </p>
        </div>
      </Section>
      <Section className="py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {checks.map((item, index) => (
            <Card key={item.title} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Step {index + 1}</p>
              <h2 className="mt-2 font-serif text-xl font-semibold text-navy">{item.title}</h2>
              <p className="mt-2 text-sm text-navy-muted">{item.detail}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section className="py-8">
        <div className="max-w-3xl">
          <H2>Research first. Evaluate financing second.</H2>
          <p className="mt-3 text-navy-muted">
            Search available records, then request a financing review tied to a specific property and deadline. We cannot guarantee funding, auction eligibility or data completeness.
          </p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-accent">
            <Link href="/search" className="hover:underline">Search opportunities →</Link>
            <Link href="/financing" className="hover:underline">Request financing review →</Link>
            <Link href="/about-data" className="hover:underline">Understand our data →</Link>
          </div>
        </div>
      </Section>
    </Shell>
  );
}
