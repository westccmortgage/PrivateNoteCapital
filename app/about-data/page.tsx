import type { Metadata } from "next";
import { Shell } from "@/components/ui";

export const metadata: Metadata = {
  title: "About the Data",
  description: "Where property records come from, how they change, and what you must verify.",
};

const POINTS: [string, string][] = [
  ["Where records originate", "Property and auction records are compiled from approved data sources: county public records, permitted county foreclosure-sale exports, and licensed data partners. Every property page names its source and shows when it was last updated."],
  ["Records change", "Foreclosure and auction data is a moving target. Filings are updated, corrected, and withdrawn. A record accurate today may be stale tomorrow."],
  ["Auctions can be postponed or cancelled", "Auction dates are frequently postponed, rescheduled, or cancelled — sometimes the day of sale. Opening bids can change. Always confirm with the official source before acting."],
  ["You must verify independently", "Before pursuing any property you must independently verify title, liens, lien position, occupancy, property taxes, HOA obligations, code violations, court records, and the specific auction's rules, deposit, and payment requirements."],
  ["Estimated values are not appraisals", "Any estimated value, estimated debt, or estimated equity shown is an approximation from source data or a model — not an appraisal, broker price opinion, or guarantee of value or equity."],
  ["Financing is not guaranteed", "Requesting financing starts a review. It is not an approval, pre-approval, or commitment to lend. All financing is subject to underwriting."],
  ["We are not the auction operator", "Private Note Capital is an information and lead-generation platform. We do not conduct auctions, take auction deposits, or transfer title. Auctions are run by the applicable trustee, clerk, or auction operator."],
];

export default function AboutDataPage() {
  return (
    <Shell className="py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold text-navy">About the Data</h1>
        <p className="mt-2 text-navy-muted">
          Transparency about our data is core to how this platform works. Please read this before
          relying on any record.
        </p>
        <div className="mt-6 flex flex-col gap-5">
          {POINTS.map(([h, body]) => (
            <section key={h}>
              <h2 className="font-serif text-lg font-semibold text-navy">{h}</h2>
              <p className="mt-1 text-[15px] text-navy-soft">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </Shell>
  );
}
