import type { Metadata } from "next";
import Link from "next/link";
import { Shell, Card, Kicker } from "@/components/ui";
import { COMPANY, telHref } from "@/lib/company";
import { NOT_AN_OFFER } from "@/lib/trust-deed";

export const metadata: Metadata = {
  title: "About",
  description: "Private Note Capital is operated by West Coast Capital Mortgage Inc. — foreclosure & auction intelligence plus a private-debt capital-partner program.",
};

export default function CompanyPage() {
  return (
    <Shell className="py-10">
      <div className="mx-auto max-w-2xl">
        <Kicker>About</Kicker>
        <h1 className="font-serif text-3xl font-semibold text-navy">One platform, operated by {COMPANY.shortName}</h1>
        <p className="mt-3 text-navy-muted">
          Private Note Capital combines two things real-estate investors need in one place: a
          searchable marketplace of California &amp; Florida foreclosure and auction opportunities,
          and a private-debt capital-partner program for real-estate-secured mortgage notes. Both are
          operated by {COMPANY.legalName}.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <p className="font-serif text-lg font-semibold text-navy">Foreclosure &amp; auction</p>
            <p className="mt-1 text-sm text-navy-muted">
              Search opportunities, track auctions, and request acquisition financing.
            </p>
            <Link href="/search" className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">Search properties →</Link>
          </Card>
          <Card className="p-5">
            <p className="font-serif text-lg font-semibold text-navy">Private debt</p>
            <p className="mt-1 text-sm text-navy-muted">
              Conservatively underwritten, first-position California trust deeds for capital partners.
            </p>
            <Link href="/private-debt" className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">Explore private debt →</Link>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <p className="font-serif text-lg font-semibold text-navy">Company &amp; licensing</p>
          <dl className="mt-3 flex flex-col gap-3 text-[15px]">
            <Row label="Entity" value={`${COMPANY.legalName} · NMLS ${COMPANY.nmls}`} />
            <Row label="Office" value={<a className="text-accent hover:underline" href={telHref(COMPANY.phoneOffice)}>{COMPANY.phoneOffice}</a>} />
            <Row label="Direct" value={<a className="text-accent hover:underline" href={telHref(COMPANY.phoneDirect)}>{COMPANY.phoneDirect}</a>} />
            <Row label="Email" value={<a className="text-accent hover:underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>} />
            <Row label="Mail" value={COMPANY.mailingAddress} />
          </dl>
        </Card>

        <p className="mt-6 text-xs text-navy-muted">{NOT_AN_OFFER}</p>
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3">
      <dt className="font-mono text-[11px] uppercase tracking-wide text-navy-muted">{label}</dt>
      <dd className="text-navy">{value}</dd>
    </div>
  );
}
