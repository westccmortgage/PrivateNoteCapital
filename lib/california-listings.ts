// Read ONLY GRCRM's intentional PUBLIC listing projection.
// The PropertyRadar lead_universe / pr_properties CRM data is explicitly NOT
// accessed here and must NEVER flow into the foreclosure auction collection.
// This public feed independently filters to already-published CRM marketplace
// listings and excludes drafts, removed listings and private CRM contacts.

const PUBLIC_FEED =
  "https://grcrm.com/.netlify/functions/marketplace-public-feed?marketplace=west-coast-capital-realty&limit=100";
const PUBLIC_LISTING_BASE = "https://westcoastcapitalrealty.com/listings/";

export interface CaliforniaPublicListing {
  slug: string;
  address: string;
  city: string;
  zip: string;
  price: number | null;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  propertyType: string;
  lastUpdated: string | null;
  originalUrl: string;
}

export interface CaliforniaListingFeed {
  status: "ready" | "unavailable";
  rows: CaliforniaPublicListing[];
}

function str(v: unknown, limit = 240): string {
  return typeof v === "string" ? v.trim().slice(0, limit) : "";
}

function numberOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Pure whitelist projection. No contact/owner, debt, foreclosure, radar id, agent profile or photos. */
export function publicCaliforniaListing(record: unknown): CaliforniaPublicListing | null {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  const r = record as Record<string, unknown>;

  if (str(r.state).toUpperCase() !== "CA") return null;
  if (str(r.purpose).toLowerCase() !== "sale") return null;
  if (str(r.status).toLowerCase() !== "active") return null;
  if (r.published === false || r.demo === true) return null;

  // The CRM already prevents demo listings from being published. Preserve a
  // second guard here as insurance against an accidentally public test entry.
  if (str(r.mls).toUpperCase().startsWith("DEMO-")) return null;
  const slug = str(r.slug, 160);
  const address = str(r.address, 300);
  if (!/^[a-z0-9-]+$/.test(slug) || !address) return null;

  const updated = str(r.updated_at, 70);
  return {
    slug,
    address,
    city: str(r.city, 100),
    zip: str(r.zip, 20),
    price: numberOrNull(r.price),
    beds: numberOrNull(r.beds),
    baths: numberOrNull(r.baths),
    squareFeet: numberOrNull(r.sqft),
    propertyType: str(r.property_type, 70),
    lastUpdated: updated && !Number.isNaN(Date.parse(updated)) ? updated : null,
    originalUrl: PUBLIC_LISTING_BASE + encodeURIComponent(slug),
  };
}

export function selectPublicCaliforniaListings(records: unknown[]): CaliforniaPublicListing[] {
  const unique = new Map<string, CaliforniaPublicListing>();
  for (const raw of records) {
    const listing = publicCaliforniaListing(raw);
    if (listing && !unique.has(listing.slug)) unique.set(listing.slug, listing);
  }
  return [...unique.values()].slice(0, 60);
}

/**
 * Read live seller-authorized public CRM listings, not private PropertyRadar lead
 * records. No key or privileged service role is used. Fail closed on unavailable
 * feed; never show placeholder, sold, out-of-state or unapproved property rows.
 */
export async function getCaliforniaPublicListings(): Promise<CaliforniaListingFeed> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(PUBLIC_FEED, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return { status: "unavailable", rows: [] };

    const payload = (await res.json()) as unknown;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { status: "unavailable", rows: [] };
    }

    const feed = payload as Record<string, unknown>;
    if (feed.ok !== true || feed.marketplace !== "west-coast-capital-realty" ||
        !Array.isArray(feed.listings)) {
      return { status: "unavailable", rows: [] };
    }
    return { status: "ready", rows: selectPublicCaliforniaListings(feed.listings) };
  } catch {
    // Avoid logging URL parameters, vendor data, personal details or errors
    // that could contain private information.
    console.warn("[california-public-listings] public CRM feed unavailable");
    return { status: "unavailable", rows: [] };
  } finally {
    clearTimeout(timer);
  }
}
