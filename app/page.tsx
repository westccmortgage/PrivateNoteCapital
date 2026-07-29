import Link from "next/link";
import { ShieldCheck, Search as SearchIcon, CalendarClock, Banknote } from "lucide-react";
import { Shell, Section, H2, Kicker, Button, Card } from "@/components/ui";
import { SearchControls } from "@/components/search/SearchControls";
import { PropertyCard } from "@/components/search/PropertyCard";
import { getHomeSections } from "@/lib/opportunities";
import { FINANCING_TYPES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const FINANCING_BLURB: Record<string, string> = {
  auction_acquisition: "Capital positioned to close at the auction.",
  bridge: "Short-term capital to secure the property now.",
  fix_and_flip: "Purchase + renovation for a resale exit.",
  rehabilitation: "Funding the rehab on a property you control.",
  dscr_takeout: "Refinance into long-term rental financing.",
  private_capital: "A direct review by a private-capital source.",
};

export default async function HomePage() {
  const sections = await getHomeSections();

  return (
    <>
      {/* Hero */}
      <Section className="pt-12 sm:pt-16">
        <div className="max-w-3xl">
          <Kicker>California &amp; Florida</Kicker>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-navy sm:text-4xl md:text-[44px]">
            Search California &amp; Florida Foreclosure Opportunities
          </h1>
          <p className="mt-4 text-lg text-navy-muted">
            Track upcoming auctions, review available property information, save
            opportunities, and request acquisition financing.
          </p>
          <p className="mt-3 font-serif text-base text-navy-soft">
            Find the property. Track the auction. Analyze the opportunity. Arrange the capital.
          </p>
        </div>

        <div className="mt-8">
          <SearchControls />
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-muted">
          <span className="inline-flex items-center gap-1.5"><SearchIcon size={15} /> Search without an account</span>
          <span className="inline-flex items-center gap-1.5"><CalendarClock size={15} /> Auction dates &amp; changes</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} /> Every record shows its source</span>
        </div>
      </Section>

      {/* Opportunity sections — only rendered when real records exist */}
      {sections.length > 0 ? (
        sections.map((s) => (
          <Section key={s.key} className="py-8">
            <div className="mb-4 flex items-end justify-between">
              <H2>{s.title}</H2>
              <Link href="/search" className="text-sm font-semibold text-accent hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {s.rows.map((p) => (
                <PropertyCard key={p.id} p={p} />
              ))}
            </div>
          </Section>
        ))
      ) : (
        <Section className="py-8">
          <Card className="p-6">
            <p className="font-serif text-lg text-navy">Opportunities appear here as data is imported.</p>
            <p className="mt-2 max-w-2xl text-sm text-navy-muted">
              Listings are shown only from real, approved data sources — never fabricated.
              Start a search to set your criteria, or subscribe to the weekly watchlist and
              we&apos;ll notify you when matching auctions are added.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button href="/search" size="sm">Open search</Button>
              <Button href="/watchlist" variant="ghost" size="sm">Get weekly watchlist</Button>
            </div>
          </Card>
        </Section>
      )}

      {/* Financing paths */}
      <Section id="financing" className="border-t border-hairline">
        <Kicker>Arrange the capital</Kicker>
        <H2>Financing built for acquisition</H2>
        <p className="mt-2 max-w-2xl text-navy-muted">
          Start a short review connected to the property you&apos;re pursuing. Financing is
          subject to review and not guaranteed.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FINANCING_TYPES.map((f) => (
            <Link
              key={f.value}
              href={`/financing?type=${f.value}`}
              className="group rounded-card border border-hairline bg-surface p-4 shadow-soft transition-colors hover:border-navy-muted"
            >
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-accent" />
                <p className="font-semibold text-navy">{f.label}</p>
              </div>
              <p className="mt-1.5 text-sm text-navy-muted">{FINANCING_BLURB[f.value]}</p>
              <p className="mt-3 text-sm font-semibold text-accent group-hover:underline">Request review →</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
