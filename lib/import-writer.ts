// Column-aware writer for foreclosure_properties. SERVER ONLY.
//
// The single place that knows which DB columns are writable and how to filter a
// payload to the columns that actually exist in the live table. This is why
// migrations 0004 (rich fields) and 0005 (provider metadata) are OPTIONAL: the
// importer AND the county collectors both write only the columns present, so the
// app keeps working whether or not those migrations have been applied.

import type { SupabaseClient } from "@supabase/supabase-js";

// Rich fields from migration 0004 (optional).
export const RICH_FIELDS = new Set<string>([
  "latitude", "longitude", "year_built", "lot_size", "trustee_name", "case_number",
  "notice_type", "notice_recording_date", "default_date", "auction_time", "auction_location",
  "unpaid_balance", "judgment_amount", "assessed_value", "estimated_lien_position",
  "source_license_status", "last_seen_at",
]);

// Provider-metadata fields from migration 0005 (optional).
export const PROVIDER_META_FIELDS = new Set<string>([
  "source_authority", "source_type", "source_access_method", "collected_at",
  "publication_permission", "document_number",
]);

// Everything the writer may set. Core fields (0001) always exist; rich (0004) and
// provider-meta (0005) are filtered out when their columns are absent.
export const ALL_DB_FIELDS = [
  "external_id", "source_name", "source_url", "state", "county", "city", "zip",
  "address", "apn", "property_type", "beds", "baths", "units", "square_feet",
  "foreclosure_stage", "original_auction_date", "current_auction_date", "opening_bid",
  "estimated_value", "estimated_debt", "estimated_equity", "occupancy_status",
  "previous_sale_date", "previous_sale_price", "record_status", "source_last_updated_at",
  ...RICH_FIELDS,
  ...PROVIDER_META_FIELDS,
] as const;

/** The DB-writable property shape. Core fields required; rich/provider-meta optional. */
export interface WritableProperty {
  external_id: string;
  source_name: string;
  source_url: string | null;
  state: string;
  county: string | null;
  city: string | null;
  zip: string | null;
  address: string | null;
  apn: string | null;
  property_type: string | null;
  beds: number | null;
  baths: number | null;
  units: number | null;
  square_feet: number | null;
  foreclosure_stage: string | null;
  original_auction_date: string | null;
  current_auction_date: string | null;
  opening_bid: number | null;
  estimated_value: number | null;
  estimated_debt: number | null;
  estimated_equity: number | null;
  occupancy_status: string | null;
  previous_sale_date: string | null;
  previous_sale_price: number | null;
  record_status: string;
  source_last_updated_at: string | null;
  // rich (0004)
  latitude?: number | null;
  longitude?: number | null;
  year_built?: number | null;
  lot_size?: number | null;
  trustee_name?: string | null;
  case_number?: string | null;
  notice_type?: string | null;
  notice_recording_date?: string | null;
  default_date?: string | null;
  auction_time?: string | null;
  auction_location?: string | null;
  unpaid_balance?: number | null;
  judgment_amount?: number | null;
  assessed_value?: number | null;
  estimated_lien_position?: string | null;
  source_license_status?: string | null;
  // provider meta (0005)
  source_authority?: string | null;
  source_type?: string | null;
  source_access_method?: string | null;
  collected_at?: string | null;
  publication_permission?: string | null;
  document_number?: string | null;
}

/**
 * Which writable columns exist in the live table. Probes one representative 0004
 * column (last_seen_at) and one 0005 column (publication_permission). A failed
 * select means that migration isn't applied → those columns are excluded.
 */
export async function liveColumns(admin: SupabaseClient): Promise<Set<string>> {
  const core = ALL_DB_FIELDS.filter((f) => !RICH_FIELDS.has(f) && !PROVIDER_META_FIELDS.has(f));
  const cols = new Set<string>(core);
  const [{ error: richErr }, { error: metaErr }] = await Promise.all([
    admin.from("foreclosure_properties").select("last_seen_at").limit(1),
    admin.from("foreclosure_properties").select("publication_permission").limit(1),
  ]);
  if (!richErr) RICH_FIELDS.forEach((f) => cols.add(f));
  if (!metaErr) PROVIDER_META_FIELDS.forEach((f) => cols.add(f));
  return cols;
}

/**
 * Build the DB payload from a writable property, keeping ONLY columns that exist
 * in the live table. `last_seen_at`/`collected_at` default to now when writable.
 */
export function toDbRow(
  r: Partial<WritableProperty>,
  cols: Set<string>,
  nowIso: string,
): Record<string, unknown> {
  const full: Record<string, unknown> = {
    external_id: r.external_id,
    source_name: r.source_name,
    source_url: r.source_url ?? null,
    state: r.state,
    county: r.county ?? null,
    city: r.city ?? null,
    zip: r.zip ?? null,
    address: r.address ?? null,
    apn: r.apn ?? null,
    property_type: r.property_type ?? null,
    beds: r.beds ?? null,
    baths: r.baths ?? null,
    units: r.units ?? null,
    square_feet: r.square_feet ?? null,
    foreclosure_stage: r.foreclosure_stage ?? null,
    original_auction_date: r.original_auction_date ?? null,
    current_auction_date: r.current_auction_date ?? null,
    opening_bid: r.opening_bid ?? null,
    estimated_value: r.estimated_value ?? null,
    estimated_debt: r.estimated_debt ?? null,
    estimated_equity: r.estimated_equity ?? null,
    occupancy_status: r.occupancy_status ?? null,
    previous_sale_date: r.previous_sale_date ?? null,
    previous_sale_price: r.previous_sale_price ?? null,
    record_status: r.record_status,
    source_last_updated_at: r.source_last_updated_at ?? nowIso,
    // rich (0004)
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    year_built: r.year_built ?? null,
    lot_size: r.lot_size ?? null,
    trustee_name: r.trustee_name ?? null,
    case_number: r.case_number ?? null,
    notice_type: r.notice_type ?? null,
    notice_recording_date: r.notice_recording_date ?? null,
    default_date: r.default_date ?? null,
    auction_time: r.auction_time ?? null,
    auction_location: r.auction_location ?? null,
    unpaid_balance: r.unpaid_balance ?? null,
    judgment_amount: r.judgment_amount ?? null,
    assessed_value: r.assessed_value ?? null,
    estimated_lien_position: r.estimated_lien_position ?? null,
    source_license_status: r.source_license_status ?? null,
    last_seen_at: nowIso,
    // provider meta (0005)
    source_authority: r.source_authority ?? null,
    source_type: r.source_type ?? null,
    source_access_method: r.source_access_method ?? null,
    collected_at: r.collected_at ?? nowIso,
    publication_permission: r.publication_permission ?? null,
    document_number: r.document_number ?? null,
  };
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(full)) {
    if (cols.has(k)) out[k] = full[k];
  }
  return out;
}

/** True when any rich (0004) columns are writable in the live table. */
export function richFieldsLive(cols: Set<string>): boolean {
  return [...RICH_FIELDS].some((f) => cols.has(f));
}

/** True when the provider-metadata (0005) columns are writable. */
export function providerMetaLive(cols: Set<string>): boolean {
  return [...PROVIDER_META_FIELDS].some((f) => cols.has(f));
}
