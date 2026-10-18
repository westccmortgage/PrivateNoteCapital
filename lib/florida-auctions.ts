/**
 * Florida official courthouse / foreclosure auction directory.
 *
 * Curated links only. Each URL is a Clerk-hosted information page;
 * these are NOT imported listings, and no machine-readable reuse is implied.
 * Reviewed against official county Clerk pages on 2026-10-18.
 */
export interface FloridaCountyAuctionSource {
  county: string;
  region: string;
  clerkUrl: string;
  authority: string;
  description: string;
  access: string;
}

export const FLORIDA_AUCTION_SOURCES: readonly FloridaCountyAuctionSource[] = [
  {
    county: "Palm Beach",
    region: "South Florida",
    clerkUrl: "https://www.mypalmbeachclerk.com/departments/courts/foreclosures",
    authority: "Palm Beach County Clerk of the Circuit Court & Comptroller",
    description: "Official judicial foreclosure sale guidance and links to the county auction calendar.",
    access: "The live auction calendar is managed through the Clerk's designated auction system. Do not confuse new foreclosure filings with scheduled sales.",
  },
  {
    county: "Broward",
    region: "South Florida",
    clerkUrl: "https://www.browardclerk.org/Divisions/CircuitCivil",
    authority: "Broward County Clerk of Courts",
    description: "County judicial foreclosure sale procedures, court case records and access to online foreclosure auctions.",
    access: "The Clerk also offers paid Commercial Data Access for case records; access to data does not automatically authorize republication.",
  },
  {
    county: "Miami-Dade",
    region: "South Florida",
    clerkUrl: "https://www.miamidadeclerk.gov/clerk/mortgage-foreclosures.page",
    authority: "Miami-Dade Clerk of the Court and Comptroller",
    description: "Mortgage foreclosure auction entry point, court records and bidder due diligence information.",
    access: "The county has a separate paid Commercial Data Services product for automated file downloads.",
  },
  {
    county: "Hillsborough",
    region: "Tampa Bay",
    clerkUrl: "https://www.hillsclerk.com/court-services/foreclosure-sales",
    authority: "Hillsborough County Clerk of Court & Comptroller",
    description: "Foreclosure sales information and links to the official Hillsborough online sale calendar.",
    access: "Verify sale requirements, opening bids and cancellations with the Clerk's auction site.",
  },
  {
    county: "Orange",
    region: "Central Florida",
    clerkUrl: "https://www.myorangeclerk.com/Divisions/Civil/Foreclosures",
    authority: "Orange County Clerk of Courts",
    description: "Official foreclosure information with a link to Online Foreclosure Sales.",
    access: "Use the Clerk-linked auction service; the court case search may require CAPTCHA or registration.",
  },
  {
    county: "Duval",
    region: "Northeast Florida",
    clerkUrl: "https://www.duvalclerk.gov/departments/civil-court-services/foreclosure",
    authority: "Duval County Clerk of Courts",
    description: "Jacksonville-area foreclosure auction schedules, case research, deposits and settlement rules.",
    access: "The Clerk links to Duval's official online foreclosure auction service.",
  },
] as const;

export const FLORIDA_SOURCES_REVIEWED_AT = "October 18, 2026";
