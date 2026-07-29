// Search: parse shareable URL params → typed filter → Supabase query.
// Pure parsing/serialization is separated from the DB call so it is unit-testable
// without a database (see tests/search.test.ts).

import type { SupabaseClient } from "@supabase/supabase-js";
import { PROPERTY_CLASS } from "@/lib/constants";
import type { ForeclosureProperty } from "@/lib/property";

export const PAGE_SIZE = 24;

export interface SearchFilter {
  state?: string;
  county?: string;
  city?: string;
  zip?: string;
  propertyTypes: string[];
  stages: string[];
  classes: string[]; // residential | multifamily | commercial
  source?: string;
  auctionFrom?: string; // YYYY-MM-DD
  auctionTo?: string;
  openingBidMin?: number;
  openingBidMax?: number;
  valueMin?: number;
  valueMax?: number;
  equityMin?: number;
  sort: string;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

function list(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : v.split(",");
  return arr.map((s) => s.trim()).filter(Boolean);
}

function num(v: string | string[] | undefined): number | undefined {
  const s = first(v);
  if (s == null || s === "") return undefined;
  const n = Number(String(s).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/** Parse Next.js searchParams into a typed, validated filter. */
export function parseSearchParams(params: RawParams): SearchFilter {
  const state = first(params.state)?.toUpperCase();
  const pageRaw = num(params.page) ?? 1;
  return {
    state: state === "CA" || state === "FL" ? state : undefined,
    county: first(params.county) || undefined,
    city: first(params.city) || undefined,
    zip: first(params.zip) || undefined,
    propertyTypes: list(params.propertyType || params.type),
    stages: list(params.stage),
    classes: list(params.class),
    source: first(params.source) || undefined,
    auctionFrom: first(params.auctionFrom) || undefined,
    auctionTo: first(params.auctionTo) || undefined,
    openingBidMin: num(params.bidMin),
    openingBidMax: num(params.bidMax),
    valueMin: num(params.valueMin),
    valueMax: num(params.valueMax),
    equityMin: num(params.equityMin),
    sort: first(params.sort) || "auction_date",
    page: pageRaw >= 1 ? Math.floor(pageRaw) : 1,
  };
}

/** Serialize a filter back to a query string for shareable URLs. */
export function toQueryString(f: Partial<SearchFilter>): string {
  const q = new URLSearchParams();
  if (f.state) q.set("state", f.state);
  if (f.county) q.set("county", f.county);
  if (f.city) q.set("city", f.city);
  if (f.zip) q.set("zip", f.zip);
  if (f.propertyTypes?.length) q.set("propertyType", f.propertyTypes.join(","));
  if (f.stages?.length) q.set("stage", f.stages.join(","));
  if (f.classes?.length) q.set("class", f.classes.join(","));
  if (f.source) q.set("source", f.source);
  if (f.auctionFrom) q.set("auctionFrom", f.auctionFrom);
  if (f.auctionTo) q.set("auctionTo", f.auctionTo);
  if (f.openingBidMin != null) q.set("bidMin", String(f.openingBidMin));
  if (f.openingBidMax != null) q.set("bidMax", String(f.openingBidMax));
  if (f.valueMin != null) q.set("valueMin", String(f.valueMin));
  if (f.valueMax != null) q.set("valueMax", String(f.valueMax));
  if (f.equityMin != null) q.set("equityMin", String(f.equityMin));
  if (f.sort && f.sort !== "auction_date") q.set("sort", f.sort);
  if (f.page && f.page > 1) q.set("page", String(f.page));
  return q.toString();
}

/** Expand coarse class toggles into concrete property_type values. */
export function classesToTypes(classes: string[]): string[] {
  const set = new Set<string>();
  for (const c of classes) (PROPERTY_CLASS[c] || []).forEach((t) => set.add(t));
  return [...set];
}

export interface SearchResult {
  rows: ForeclosureProperty[];
  total: number;
  page: number;
  pageSize: number;
  configured: boolean;
}

/**
 * Run the search against Supabase (RLS ensures only published rows return).
 * `supabase` may be null (unconfigured) → returns an empty, non-error result so
 * the UI shows a clean empty state and never fabricates listings.
 */
export async function runSearch(
  supabase: SupabaseClient | null,
  f: SearchFilter,
): Promise<SearchResult> {
  const empty: SearchResult = {
    rows: [],
    total: 0,
    page: f.page,
    pageSize: PAGE_SIZE,
    configured: Boolean(supabase),
  };
  if (!supabase) return empty;

  let q = supabase
    .from("foreclosure_properties")
    .select("*", { count: "exact" })
    .eq("record_status", "published");

  if (f.state) q = q.eq("state", f.state);
  if (f.county) q = q.ilike("county", f.county);
  if (f.city) q = q.ilike("city", `%${f.city}%`);
  if (f.zip) q = q.eq("zip", f.zip);
  if (f.source) q = q.eq("source_name", f.source);

  const types = new Set<string>(f.propertyTypes);
  classesToTypes(f.classes).forEach((t) => types.add(t));
  if (types.size) q = q.in("property_type", [...types]);
  if (f.stages.length) q = q.in("foreclosure_stage", f.stages);

  if (f.auctionFrom) q = q.gte("current_auction_date", f.auctionFrom);
  if (f.auctionTo) q = q.lte("current_auction_date", f.auctionTo);
  if (f.openingBidMin != null) q = q.gte("opening_bid", f.openingBidMin);
  if (f.openingBidMax != null) q = q.lte("opening_bid", f.openingBidMax);
  if (f.valueMin != null) q = q.gte("estimated_value", f.valueMin);
  if (f.valueMax != null) q = q.lte("estimated_value", f.valueMax);
  if (f.equityMin != null) q = q.gte("estimated_equity", f.equityMin);

  switch (f.sort) {
    case "newest":
      q = q.order("created_at", { ascending: false });
      break;
    case "opening_bid":
      q = q.order("opening_bid", { ascending: true, nullsFirst: false });
      break;
    case "estimated_value":
      q = q.order("estimated_value", { ascending: false, nullsFirst: false });
      break;
    case "estimated_equity":
      q = q.order("estimated_equity", { ascending: false, nullsFirst: false });
      break;
    case "auction_date":
    default:
      q = q.order("current_auction_date", { ascending: true, nullsFirst: false });
      break;
  }

  const from = (f.page - 1) * PAGE_SIZE;
  q = q.range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await q;
  if (error) {
    console.error("[search] query error:", error.message);
    return empty;
  }
  return {
    rows: (data ?? []) as ForeclosureProperty[],
    total: count ?? 0,
    page: f.page,
    pageSize: PAGE_SIZE,
    configured: true,
  };
}
