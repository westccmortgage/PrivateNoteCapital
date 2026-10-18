import type { Metadata } from "next";
import Link from "next/link";
import { Section, Card, Kicker, H2, Button } from "@/components/ui";
import { FLORIDA_AUCTION_SOURCES, FLORIDA_SOURCES_REVIEWED_AT } from "@/lib/florida-auctions";

export const metadata: Metadata = {
  title: "Florida Foreclosure Auctions by County | Official Clerk Calendars",
  description:
    "Explore official Florida foreclosure auction resources for Palm Beach, Broward, Miami-Dade, Hillsborough, Orange and Duval counties, plus acquisition financing reviews.",
  alternates: { canonical: "/florida/foreclosure-auctions" },
  openGraph: {
    title: "Florida Foreclosure Auctions — County Clerk Sources",
    description:
      "Official county foreclosure auction links and practical due diligence guidance. Separate from the Private Note Capital property database.",
    url: "/florida/foreclosure-auctions",
  },
};

export default function FloridaForeclosureAuctionsPage() {
  return (
    <>
      <Section className="pt-12 sm:pt-16">
        <div className="max-w-3xl">
          <Kicker>Florida · Foreclosure and auction research</Kicker>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-navy sm:text-4xl md:text-[44px]">
            Florida foreclosure auctions: official county sources
          </h1>
          <p className="mt-4 text-lg text-navy-muted">
            Begin your auction research at the court and county Clerk responsible for each
            foreclosure sale. Review auction rules, current dates and case records directly
            with the official source before arranging acquisition capital.
          </p>
          <p className="mt-4 text-sm text-navy-soft">
            <strong>Data status:</strong> These links lead to external government resources.
            We have not imported or verified individual upcoming foreclosure properties into
            Private Note Capital. A county source link is not a current, confirmed sale listing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/search?state=FL">Search our Florida records</Button>
            <Button href="/financing" variant="ghost">Request financing review</Button>
          </div>
        </div>
      </Section>

      <Section className="py-8" id="counties">
        <Kicker>County Clerk and court sources</Kicker>
        <H2>Where to find official Florida auctions</H2>
        <p className="mt-2 max-w-3xl text-sm text-navy-muted">
          Sources reviewed {FLORIDA_SOURCES_REVIEWED_AT}. Auction calendars and available
          information change independently of this page. Opening a link does not mean an
          auction is currently scheduled or a property is available.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FLORIDA_AUCTION_SOURCES.map((source) => (
            <Card key={source.county} className="p-5">
              <p className="font-mono text-xs uppercase tracking-wide text-navy-muted">
                {source.region}
              </p>
              <h2 className="mt-2 font-serif text-xl font-semibold text-navy">
                {source.county} County
              </h2>
              <p className="mt-1 text-xs text-navy-soft">{source.authority}</p>
              <p className="mt-3 text-sm text-navy-muted">{source.description}</p>
              <p className="mt-3 text-xs text-navy-soft">{source.access}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
                <a
                  href={source.clerkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Open official Clerk source ↗
                </a>
                <Link
                  href={`/search?state=FL&county=${encodeURIComponent(source.county)}`}
                  className="text-accent hover:underline"
                >
                  Check our records →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="py-8">
        <Card className="p-6 sm:p-8">
          <Kicker>Underwriting before bidding</Kicker>
          <H2>Plan the transaction, not just the bid</H2>
          <p className="mt-3 max-w-3xl text-sm text-navy-muted">
            Foreclosure purchases may involve unknown liens, occupancy, condition, taxes,
            fees and compressed payment deadlines. A sale can be cancelled or postponed
            on short notice. Verify the court file, sale date and status at the Clerk,
            and consult qualified local title and legal professionals.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-accent">
            <Link className="hover:underline" href="/guides/foreclosure-auction-due-diligence">
              Due diligence checklist →
            </Link>
            <Link className="hover:underline" href="/about-data">
              Data and source disclosures →
            </Link>
            <Link className="hover:underline" href="/private-debt">
              Learn about private note capital →
            </Link>
          </div>
        </Card>
      </Section>
      <Section className="py-8">
        <Card className="p-6 sm:p-8">
          <Kicker>Acquisition and bridge financing</Kicker>
          <H2>Need to review funding before an auction?</H2>
          <p className="mt-3 text-sm text-navy-muted">
            Share your target property, county, acquisition plan, equity contribution,
            intended use and required closing date. Every request is subject to
            eligibility and underwriting; submitting an inquiry is not a commitment
            to lend and may not satisfy an auction's payment requirements.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/financing?type=auction_acquisition">Request acquisition review</Button>
            <Button href="/contact" variant="ghost">Contact our team</Button>
          </div>
        </Card>
      </Section>
    </>
  );
}
