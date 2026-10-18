import type { Metadata } from "next";
import Link from "next/link";
import { Section, Kicker, H2, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Florida Official Foreclosure Auction Resources",
  description:
    "Find official Florida county foreclosure auction resources. Verify each sale directly with the responsible county Clerk.",
  alternates: { canonical: "/resources/official-foreclosure-auctions" },
};

type Resource = { name: string; url: string; description: string; note?: string };
const florida: Resource[] = [
  {
    name: "Palm Beach County Clerk — Property Sales",
    url: "https://www.mypalmbeachclerk.com/services/property-sales",
    description:
      "County Clerk guidance for foreclosure sales, access to the official auction calendar, registration, deposits, and procedures.",
  },
  {
    name: "Broward County Clerk — Foreclosure Sales",
    url: "https://www.browardclerk.org/divisions/circuitcivil",
    description:
      "Court information and instructions for foreclosure sales and the county-linked online bidding platform.",
  },
  {
    name: "Miami-Dade County Clerk — Mortgage Foreclosures",
    url: "https://www.miamidadeclerk.gov/clerk/mortgage-foreclosures.page",
    description:
      "Official mortgage foreclosure guidance, auction access, court records and title-search precautions.",
  },
];

function ResourceCards({ items }: { items: Resource[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Card key={item.url} className="p-5">
          <h3 className="font-serif text-xl font-semibold text-navy">{item.name}</h3>
          <p className="mt-2 text-sm text-navy-muted">{item.description}</p>
          {item.note ? <p className="mt-2 text-xs font-medium text-navy-soft">{item.note}</p> : null}
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
            Open official source ↗
          </a>
        </Card>
      ))}
    </div>
  );
}

export default function OfficialForeclosureResources() {
  return (
    <>
      <Section className="pt-12 sm:pt-16">
        <div className="max-w-3xl">
          <Kicker>Official Florida auction resources</Kicker>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-navy sm:text-4xl">
            Official Florida foreclosure auction resources
          </h1>
          <p className="mt-4 text-lg text-navy-muted">
            Verify current auction dates and legal documents with the responsible county clerk,
            trustee, recorder or court. These are external government resources, not Private Note
            Capital listings or automated data feeds.
          </p>
          <p className="mt-3 text-sm text-navy-muted">
            Links reviewed October 2026. Rules, sale statuses and access methods may change.
            Some sites require registration, payment, or in-person record searches.
          </p>
        </div>
      </Section>

      <Section className="py-8">
        <Kicker>Florida · judicial foreclosure sales</Kicker>
        <H2>County clerk auction resources</H2>
        <ResourceCards items={florida} />
      </Section>


      <Section className="py-8">
        <Card className="p-6">
          <H2>Before you bid</H2>
          <p className="mt-3 text-sm text-navy-muted">
            Property descriptions are not guarantees of title, condition, lien priority, or
            availability. Check the official case or trustee notice on the day of action;
            consider independent title, legal, tax and condition review. We do not conduct
            auctions or accept auction deposits.
          </p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-accent">
            <Link href="/guides/foreclosure-auction-due-diligence" className="hover:underline">
              Read the due diligence checklist →
            </Link>
            <Link href="/financing" className="hover:underline">
              Request an acquisition financing review →
            </Link>
            <Link href="/about-data" className="hover:underline">
              How our property data works →
            </Link>
          </div>
        </Card>
      </Section>
    </>
  );
}
