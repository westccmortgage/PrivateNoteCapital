// Shared helpers to turn a county foreclosure event into the EXISTING canonical
// property model. Pure + unit-testable. Both Palm Beach and LA use these so
// property identity, stage/lifecycle mapping, and eligibility are consistent.

import {
  normalizeState,
  normalizeCounty,
  normalizeZip,
  normalizeAddress,
  normalizeApn,
  dedupExternalId,
  normalizeLifecycle,
  evaluateEligibility,
  type Lifecycle,
} from "@/lib/normalize";
import { coerceNumber, coerceDate, normalizePropertyType } from "@/lib/csv";
import type { WritableProperty } from "@/lib/import-writer";
import type { PublicationPermission, NormalizedEvent, SourceMeta } from "@/lib/providers/types";
import { publicDisplayAllowed } from "@/lib/providers/permission";

/**
 * Map a raw sale/notice status (+ document type) to a foreclosure_stage enum and
 * a lifecycle. Recognizes Florida auction-status language AND California
 * recorded-document types (NOD / NOS / rescission / trustee's deed).
 */
export function stageAndLifecycle(
  statusRaw: string | null | undefined,
  docTypeRaw?: string | null,
): { stage: string | null; lifecycle: Lifecycle } {
  const s = (statusRaw || "").trim().toLowerCase();
  const d = (docTypeRaw || "").trim().toLowerCase();

  // California recorded-document types drive both stage + lifecycle.
  if (/notice of default|\bnod\b/.test(d)) return { stage: "notice_of_default", lifecycle: "active" };
  if (/notice of (trustee|trustee'?s )?sale|notice of sale|\bnos\b/.test(d))
    return { stage: "notice_of_sale", lifecycle: "active" };
  if (/rescission|rescind/.test(d)) return { stage: "cancelled", lifecycle: "cancelled" };
  if (/trustee'?s deed|deed upon sale|trustees deed/.test(d)) return { stage: "sold_third_party", lifecycle: "sold" };

  // Florida auction status.
  if (/cancel/.test(s)) return { stage: "cancelled", lifecycle: "cancelled" };
  if (/rescind/.test(s)) return { stage: "cancelled", lifecycle: "cancelled" };
  if (/postpon|reschedul|continu/.test(s)) return { stage: "postponed", lifecycle: "postponed" };
  if (/redeem|dismiss|withdraw|struck|removed/.test(s)) return { stage: null, lifecycle: "withdrawn" };
  if (/sold to (3rd|third)|third party|sold to plaintiff|certificate of (sale|title)/.test(s))
    return { stage: "sold_third_party", lifecycle: "sold" };
  if (/\breo\b|bank owned|returned to (plaintiff|lender)/.test(s)) return { stage: "reo_bank_owned", lifecycle: "sold" };
  if (/sold/.test(s)) return { stage: "sold_third_party", lifecycle: "sold" };
  if (/schedul|active|set|open|upcoming|auction/.test(s)) return { stage: "auction", lifecycle: "active" };

  // Default: a scheduled auction that is still active.
  return { stage: "auction", lifecycle: "active" };
}

export interface EventPropertyInput {
  sourceName: string;
  state: "CA" | "FL";
  county: string;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  apn?: string | null; // PCN (PB) / AIN (LA)
  propertyType?: string | null;
  foreclosureStage: string | null;
  lifecycle: Lifecycle;
  permission: PublicationPermission;
  // event financials / dates
  saleDate?: string | null;
  saleTime?: string | null;
  saleLocation?: string | null;
  openingBid?: number | null;
  judgmentAmount?: number | null;
  assessedValue?: number | null;
  caseNumber?: string | null;
  documentNumber?: string | null;
  noticeType?: string | null;
  noticeRecordingDate?: string | null;
  defaultDate?: string | null;
  trusteeName?: string | null;
  sourceUrl?: string | null;
  source: SourceMeta;
  // enrichment (optional)
  latitude?: number | null;
  longitude?: number | null;
  legalDescription?: string | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
}

/**
 * Build an upsert-ready WritableProperty from an event. Property identity is
 * PARCEL-stable (APN/PCN → normalized address) so a changed auction date or a
 * later notice on the same parcel updates ONE card, never spawns a duplicate.
 * Returns null when there is no usable identity at all (address + parcel absent).
 */
export function buildProperty(i: EventPropertyInput): WritableProperty | null {
  const state = normalizeState(i.state) as "CA" | "FL" | null;
  const county = normalizeCounty(i.county);
  const address = i.address?.trim() || null;
  const apn = i.apn?.trim() || null;
  const zip = normalizeZip(i.zip);

  const external_id = dedupExternalId({ external_id: "", apn, state, county, address, zip });
  if (!external_id || !state) return null;

  const publicOk = publicDisplayAllowed(i.permission);
  const elig = evaluateEligibility({
    address,
    apn,
    state,
    county,
    foreclosure_stage: i.foreclosureStage,
    lifecycle: i.lifecycle,
    publicDisplayAllowed: publicOk,
  });

  // Assessed value may seed estimated_value ONLY as a labeled assessed figure —
  // never presented as market value (the property page labels it as assessed).
  const estimated_value = i.assessedValue ?? null;
  const estimated_debt = i.judgmentAmount ?? null;
  const estimated_equity =
    estimated_value != null && estimated_debt != null ? estimated_value - estimated_debt : null;

  return {
    external_id,
    source_name: i.sourceName,
    source_url: i.sourceUrl ?? i.source.url ?? null,
    state,
    county,
    city: i.city?.trim() || null,
    zip,
    address,
    apn: normalizeApn(apn) ? apn : apn, // keep original formatting for display; dedup used normalized
    property_type: i.propertyType ? normalizePropertyType(i.propertyType) : null,
    beds: null,
    baths: null,
    units: null,
    square_feet: null,
    foreclosure_stage: i.foreclosureStage,
    original_auction_date: null,
    current_auction_date: coerceDate(i.saleDate),
    opening_bid: i.openingBid ?? null,
    estimated_value,
    estimated_debt,
    estimated_equity,
    occupancy_status: null,
    previous_sale_date: null,
    previous_sale_price: null,
    record_status: elig.status,
    source_last_updated_at: i.source.sourceUpdatedAt,
    // rich (0004)
    latitude: i.latitude ?? null,
    longitude: i.longitude ?? null,
    year_built: i.yearBuilt ?? null,
    lot_size: i.lotSize ?? null,
    trustee_name: i.trusteeName ?? null,
    case_number: i.caseNumber ?? null,
    notice_type: i.noticeType ?? null,
    notice_recording_date: coerceDate(i.noticeRecordingDate),
    default_date: coerceDate(i.defaultDate),
    auction_time: i.saleTime ?? null,
    auction_location: i.saleLocation ?? null,
    unpaid_balance: null,
    judgment_amount: i.judgmentAmount ?? null,
    assessed_value: i.assessedValue ?? null,
    estimated_lien_position: null,
    source_license_status: i.permission,
    // provider meta (0005)
    source_authority: i.source.authority,
    source_type: i.source.sourceType,
    source_access_method: i.source.accessMethod,
    collected_at: i.source.collectedAt,
    publication_permission: i.permission,
    document_number: i.documentNumber ?? null,
  };
}

/** Deterministic event key for change-detection/dedup: id + timestamp identity. */
export function eventKeyFor(parts: (string | null | undefined)[]): string {
  return parts.map((p) => (p ?? "").toString().trim().toLowerCase()).filter(Boolean).join("|");
}

/** Assemble a NormalizedEvent from a built property + event metadata. */
export function toNormalizedEvent(
  property: WritableProperty,
  meta: {
    eventKey: string;
    eventType: string;
    lifecycle: Lifecycle;
    foreclosureStage: string | null;
    permission: PublicationPermission;
    source: SourceMeta;
    internal?: NormalizedEvent["internal"];
  },
): NormalizedEvent {
  return {
    property,
    eventKey: meta.eventKey,
    eventType: meta.eventType,
    lifecycle: meta.lifecycle,
    foreclosureStage: meta.foreclosureStage,
    permission: meta.permission,
    source: meta.source,
    internal: meta.internal,
  };
}

/** Re-normalize an inbound lifecycle synonym (used by feed mappers). */
export function lifecycleFrom(v: string | null | undefined): Lifecycle {
  return normalizeLifecycle(v);
}

export { coerceNumber };
