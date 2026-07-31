// Enum labels and option lists shared by filters, forms, and the CRM mapping.
// These mirror the Postgres enums in supabase/migrations/0001_foreclosure_schema.sql.

export const FORECLOSURE_STAGES = [
  { value: "pre_foreclosure", label: "Pre-foreclosure" },
  { value: "notice_of_default", label: "Notice of Default" },
  { value: "notice_of_sale", label: "Notice of Sale" },
  { value: "auction", label: "Auction scheduled" },
  { value: "postponed", label: "Postponed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "sold_third_party", label: "Sold to third party" },
  { value: "reo_bank_owned", label: "Bank-owned (REO)" },
] as const;

export const PROPERTY_TYPES = [
  { value: "single_family", label: "Single-family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multifamily_2_4", label: "Multifamily (2–4)" },
  { value: "multifamily_5plus", label: "Multifamily (5+)" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
] as const;

// Coarse buckets used by the "Residential / Multifamily / Commercial" toggles.
export const PROPERTY_CLASS: Record<string, string[]> = {
  residential: ["single_family", "condo", "townhouse"],
  multifamily: ["multifamily_2_4", "multifamily_5plus"],
  commercial: ["commercial", "land"],
};

export const OCCUPANCY = [
  { value: "owner_occupied", label: "Owner-occupied" },
  { value: "tenant_occupied", label: "Tenant-occupied" },
  { value: "vacant", label: "Vacant" },
  { value: "unknown", label: "Unknown" },
] as const;

export const FINANCING_TYPES = [
  { value: "auction_acquisition", label: "Auction Acquisition Financing" },
  { value: "bridge", label: "Bridge Financing" },
  { value: "fix_and_flip", label: "Fix-and-Flip Financing" },
  { value: "rehabilitation", label: "Rehabilitation Financing" },
  { value: "dscr_takeout", label: "DSCR Takeout" },
  { value: "private_capital", label: "Private Capital Review" },
] as const;

export const SORT_OPTIONS = [
  { value: "auction_date", label: "Auction date" },
  { value: "newest", label: "Newest records" },
  { value: "opening_bid", label: "Opening bid" },
  { value: "estimated_value", label: "Estimated value" },
  { value: "estimated_equity", label: "Estimated equity" },
] as const;

export const AUCTION_HORIZONS = [
  { value: "30d", label: "Next 30 days" },
  { value: "60d", label: "Next 60 days" },
  { value: "90d", label: "Next 90 days" },
  { value: "180d", label: "Next 6 months" },
] as const;

export const INVESTOR_EXPERIENCE = [
  { value: "first", label: "First deal" },
  { value: "1_5", label: "1–5 deals" },
  { value: "6_20", label: "6–20 deals" },
  { value: "20plus", label: "20+ deals" },
] as const;

// Counties supported in Phase 1. Florida is limited to the three counties with
// prepared source adapters (Palm Beach, Broward, Miami-Dade). California accepts
// any county name from approved imports; a starter list drives the dropdown.
export const COUNTIES: Record<string, string[]> = {
  FL: ["Palm Beach", "Broward", "Miami-Dade"],
  CA: [
    "Los Angeles",
    "Orange",
    "San Diego",
    "Riverside",
    "San Bernardino",
    "Ventura",
    "Sacramento",
    "Alameda",
    "Santa Clara",
    "Kern",
    "Fresno",
    "Contra Costa",
  ],
};

export function labelFor(
  list: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return list.find((o) => o.value === value)?.label ?? value;
}

// Automatic county collectors (Palm Beach + Los Angeles). Client-safe labels so
// the public search / cards / detail can show a human source name without
// importing any server-only provider code. Keep in sync with
// lib/providers/registry.ts PROVIDER_SOURCE_LABELS.
export const COLLECTOR_SOURCES = [
  { value: "palm_beach_county", label: "Official Palm Beach County records" },
  { value: "la_county_recorder", label: "Los Angeles County recorded-document feed" },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  palm_beach_county: "Official Palm Beach County records",
  la_county_recorder: "Los Angeles County recorded-document feed",
  manual_csv: "Operator CSV",
  california_foreclosure: "California trustee-sale export",
  palm_beach_clerk: "Palm Beach County (CSV export)",
  broward_clerk: "Broward County (CSV export)",
  miami_dade_clerk: "Miami-Dade County (CSV export)",
  propertyradar: "PropertyRadar export",
};

/** Human-friendly source label for a stored source_name (falls back gracefully). */
export function sourceLabel(name: string | null | undefined): string {
  if (!name) return "—";
  return SOURCE_LABELS[name] ?? name.replace(/_/g, " ");
}
