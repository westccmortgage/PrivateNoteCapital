// Brand config for PrivateNoteCapital — operated by West Coast Capital Mortgage
// (the legal entity lives in lib/company.ts). Keep brand strings here so the
// same foundation can be re-skinned for the next sites.

export const SITE = {
  name: "PrivateNoteCapital",
  domain: "privatenotecapital.com",
  url: "https://privatenotecapital.com",
  tagline: "Conservatively underwritten California trust-deed investments.",
  description:
    "PrivateNoteCapital connects capital partners with conservatively underwritten, real-estate-secured private mortgage notes (trust deeds) in California — operated by West Coast Capital Mortgage.",
} as const;

// Scheduling link for "talk to a representative" (override in Netlify).
export const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL || "https://calendly.com/westccmortgage/deal-review";
