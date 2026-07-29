// Canonical property model + display helpers. The DB row shape mirrors
// foreclosure_properties; we keep a narrow, explicit type rather than `any`.

import { formatMoney } from "@/lib/format";

export interface ForeclosureProperty {
  id: string;
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
  created_at: string;
  updated_at: string;
}

export interface AuctionEvent {
  id: string;
  property_id: string;
  event_type: string;
  event_date: string | null;
  previous_value: string | null;
  new_value: string | null;
  source_name: string | null;
  source_url: string | null;
  created_at: string;
}

/** Human title for a property, gracefully degrading when the address is absent. */
export function propertyTitle(p: ForeclosureProperty): string {
  if (p.address) return p.address;
  const loc = [p.city, p.county, p.state].filter(Boolean).join(", ");
  return loc || `${p.state} property`;
}

export function propertyLocation(p: ForeclosureProperty): string {
  return [p.city, p.county && `${p.county} County`, p.state, p.zip]
    .filter(Boolean)
    .join(", ");
}

/**
 * Equity is shown only when we actually have it: prefer a source-provided value,
 * else derive from estimated_value - estimated_debt when BOTH exist. Never invent.
 */
export function displayEquity(p: ForeclosureProperty): number | null {
  if (p.estimated_equity != null) return p.estimated_equity;
  if (p.estimated_value != null && p.estimated_debt != null) {
    return p.estimated_value - p.estimated_debt;
  }
  return null;
}

export function formatDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function bedBath(p: ForeclosureProperty): string {
  const parts: string[] = [];
  if (p.beds != null) parts.push(`${p.beds} bd`);
  if (p.baths != null) parts.push(`${p.baths} ba`);
  if (p.units != null) parts.push(`${p.units} units`);
  if (p.square_feet != null) parts.push(`${p.square_feet.toLocaleString("en-US")} sqft`);
  return parts.join(" · ") || "—";
}

export { formatMoney };
