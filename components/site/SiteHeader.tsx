"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/hard-money-loans", label: "Hard Money Loans" },
  { href: "/florida/foreclosure-auctions", label: "Florida Auctions" },
  { href: "/california/investor-opportunities", label: "California Listings" },
  { href: "/private-debt", label: "Private Debt" },
  { href: "/company", label: "About" },
];

// Extra links shown only in the mobile drawer.
const MOBILE_EXTRA = [
  { href: "/financing", label: "Request financing" },
  { href: "/search", label: "Florida foreclosure search" },
  { href: "/calendar", label: "Florida auction calendar" },
  { href: "/watchlist", label: "Weekly watchlist" },
  { href: "/saved", label: "Saved properties" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "/";
  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-field text-white">
      <div className="mx-auto flex h-[68px] max-w-shell items-center gap-6 px-5 sm:px-6">
        <Link href="/" className="font-serif text-[21px] font-black tracking-display" onClick={() => setOpen(false)}>
          Private Note <span className="text-signal">Capital</span>
          <span className="sr-only"> home</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-[15px] font-semibold transition-colors ${
                isActive(n.href) ? "text-signal" : "text-white/85 hover:text-white"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/login" className="px-3 py-2 text-[15px] font-semibold text-white/85 hover:text-white">
            Sign in
          </Link>
          <Link
            href="/financing"
            className="ml-2 rounded-md bg-signal px-5 py-2.5 text-[15px] font-bold text-signal-ink hover:bg-signal-hover"
          >
            Get terms
          </Link>
        </nav>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md border border-field-line lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-field-line bg-field lg:hidden" aria-label="Mobile">
          <div className="mx-auto flex max-w-shell flex-col px-5 pb-5 pt-1">
            {[...NAV, ...MOBILE_EXTRA].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="border-b border-field-line py-3.5 text-[17px] font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="border-b border-field-line py-3.5 text-[17px] font-semibold text-white/80"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/financing"
              className="mt-5 rounded-md bg-signal py-3.5 text-center text-[17px] font-bold text-signal-ink"
              onClick={() => setOpen(false)}
            >
              Get terms on a deal
            </Link>
          </div>
        </nav>
      ) : null}
      <span className="sr-only">{SITE.tagline}</span>
    </header>
  );
}
