// Shared types for the automatic county foreclosure collectors (Palm Beach + LA).
//
// Both providers implement CountyProvider and produce the EXISTING canonical
// property model (see lib/property.ts / foreclosure_properties). No new property
// tables, no new search. A provider's job is: talk to an OFFICIAL source, turn
// raw records into NormalizedEvents, and hand them to the shared persist layer.
//
// Compliance is first-class: every record carries a SourceMeta (authority, url,
// type, access method, timestamps) and a PublicationPermission. Only
// public_official / contract_authorized records may auto-publish.

import type { Lifecycle } from "@/lib/normalize";
import type { WritableProperty } from "@/lib/import-writer";

// ------------------------------ compliance ---------------------------------

/** Publication permission state for a source record (Section 3). Only
 *  public_official and contract_authorized may be automatically published. */
export type PublicationPermission =
  | "public_official" // official government record, public + automatable
  | "contract_authorized" // licensed/authorized bulk or paid feed
  | "review_required" // needs a human decision before public display
  | "restricted" // internal-use-only; never public
  | "unknown"; // provenance unclear → never public

/** Provenance stamped on every collected record. */
export interface SourceMeta {
  authority: string; // e.g. "Palm Beach County Clerk of the Circuit Court"
  sourceType: string; // e.g. "official_auction_calendar" | "clerkcart_report" | "recorder_feed" | "arcgis_parcel"
  accessMethod: string; // e.g. "https_json" | "https_csv" | "https_zip" | "sftp" | "arcgis_query"
  url: string | null; // official record/source URL (no tokens)
  collectedAt: string; // ISO — when WE fetched it
  sourceUpdatedAt: string | null; // ISO — source's own "last updated", when known
  permission: PublicationPermission;
}

// ------------------------------ event model --------------------------------

/**
 * A raw source record before normalization. Loosely typed on purpose — each
 * source shape differs. Providers map it to a NormalizedEvent.
 */
export type RawSourceRecord = Record<string, string | number | null | undefined>;

/**
 * The output of normalizeEvent(): a fully-canonical property ready for upsert,
 * plus the event identity used for change-detection/dedup and lifecycle. The
 * `internal` bag holds party data (plaintiff, borrower) that is retained as case
 * metadata but MUST NOT be published or shown publicly.
 */
export interface NormalizedEvent {
  /** Property row for the existing foreclosure_properties model (upsert-ready). */
  property: WritableProperty;
  /** Deterministic event identity (case# + sale date, or doc# + recording date). */
  eventKey: string;
  /** Change-log event type (maps to auction_event_type where possible). */
  eventType: string;
  lifecycle: Lifecycle;
  foreclosureStage: string | null;
  permission: PublicationPermission;
  source: SourceMeta;
  /** NEVER published. Party/borrower data kept only for internal reconciliation. */
  internal?: {
    plaintiff?: string | null;
    borrowerName?: string | null;
    beneficiary?: string | null;
    trustee?: string | null;
  };
  /** Parcel-enrichment outcome (set by enrichProperty). */
  enrichment?: { attempted: boolean; matched: boolean };
}

/** Parcel enrichment result from an official ArcGIS/assessor service. */
export interface ParcelEnrichment {
  matched: boolean;
  apn?: string | null;
  situsAddress?: string | null;
  city?: string | null;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  legalDescription?: string | null;
  propertyType?: string | null;
  assessedValue?: number | null; // labeled as assessed, NOT market value
  lotSize?: number | null;
  yearBuilt?: number | null;
  source: SourceMeta;
}

// ------------------------------ results ------------------------------------

/** Whether a source is reachable, without publishing anything. */
export interface ConnectionResult {
  ok: boolean;
  configured: boolean;
  detail: string; // human-readable; no secrets
  checkedAt: string;
  blocker?: string | null; // exact blocker when !ok (e.g. HTTP 403, not configured)
}

export interface DiscoverResult {
  configured: boolean;
  records: RawSourceRecord[];
  detail: string;
  blocker?: string | null;
}

/** Per-county sync result — the numbers the admin panel shows. */
export interface SyncResult {
  county: string;
  provider: string;
  correlationId: string;
  ranAt: string;
  ok: boolean;
  configured: boolean;
  enabled: boolean;
  received: number;
  created: number;
  updated: number;
  published: number;
  draft: number;
  archived: number; // cancelled/sold/withdrawn removed from public search
  deactivated: number; // alias used by the panel for archived-this-run
  rejected: number;
  unmatchedParcels: number;
  reconciliationFlagged: number;
  ownerActionRequired: string | null;
  detail: string;
  events?: Record<string, number>; // e.g. { nod: 3, nos: 5, rescission: 1, trustee_deed: 2 }
}

// ------------------------------ interface ----------------------------------

/**
 * The shared county-provider interface (Section 2). Palm Beach and LA both
 * implement it. Methods that hit the network accept an injectable fetch so the
 * unit tests never touch a real endpoint.
 */
export interface CountyProvider {
  readonly id: string; // stored as source_name on the property rows
  readonly county: string; // e.g. "Palm Beach" | "Los Angeles"
  readonly state: "CA" | "FL";
  readonly label: string; // public source label (e.g. "Official Palm Beach County records")

  /** Is this provider configured + enabled to sync events right now? */
  isEventSyncEnabled(): boolean;

  /** Reach the official source without publishing anything. */
  testConnection(fetchImpl?: FetchLike): Promise<ConnectionResult>;

  /** Pull a bounded set of raw source records (upcoming auctions / recorded docs). */
  discoverEvents(opts?: DiscoverOptions, fetchImpl?: FetchLike): Promise<DiscoverResult>;

  /** Optionally hydrate a single record with case/auction detail. */
  fetchEventDetails(record: RawSourceRecord, fetchImpl?: FetchLike): Promise<RawSourceRecord>;

  /** Pure: raw source record → canonical NormalizedEvent (no I/O). */
  normalizeEvent(record: RawSourceRecord): NormalizedEvent | null;

  /** Enrich a normalized event with official parcel data (ArcGIS/assessor). */
  enrichProperty(event: NormalizedEvent, fetchImpl?: FetchLike): Promise<NormalizedEvent>;

  /** One bounded incremental run: discover → normalize → enrich (no persist). */
  syncIncremental(opts?: SyncOptions, fetchImpl?: FetchLike): Promise<NormalizedEvent[]>;

  /** Identify previously-seen records absent from the latest pull (flag, never delete). */
  reconcileMissingEvents(seenExternalIds: string[], admin: unknown): Promise<string[]>;
}

export interface DiscoverOptions {
  limit?: number; // hard cap on records pulled
  since?: string; // ISO — only records updated/recorded on/after this
}

export interface SyncOptions extends DiscoverOptions {
  enrich?: boolean; // default true
}

/** Minimal fetch signature so tests can inject a stub. */
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<FetchLikeResponse>;

export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  headers?: { get(name: string): string | null };
  text(): Promise<string>;
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}
