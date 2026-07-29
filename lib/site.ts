// Brand config for PrivateNoteCapital.com — the public Foreclosure & Auction
// Intelligence platform. Operated by West Coast Capital Mortgage (legal entity in
// lib/company.ts). The private-debt investor app now lives on the debt subdomain.

export const SITE = {
  name: "Private Note Capital",
  shortName: "PrivateNoteCapital",
  domain: "privatenotecapital.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://privatenotecapital.com",
  tagline: "Foreclosure & Auction Intelligence",
  description:
    "Search California & Florida foreclosure and auction opportunities. Track upcoming auctions, review property information, save opportunities, and request acquisition financing.",
  // Single small footer link to the preserved private-debt investor platform.
  debtPlatformUrl:
    process.env.NEXT_PUBLIC_DEBT_PLATFORM_URL || "https://debt.privatenotecapital.com",
} as const;

// States the platform covers in Phase 1.
export const SUPPORTED_STATES = [
  { code: "CA", name: "California" },
  { code: "FL", name: "Florida" },
] as const;
