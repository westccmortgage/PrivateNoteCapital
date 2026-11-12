// Site metadata: Florida foreclosure research, California public investor property
// listings, and private debt / capital partner information are separate sections.
// Never classify California CRM / PropertyRadar prospects as foreclosure auctions.

export const SITE = {
  name: "Private Note Capital",
  shortName: "PrivateNoteCapital",
  domain: "privatenotecapital.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://privatenotecapital.com",
  tagline: "Hard Money Loans for Real Estate Investors",
  description:
    "Hard money loans for fix and flip, ground-up construction, bridge and DSCR rentals, with Florida foreclosure auction research and California investor listings.",
} as const;

// States supported by the public FORECLOSURE search. California uses a separate route.
export const SUPPORTED_STATES = [
  { code: "FL", name: "Florida" },
] as const;
