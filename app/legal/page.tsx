import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { COMPANY, telHref } from "@/lib/company";
import { SITE } from "@/lib/site";
import { NOT_AN_OFFER, RISK_DISCLOSURE, SUITABILITY_NOTE } from "@/lib/trust-deed";

export const metadata: Metadata = {
  title: "Legal & Disclosures — PrivateNoteCapital",
  description:
    "Important disclosures for PrivateNoteCapital: not an offer of securities, investment risk, suitability, trust-deed risks, no advisory relationship, communications consent, and privacy.",
};

const EFFECTIVE = "June 30, 2026";

interface Sec {
  id: string;
  heading: string;
  body: string[];
}

const SECTIONS: Sec[] = [
  {
    id: "overview",
    heading: "Overview",
    body: [
      `PrivateNoteCapital is a brand operated by ${COMPANY.legalName} (NMLS #${COMPANY.nmls}). This website provides general information about private mortgage notes (trust deeds) secured by California real estate. Please read these disclosures carefully.`,
      `The information here is educational and is provided "as is." It is not investment, legal, accounting, or tax advice, and it does not take your individual circumstances into account.`,
    ],
  },
  {
    id: "not-an-offer",
    heading: "Not an offer",
    body: [
      NOT_AN_OFFER,
      `No content on this site constitutes an offer, recommendation, or solicitation with respect to any security, note, fund, or investment in any jurisdiction where such an offer or solicitation would be unlawful. Any investment opportunity, if and when available, is made only through definitive written documents.`,
    ],
  },
  {
    id: "risk",
    heading: "Investment risk",
    body: [
      RISK_DISCLOSURE,
      `Private mortgage / trust-deed investments are illiquid, are not insured by any government agency, and may not be suitable for every investor. You could lose some or all of your capital and expected income.`,
    ],
  },
  {
    id: "suitability",
    heading: "Suitability",
    body: [
      SUITABILITY_NOTE,
      `You are responsible for determining whether any opportunity is appropriate for you, and you should consult your own independent financial, legal, and tax advisors before making any decision.`,
    ],
  },
  {
    id: "trust-deed-risks",
    heading: "Specific trust-deed risks",
    body: [
      `Borrower default: a borrower may fail to pay as agreed, which can require servicing, workout, or foreclosure and can delay or reduce returns.`,
      `Collateral value: real estate values can decline; a conservative loan-to-value is a cushion, not a guarantee, and market conditions can erode equity.`,
      `Lien priority and title: recovery depends on lien position and clean title; senior liens, encumbrances, or title defects can affect outcomes.`,
      `Liquidity and term: notes are held for a term and are not readily saleable; your capital may be committed until payoff.`,
      `Concentration: participating in a limited number of notes concentrates risk in specific properties and borrowers.`,
    ],
  },
  {
    id: "no-advice",
    heading: "No advisory relationship",
    body: [
      `Using this site or requesting information does not create an investment-advisory, fiduciary, broker-dealer, or agency relationship. We do not provide personalized investment advice through this site.`,
      `Any figures, ranges, or illustrations shown (including the Yield Illustrator) are neutral arithmetic examples only — not quotes, projections, or promises, and not indicative of any actual opportunity or result.`,
    ],
  },
  {
    id: "communications",
    heading: "Communications & consent",
    body: [
      `By submitting a request, you consent to be contacted by ${COMPANY.legalName} by phone, email, or text about capital-partner opportunities. Message and data rates may apply; you can opt out at any time by replying STOP or contacting us.`,
      `We identify ourselves accurately in communications and honor opt-out requests. Requesting information places you under no obligation.`,
    ],
  },
  {
    id: "privacy",
    heading: "Privacy",
    body: [
      `We collect the information you submit (such as name, email, phone, and preferences) to respond to your request and, where appropriate, to share relevant opportunities. We do not sell your personal information.`,
      `Information you provide may be handled within our customer-relationship system and shared with licensed professionals involved in reviewing opportunities. California residents have rights under the CCPA/CPRA, including the right to know, delete, and correct — contact us to exercise them.`,
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    body: [
      `${COMPANY.legalName} · NMLS #${COMPANY.nmls}`,
      `${COMPANY.mailingAddress}`,
      `Phone ${COMPANY.phoneOffice} · ${COMPANY.email}`,
      `Verify licensing at the NMLS Consumer Access website (nmlsconsumeraccess.org).`,
    ],
  },
];

export default function Legal() {
  return (
    <PageShell
      eyebrow="Legal & Disclosures"
      title="Important disclosures."
      intro={`Effective ${EFFECTIVE}. Please read these carefully — they govern your use of ${SITE.name} and the information presented here.`}
    >
      <nav className="glass-card mb-8 rounded-card p-5 shadow-soft">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-navy-muted">
          On this page
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-[13.5px] font-medium text-navy-soft hover:text-navy">
                {s.heading}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="glass-card scroll-mt-24 rounded-card p-6 shadow-soft sm:p-8"
          >
            <h2 className="text-[18px] font-semibold tracking-tight text-navy">{s.heading}</h2>
            <div className="mt-3 space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="text-[14.5px] leading-relaxed text-navy-muted">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-[12.5px] leading-relaxed text-navy-muted">
        <a href={telHref(COMPANY.phoneOffice)} className="font-medium text-navy hover:underline">
          {COMPANY.phoneOffice}
        </a>{" "}
        · {COMPANY.legalName} · NMLS #{COMPANY.nmls}
      </p>
    </PageShell>
  );
}
