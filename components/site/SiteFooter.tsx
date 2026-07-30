import Link from "next/link";
import { SITE } from "@/lib/site";
import { COMPANY } from "@/lib/company";

// One combined platform: Private Debt is a normal internal section (also in the
// primary nav), not a separate site.
const FOOTER_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/private-debt", label: "Private Debt" },
  { href: "/company", label: "About" },
  { href: "/about-data", label: "About Data" },
  { href: "/watchlist", label: "Weekly Watchlist" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-shell px-5 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-serif text-base font-semibold text-navy">{SITE.name}</p>
            <p className="mt-1 text-sm text-navy-muted">{SITE.tagline} — California &amp; Florida.</p>
            <p className="mt-3 text-xs text-navy-muted">
              Operated by {COMPANY.legalName} · NMLS {COMPANY.nmls}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-navy-soft hover:text-navy">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-hairline pt-6 text-xs text-navy-muted">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Property information may change; verify
            independently. Not the auction operator. Not a commitment to lend. Private-debt content
            is not an offer of securities.
          </p>
        </div>
      </div>
    </footer>
  );
}
