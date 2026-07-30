"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SITE } from "@/lib/site";

// One consolidated navigation. Foreclosure is the primary product; Private Debt
// is a section of the same platform. Watchlist/Saved live in the mobile drawer
// and are reachable from the homepage + footer to keep the header uncluttered.
const NAV = [
  { href: "/search", label: "Search" },
  { href: "/calendar", label: "Calendar" },
  { href: "/financing", label: "Financing" },
  { href: "/private-debt", label: "Private Debt" },
  { href: "/company", label: "About" },
  { href: "/contact", label: "Contact" },
];

// Extra links shown only in the mobile drawer.
const MOBILE_EXTRA = [
  { href: "/watchlist", label: "Weekly Watchlist" },
  { href: "/saved", label: "Saved Properties" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-shell items-center gap-4 px-5 sm:px-6">
        <Link href="/" className="flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="font-serif text-lg font-semibold text-navy">{SITE.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy-muted">
            {SITE.tagline}
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-navy-soft hover:text-navy">
              {n.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-lg border border-hairlineStrong px-3.5 py-1.5 text-sm font-semibold text-navy hover:border-navy-muted"
          >
            Sign In
          </Link>
        </nav>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-hairline bg-canvas lg:hidden" aria-label="Mobile">
          <div className="mx-auto flex max-w-shell flex-col px-5 py-2">
            {[...NAV, ...MOBILE_EXTRA].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="border-b border-hairline py-3 text-[15px] text-navy"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="py-3 text-[15px] font-semibold text-accent"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
