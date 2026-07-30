// Source adapters. Each describes a legally-permitted import source and a DEFAULT
// column map (canonical field -> expected CSV header). The maps are STARTING
// POINTS the admin can override at upload time — exact headers depend on the
// approved export, and are not hardcoded as authoritative. No credentials, API
// keys, or proprietary source URLs live here.
//
// IMPORTANT (data-source rules): adapters only define how to MAP a file the
// operator already has the right to import. They do not scrape and do not fetch.
// Restricted sources (ForeclosureRadar/PropertyRadar) are present as import
// mappings for APPROVED exports only, and remain inactive for public display
// until a redistribution/public-display license is confirmed
// (see docs/propertyradar-integration.md).

import type { ColumnMap } from "@/lib/csv";

export interface SourceAdapter {
  id: string; // stored as source_name
  label: string;
  state: "CA" | "FL";
  /** Whether rows from this source may be PUBLISHED for public display today. */
  publicDisplayAllowed: boolean;
  /** Notes shown in the admin UI. */
  note: string;
  defaultColumnMap: ColumnMap;
  /** Implicit values for county-specific exports (e.g. a Palm Beach file is all
   *  Palm Beach, FL). Applied only when the row lacks its own state/county. */
  defaults?: { state?: "CA" | "FL"; county?: string };
}

// Generic canonical map — used by manual CSVs whose headers already match our
// field names, and as the fallback for any source.
const CANONICAL: ColumnMap = {
  external_id: "external_id",
  source_url: "source_url",
  source_last_updated_at: "source_last_updated_at",
  source_license_status: "source_license_status",
  state: "state",
  county: "county",
  city: "city",
  zip: "zip",
  address: "address",
  apn: "apn",
  property_type: "property_type",
  beds: "beds",
  baths: "baths",
  units: "units",
  square_feet: "square_feet",
  foreclosure_stage: "foreclosure_stage",
  status: "status",
  original_auction_date: "original_auction_date",
  current_auction_date: "current_auction_date",
  opening_bid: "opening_bid",
  estimated_value: "estimated_value",
  market_value: "market_value",
  assessed_value: "assessed_value",
  estimated_debt: "estimated_debt",
  unpaid_balance: "unpaid_balance",
  judgment_amount: "judgment_amount",
  estimated_equity: "estimated_equity",
  estimated_lien_position: "estimated_lien_position",
  occupancy_status: "occupancy_status",
  previous_sale_date: "previous_sale_date",
  previous_sale_price: "previous_sale_price",
  latitude: "latitude",
  longitude: "longitude",
  year_built: "year_built",
  lot_size: "lot_size",
  trustee_name: "trustee_name",
  case_number: "case_number",
  notice_type: "notice_type",
  notice_recording_date: "notice_recording_date",
  default_date: "default_date",
  auction_time: "auction_time",
  auction_location: "auction_location",
};

export const ADAPTERS: SourceAdapter[] = [
  {
    id: "manual_csv",
    label: "Generic foreclosure CSV (canonical headers)",
    state: "CA",
    publicDisplayAllowed: true,
    note: "Operator-prepared CSV using our canonical column names. Fully permitted for display.",
    defaultColumnMap: CANONICAL,
  },
  {
    id: "california_foreclosure",
    label: "California foreclosure / trustee-sale export",
    state: "CA",
    publicDisplayAllowed: true,
    note: "Public-record / owner-provided California trustee-sale export. Confirm the export's terms; preserve the official source URL.",
    defaultColumnMap: {
      ...CANONICAL,
      external_id: "TSNumber",
      apn: "APN",
      address: "PropertyAddress",
      city: "City",
      county: "County",
      zip: "Zip",
      foreclosure_stage: "SaleType",
      status: "Status",
      current_auction_date: "SaleDate",
      auction_time: "SaleTime",
      auction_location: "SaleLocation",
      opening_bid: "OpeningBid",
      unpaid_balance: "UnpaidBalance",
      estimated_debt: "EstimatedDebt",
      estimated_value: "EstimatedValue",
      trustee_name: "Trustee",
      notice_recording_date: "NODRecordingDate",
      default_date: "DefaultDate",
      source_url: "DetailURL",
    },
  },
  {
    id: "propertyradar",
    label: "PropertyRadar / ForeclosureRadar export (CA)",
    state: "CA",
    publicDisplayAllowed: false,
    note: "APPROVED export only. Restricted data must NOT be published publicly until a redistribution/public-display license is confirmed. Import as draft; keep source links.",
    defaultColumnMap: {
      ...CANONICAL,
      external_id: "RadarID",
      address: "Address",
      city: "City",
      county: "County",
      zip: "Zip",
      apn: "APN",
      property_type: "PropertyType",
      foreclosure_stage: "ForeclosureStage",
      current_auction_date: "SaleDate",
      opening_bid: "OpeningBid",
      estimated_value: "AVM",
      estimated_debt: "TotalLoanBalance",
      source_url: "DetailURL",
    },
  },
  {
    id: "palm_beach_clerk",
    defaults: { state: "FL", county: "Palm Beach" },
    label: "Palm Beach County (FL) — foreclosure sales export",
    state: "FL",
    publicDisplayAllowed: true,
    note: "Public-record foreclosure auction export. Confirm the specific export's terms; preserve the official source URL.",
    defaultColumnMap: {
      ...CANONICAL,
      external_id: "CaseNumber",
      address: "PropertyAddress",
      city: "City",
      zip: "Zip",
      apn: "ParcelID",
      current_auction_date: "AuctionDate",
      status: "Status",
      opening_bid: "OpeningBid",
      judgment_amount: "FinalJudgmentAmount",
      assessed_value: "AssessedValue",
      estimated_value: "AssessedValue",
      source_url: "AuctionURL",
    },
  },
  {
    id: "broward_clerk",
    defaults: { state: "FL", county: "Broward" },
    label: "Broward County (FL) — foreclosure sales export",
    state: "FL",
    publicDisplayAllowed: true,
    note: "Public-record foreclosure auction export (broward.realforeclose.com style). Preserve the official source URL.",
    defaultColumnMap: {
      ...CANONICAL,
      external_id: "CaseNumber",
      address: "PropertyAddress",
      city: "City",
      zip: "Zip",
      apn: "FolioNumber",
      current_auction_date: "AuctionDate",
      status: "Status",
      opening_bid: "OpeningBid",
      judgment_amount: "FinalJudgmentAmount",
      assessed_value: "AssessedValue",
      estimated_value: "AssessedValue",
      source_url: "AuctionURL",
    },
  },
  {
    id: "miami_dade_clerk",
    defaults: { state: "FL", county: "Miami-Dade" },
    label: "Miami-Dade County (FL) — foreclosure sales export",
    state: "FL",
    publicDisplayAllowed: true,
    note: "Public-record foreclosure auction export (miamidade.realforeclose.com style). Preserve the official source URL.",
    defaultColumnMap: {
      ...CANONICAL,
      external_id: "CaseNumber",
      address: "PropertyAddress",
      city: "City",
      zip: "Zip",
      apn: "Folio",
      current_auction_date: "AuctionDate",
      status: "Status",
      opening_bid: "OpeningBid",
      judgment_amount: "FinalJudgmentAmount",
      assessed_value: "AssessedValue",
      estimated_value: "AssessedValue",
      source_url: "AuctionURL",
    },
  },
];

export function getAdapter(id: string): SourceAdapter | undefined {
  return ADAPTERS.find((a) => a.id === id);
}
