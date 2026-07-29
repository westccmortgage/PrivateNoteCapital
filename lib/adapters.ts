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
}

// Generic canonical map — used by manual CSVs whose headers already match our
// field names, and as the fallback for any source.
const CANONICAL: ColumnMap = {
  external_id: "external_id",
  source_url: "source_url",
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
  original_auction_date: "original_auction_date",
  current_auction_date: "current_auction_date",
  opening_bid: "opening_bid",
  estimated_value: "estimated_value",
  estimated_debt: "estimated_debt",
  estimated_equity: "estimated_equity",
  occupancy_status: "occupancy_status",
  previous_sale_date: "previous_sale_date",
  previous_sale_price: "previous_sale_price",
};

export const ADAPTERS: SourceAdapter[] = [
  {
    id: "manual_csv",
    label: "Manual CSV (canonical headers)",
    state: "CA",
    publicDisplayAllowed: true,
    note: "Operator-prepared CSV using our canonical column names. Fully permitted for display.",
    defaultColumnMap: CANONICAL,
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
      opening_bid: "OpeningBid",
      estimated_value: "AssessedValue",
      source_url: "AuctionURL",
    },
  },
  {
    id: "broward_clerk",
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
      opening_bid: "OpeningBid",
      estimated_value: "AssessedValue",
      source_url: "AuctionURL",
    },
  },
  {
    id: "miami_dade_clerk",
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
      opening_bid: "OpeningBid",
      estimated_value: "AssessedValue",
      source_url: "AuctionURL",
    },
  },
];

export function getAdapter(id: string): SourceAdapter | undefined {
  return ADAPTERS.find((a) => a.id === id);
}
