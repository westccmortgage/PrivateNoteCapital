import type { Metadata } from "next";
import { Shell } from "@/components/ui";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms governing use of the Private Note Capital foreclosure & auction platform.",
};

export default function TermsPage() {
  return (
    <Shell className="py-10">
      <article className="mx-auto max-w-2xl text-[15px] leading-relaxed text-navy-soft">
        <h1 className="font-serif text-3xl font-semibold text-navy">Terms of Use</h1>
        <p className="mt-2 text-sm text-navy-muted">Operated by {COMPANY.legalName} (NMLS {COMPANY.nmls}).</p>

        <Sec title="Information only; no advice">
          This platform provides property, foreclosure, and auction information for real-estate
          investors and professionals. Nothing here is legal, tax, investment, or financial advice, and
          nothing constitutes a recommendation to buy or bid on any property.
        </Sec>
        <Sec title="No warranty on data">
          Property records come from third-party and public sources and may be incomplete, out of date,
          or inaccurate. Auction dates and opening bids change and sales are frequently postponed or
          cancelled. We provide the information &ldquo;as is&rdquo; without warranty. You are responsible
          for independently verifying every material fact — title, liens, occupancy, taxes, HOA
          obligations, court records, and auction requirements — before acting.
        </Sec>
        <Sec title="Not the auction operator">
          {COMPANY.shortName} is not a trustee, county clerk, or auction operator. We do not conduct
          sales, hold deposits, or convey title. Auctions are governed by the applicable operator&apos;s
          rules.
        </Sec>
        <Sec title="Financing is not guaranteed">
          Financing requests initiate a review only. They are not an approval, pre-approval, rate lock,
          or commitment to lend, and all financing is subject to underwriting and applicable law. Any
          mortgage lending activity is conducted by {COMPANY.legalName} under NMLS {COMPANY.nmls}.
        </Sec>
        <Sec title="Accounts & acceptable use">
          You are responsible for the security of your account and for the accuracy of the information
          you submit. You agree not to scrape, resell, or redistribute data from the platform, not to
          submit false information, and not to use the site to target or harass homeowners.
        </Sec>
        <Sec title="Third-party & affiliate links">
          The site may link to third-party sources and may include affiliate links. We are not
          responsible for third-party content, and following such links is at your own risk.
        </Sec>
        <Sec title="Limitation of liability">
          To the fullest extent permitted by law, {COMPANY.legalName} is not liable for any loss arising
          from your use of, or reliance on, information provided through this platform.
        </Sec>
        <Sec title="Changes">
          We may update these terms from time to time. Continued use of the platform constitutes
          acceptance of the current terms.
        </Sec>
        <Sec title="Contact">
          {COMPANY.legalName}, {COMPANY.mailingAddress}. Email {COMPANY.email}.
        </Sec>
      </article>
    </Shell>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="font-serif text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-1">{children}</p>
    </section>
  );
}
