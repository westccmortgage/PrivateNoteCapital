// Site metadata: Florida foreclosure research, California public investor property
// listings, and private debt / capital partner information are separate sections.
// Never classify California CRM / PropertyRadar prospects as foreclosure auctions.

export const SITE = {
  name: "Private Note Capital",
  shortName: "PrivateNoteCapital",
  domain: "privatenotecapital.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://privatenotecapital.com",
  tagline: "Real Estate Investment Intelligence",
  description:
    "Explore Florida foreclosure auctions, California sale listings and real-estate-secured private-capital reviews.",
} as const;

// States supported by the public FORECLOSURE search. California uses a separate route.
export const SUPPORTED_STATES = [
  { code: "FL", name: "Florida" },
] as const;
