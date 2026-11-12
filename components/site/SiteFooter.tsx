import Link from "next/link";
import { SITE } from "@/lib/site";
import { COMPANY, telHref } from "@/lib/company";

const COLUMNS = [
  {
    title: "Loans",
    links: [
      { href: "/hard-money-loans", label: "Hard money loans" },
      { href: "/hard-money-loans#fix-and-flip", label: "Fix and flip" },
      { href: "/hard-money-loans#construction", label: "Ground-up construction" },
      { href: "/hard-money-loans#bridge", label: "Bridge loans" },
      { href: "/hard-money-loans#dscr", label: "DSCR rental loans" },
      { href: "/financing", label: "Request financing" },
    ],
  },
  {
    title: "Find a property",
    links: [
      { href: "/florida/foreclosure-auctions", label: "Florida auctions" },
      { href: "/search", label: "Foreclosure search" },
      { href: "/calendar", label: "Auction calendar" },
      { href: "/california/investor-opportunities", label: "California listings" },
      { href: "/watchlist", label: "Weekly watchlist" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/company", label: "About" },
      { href: "/private-debt", label: "Private debt" },
      { href: "/about-data", label: "About our data" },
      { href: "/resources/official-foreclosure-auctions", label: "Official auction sources" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-field-deep text-field-text">
      <div className="mx-auto max-w-shell px-5 pb-10 pt-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-[22px] font-black tracking-display text-white">
              Private Note <span className="text-signal">Capital</span>
            </p>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed">
              Hard money for investors who buy, fix, build and rent. Florida auction research and
              California listings in the same place.
            </p>
            <a href={telHref(COMPANY.phoneOffice)} className="mt-5 inline-block text-lg font-bold text-white hover:text-signal">
              {COMPANY.phoneOffice}
            </a>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-[15px] font-bold text-white">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15px] hover:text-white hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-field-line pt-6 text-[13px] leading-relaxed text-field-text/80">
          <p>
            {SITE.name} is operated by {COMPANY.legalName}, NMLS #{COMPANY.nmls}, CA DRE corporation license #
            {COMPANY.dreCorporationLicense}. {COMPANY.mailingAddress}.
          </p>
          <p className="mt-2">
            Loans are for business purposes on non-owner-occupied investment property. Figures on this site are
            program maximums, not an offer or a commitment to lend. Property information can change, so verify it
            yourself. We are not the auction operator. Private debt content is not an offer of securities. Equal
            Housing Opportunity.
          </p>
          <p className="mt-2">&copy; {new Date().getFullYear()} {SITE.name}</p>
        </div>
      </div>
    </footer>
  );
}
