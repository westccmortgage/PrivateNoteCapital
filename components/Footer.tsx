import { COMPANY, telHref } from "@/lib/company";
import { NOT_AN_OFFER, RISK_DISCLOSURE } from "@/lib/trust-deed";

const FOOTER_LINKS = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Guidelines", href: "/#guidelines" },
  { label: "Yield Illustrator", href: "/#illustrator" },
  { label: "Deal Flow", href: "/#deal-flow" },
  { label: "Company", href: "/company" },
  { label: "FAQ", href: "/faq" },
  { label: "Legal & Disclosures", href: "/legal" },
  { label: "Become a Capital Partner", href: "/#request" },
];

export default function Footer() {
  return (
    <footer className="mx-auto mt-20 max-w-engine px-5 pb-12 sm:px-8">
      <div className="border-t border-hairline pt-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-navy">
              PrivateNote<span className="text-gold">Capital</span>
            </span>
            <span className="mt-1 text-[12px] font-medium tracking-wide text-navy-muted">
              California trust-deed investments
            </span>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-navy-muted transition-colors hover:text-navy"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-navy-muted">
          Operated by {COMPANY.legalName} · NMLS&nbsp;#{COMPANY.nmls} · {COMPANY.mailingAddress}
          <br />
          <a href={telHref(COMPANY.phoneOffice)} className="hover:text-navy">
            {COMPANY.phoneOffice}
          </a>{" "}
          ·{" "}
          <a href={`mailto:${COMPANY.email}`} className="hover:text-navy">
            {COMPANY.email}
          </a>
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-navy-muted/80">
          © {new Date().getFullYear()} PrivateNoteCapital, operated by {COMPANY.shortName}. {NOT_AN_OFFER} {RISK_DISCLOSURE}
        </p>
      </div>
    </footer>
  );
}
