import type { Metadata } from "next";
import Link from "next/link";
import { Section, Card, Kicker, H2, Button } from "@/components/ui";
import { getCaliforniaPublicListings } from "@/lib/california-listings";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "California Investor Property Listings | Private Note Capital",
  description:
    "Explore California properties already publicly listed through West Coast Capital Realty, assess acquisition financing and discuss investment goals. Not a foreclosure-auction database.",
  alternates: { canonical: "/california/investor-opportunities" },
  openGraph: {
    title: "California Investor Property Listings",
    description:
      "Publicly listed California properties and acquisition financing resources. Separate from Florida foreclosure auctions.",
    url: "/california/investor-opportunities",
  },
};

function detail(v: number | null, unit: string): string | null {
  if (v === null) return null;
  return `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${unit}`;
}

function updatedLabel(iso: string | null): string {
  if (!iso) return "Availability subject to confirmation";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Availability subject to confirmation" :
    `CRM updated ${d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`;
}

export default async function CaliforniaInvestorOpportunitiesPage() {
  const feed = await getCaliforniaPublicListings();

  return (
    <>
      <Section className="pt-12 sm:pt-16">
        <div className="max-w-3xl">
          <Kicker>California · Property research &amp; acquisition financing</Kicker>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-navy sm:text-4xl md:text-[44px]">
            California investor property listings
          </h1>
          <p className="mt-4 text-lg text-navy-muted">
            Review properties already offered for sale through the public West Coast Capital
            Realty marketplace. Evaluate a potential acquisition and request a financing
            conversation connected to the property.
          </p>
          <p className="mt-3 text-sm text-navy-muted">
            This is <strong>not</strong> a foreclosure, trustee-sale or auction directory.
            Properties shown here are already-public sale listings, not undisclosed
            PropertyRadar research leads. No listing is presented as a guaranteed investment
            or an indication that an owner will accept an offer.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/financing?type=private_capital&state=CA">
              Review acquisition financing
            </Button>
            <Button href="/private-debt/investors" variant="ghost">
              Capital partner information
            </Button>
          </div>
        </div>
      </Section>

      <Section className="py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker>Public CRM listing feed</Kicker>
            <H2>California properties currently marked for sale</H2>
            <p className="mt-2 text-sm text-navy-muted">
              Only active California sale listings previously published by their CRM
              listing owners are displayed. Source: West Coast Capital Realty.
            </p>
          </div>
          <a
            href="https://westcoastcapitalrealty.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-accent hover:underline"
          >
            Open original marketplace ↗
          </a>
        </div>

        {feed.rows.length > 0 ? (
          <>
            <p className="mb-4 text-xs text-navy-muted">
              Showing {feed.rows.length.toLocaleString("en-US")} public active sale listings
              provided by GRCRM. Availability and prices can change without notice.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {feed.rows.map((p) => {
                const metrics = [
                  detail(p.beds, "beds"),
                  detail(p.baths, "baths"),
                  detail(p.squareFeet, "sq ft"),
                ].filter(Boolean);
                const reviewUrl =
                  `/financing?type=private_capital&state=CA&propertyAddress=${encodeURIComponent(p.address)}`;
                return (
                  <Card className="flex h-full flex-col p-5" key={p.slug}>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-navy-muted">
                      California · Active sale listing
                    </p>
                    <h2 className="mt-2 font-serif text-lg font-semibold text-navy">
                      {p.address}
                    </h2>
                    <p className="mt-1 text-sm text-navy-muted">
                      {[p.city, "CA", p.zip].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-4 text-xl font-semibold text-navy">
                      {p.price !== null ? formatMoney(p.price) : "Price on request"}
                    </p>
                    {metrics.length > 0 ? (
                      <p className="mt-1 text-sm text-navy-soft">
                        {metrics.join(" · ")}
                      </p>
                    ) : null}
                    {p.propertyType ? (
                      <p className="mt-1 text-xs text-navy-muted">{p.propertyType}</p>
                    ) : null}
                    <p className="mt-3 text-xs text-navy-muted">
                      {updatedLabel(p.lastUpdated)}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-3 border-t border-hairline pt-4 text-sm font-semibold">
                      <a
                        href={p.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Verify original listing ↗
                      </a>
                      <Link href={reviewUrl} className="text-accent hover:underline">
                        Financing review →
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="p-6">
            <p className="font-serif text-lg font-semibold text-navy">
              {feed.status === "unavailable"
                ? "The public property feed is temporarily unavailable."
                : "There are no active public sale listings to display right now."}
            </p>
            <p className="mt-2 text-sm text-navy-muted">
              We do not replace unavailable properties with private CRM leads, assumed
              foreclosure listings, fabricated listings or expired sale records.
              Check the original brokerage marketplace or discuss property criteria with us.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/contact">Discuss California property goals</Button>
              <Button href="/financing?type=private_capital&state=CA" variant="ghost">
                Request financing review
              </Button>
            </div>
          </Card>
        )}
      </Section>

      <Section className="py-8">
        <Card className="p-6 sm:p-8">
          <Kicker>Investment research · Separate from listings</Kicker>
          <H2>Evaluate the numbers before making a decision</H2>
          <p className="mt-3 max-w-3xl text-sm text-navy-muted">
            An asking price is not an appraisal, return forecast or assurance of suitability.
            Verify property status, ownership, condition, title, zoning, carrying costs,
            required rehabilitation and a realistic exit strategy with qualified professionals.
            Internal research datasets and owners&apos; personal contact information are
            not published in this directory.
          </p>
          <p className="mt-3 text-sm text-navy-muted">
            For Florida foreclosure court and auction research, use our separate{" "}
            <Link href="/florida/foreclosure-auctions" className="font-semibold text-accent hover:underline">
              Florida county auctions section
            </Link>.
          </p>
        </Card>
      </Section>
    </>
  );
}
