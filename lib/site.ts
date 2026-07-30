// Brand config for PrivateNoteCapital.com — ONE combined platform: foreclosure &
// auction intelligence PLUS a private-debt capital-partner section, on a single
// domain. Operated by West Coast Capital Mortgage (legal entity in lib/company.ts).

export const SITE = {
  name: "Private Note Capital",
  shortName: "PrivateNoteCapital",
  domain: "privatenotecapital.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://privatenotecapital.com",
  tagline: "Foreclosure & Auction Intelligence",
  description:
    "Search California & Florida foreclosure and auction opportunities, and explore a private-debt capital-partner program — one platform from Private Note Capital.",
} as const;

// States the platform covers in Phase 1.
export const SUPPORTED_STATES = [
  { code: "CA", name: "California" },
  { code: "FL", name: "Florida" },
] as const;
