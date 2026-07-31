// Palm Beach County (FL) foreclosure collector — PRIMARY live collector.
// SERVER ONLY.
//
// Official sources (Section 4):
//   - Event data: the Palm Beach County Clerk's foreclosure auction calendar /
//     ClerkCart report. Automated access runs ONLY against an owner-authorized
//     machine-readable report URL (CSV or JSON) — we do NOT scrape the rendered
//     RealAuction site or bypass any access control. Until that URL is
//     configured, event sync is disabled and the panel shows the exact owner
//     action; NO data is fabricated.
//   - Parcel enrichment: the official Palm Beach County Property Appraiser
//     ArcGIS FeatureServer (public, no credentials — a service URL is
//     configuration, not a secret).
//
// Produces the EXISTING canonical property model via lib/providers/event.

import { serverEnv } from "@/lib/env.server";
import { conservativeFetch, realFetch, cached } from "@/lib/providers/http";
import { queryFeatures, pingService, arcgisEscape } from "@/lib/providers/arcgis";
import { normalizeApn } from "@/lib/normalize";
import { coerceNumber } from "@/lib/csv";
import { parseCsvFeed, parseJsonFeed } from "@/lib/providers/feed";
import {
  buildProperty,
  stageAndLifecycle,
  eventKeyFor,
  toNormalizedEvent,
} from "@/lib/providers/event";
import { reconcileMissing } from "@/lib/providers/persist";
import type {
  CountyProvider,
  ConnectionResult,
  DiscoverResult,
  DiscoverOptions,
  NormalizedEvent,
  RawSourceRecord,
  SourceMeta,
  SyncOptions,
  FetchLike,
} from "@/lib/providers/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const AUTHORITY = "Palm Beach County Clerk of the Circuit Court & Comptroller";
const PARCEL_AUTHORITY = "Palm Beach County Property Appraiser";
const DEFAULT_LIMIT = 100;
const PARCEL_CACHE_TTL = 7 * 86_400_000; // parcels are stable → cache a week

/** Case-insensitive first-present field lookup across common header spellings. */
function field(rec: RawSourceRecord, ...keys: string[]): string | null {
  const lower: Record<string, string | number | null | undefined> = {};
  for (const [k, v] of Object.entries(rec)) lower[k.toLowerCase().replace(/[\s_]+/g, "")] = v;
  for (const key of keys) {
    const v = lower[key.toLowerCase().replace(/[\s_]+/g, "")];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

export class PalmBeachForeclosureProvider implements CountyProvider {
  readonly id = "palm_beach_county";
  readonly county = "Palm Beach";
  readonly state = "FL" as const;
  readonly label = "Official Palm Beach County records";

  isEventSyncEnabled(): boolean {
    return Boolean(serverEnv.palmBeach.eventSourceUrl);
  }

  private eventSourceMeta(): SourceMeta {
    return {
      authority: AUTHORITY,
      sourceType: "clerk_auction_report",
      accessMethod: serverEnv.palmBeach.eventSourceType === "json" ? "https_json" : "https_csv",
      url: null, // the configured report URL may embed a token → never surfaced
      collectedAt: new Date().toISOString(),
      sourceUpdatedAt: null,
      permission: serverEnv.palmBeach.publicationAllowed ? "public_official" : "review_required",
    };
  }

  async testConnection(fetchImpl: FetchLike = realFetch): Promise<ConnectionResult> {
    const checkedAt = new Date().toISOString();
    const parts: string[] = [];
    let ok = false;
    let blocker: string | null = null;

    // Parcel service (public official) — the piece that runs without credentials.
    if (serverEnv.palmBeach.parcelArcgisUrl) {
      const ping = await pingService(serverEnv.palmBeach.parcelArcgisUrl, fetchImpl);
      if (ping.ok) {
        ok = true;
        parts.push(`Parcel ArcGIS reachable${ping.name ? ` (${ping.name})` : ""}.`);
      } else {
        blocker = `Parcel ArcGIS ${ping.error ?? "unreachable"}`;
        parts.push(`Parcel ArcGIS unreachable: ${ping.error ?? "unknown"}.`);
      }
    } else {
      parts.push("Parcel ArcGIS not configured (set PBC_PARCEL_ARCGIS_URL — official public service, no credentials).");
    }

    // Event source (authorized report) — reachability probe only, no publish.
    if (this.isEventSyncEnabled()) {
      try {
        const res = await conservativeFetch(
          this.reportUrl(),
          { headers: this.reportHeaders(), timeoutMs: 15_000, retries: 1 },
          fetchImpl,
        );
        if (res.ok) {
          ok = true;
          parts.push("Authorized event report reachable.");
        } else {
          blocker = blocker ?? `Event report HTTP ${res.status}`;
          parts.push(`Event report returned HTTP ${res.status}.`);
        }
      } catch (err) {
        blocker = blocker ?? (err instanceof Error ? err.message : "event report unreachable");
        parts.push("Event report unreachable.");
      }
    } else {
      parts.push("Event report not configured — owner must supply an AUTHORIZED ClerkCart/auction report URL.");
    }

    return { ok, configured: Boolean(serverEnv.palmBeach.parcelArcgisUrl || this.isEventSyncEnabled()), detail: parts.join(" "), checkedAt, blocker: ok ? null : blocker };
  }

  private reportUrl(): string {
    const url = serverEnv.palmBeach.eventSourceUrl;
    const token = serverEnv.palmBeach.eventSourceToken;
    if (token && !/[?&]token=/.test(url)) {
      return url + (url.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(token);
    }
    return url;
  }

  private reportHeaders(): Record<string, string> {
    const token = serverEnv.palmBeach.eventSourceToken;
    // Prefer a bearer header when a token is set but not already in the URL.
    return token && !/[?&]token=/.test(serverEnv.palmBeach.eventSourceUrl)
      ? { Authorization: `Bearer ${token}` }
      : {};
  }

  async discoverEvents(opts: DiscoverOptions = {}, fetchImpl: FetchLike = realFetch): Promise<DiscoverResult> {
    if (!this.isEventSyncEnabled()) {
      return {
        configured: false,
        records: [],
        detail: "Palm Beach event source not configured.",
        blocker:
          "Configure an AUTHORIZED Palm Beach Clerk auction/ClerkCart report URL (PBC_AUCTION_REPORT_URL). The public RealAuction calendar is not scraped without confirmed terms.",
      };
    }
    const limit = opts.limit ?? DEFAULT_LIMIT;
    try {
      const res = await conservativeFetch(
        this.reportUrl(),
        { headers: this.reportHeaders(), timeoutMs: 20_000, retries: 2 },
        fetchImpl,
      );
      if (!res.ok) {
        return { configured: true, records: [], detail: `Report fetch failed.`, blocker: `HTTP ${res.status}` };
      }
      const body = await res.text();
      const records =
        serverEnv.palmBeach.eventSourceType === "json" ? parseJsonRecords(body) : parseCsvRecords(body);
      return {
        configured: true,
        records: records.slice(0, limit),
        detail: `Discovered ${Math.min(records.length, limit)} record(s) from the authorized report.`,
      };
    } catch (err) {
      return {
        configured: true,
        records: [],
        detail: "Report unreachable.",
        blocker: err instanceof Error ? err.message : "request failed",
      };
    }
  }

  async fetchEventDetails(record: RawSourceRecord): Promise<RawSourceRecord> {
    // The ClerkCart/auction report already carries case + sale detail. A separate
    // case-detail endpoint would be hit here if one were authorized.
    return record;
  }

  normalizeEvent(record: RawSourceRecord): NormalizedEvent | null {
    const caseNumber = field(record, "CaseNumber", "Case", "CaseNo", "CaseID");
    const pcn = field(record, "PCN", "ParcelControlNumber", "ParcelID", "ParcelNumber", "APN");
    const address = field(record, "PropertyAddress", "Address", "SitusAddress", "PropertyStreet");
    const saleDate = field(record, "SaleDate", "AuctionDate", "SaleDateTime");
    const status = field(record, "SaleStatus", "Status", "AuctionStatus", "CaseStatus");

    // Need at least a parcel or an address to have a property identity.
    if (!pcn && !address) return null;

    const { stage, lifecycle } = stageAndLifecycle(status);
    const source = this.eventSourceMeta();
    const permission = source.permission;

    const property = buildProperty({
      sourceName: this.id,
      state: "FL",
      county: this.county,
      address,
      city: field(record, "City", "PropertyCity"),
      zip: field(record, "Zip", "ZipCode", "PropertyZip"),
      apn: pcn,
      propertyType: field(record, "PropertyType", "PropertyUse", "UseCode"),
      foreclosureStage: stage,
      lifecycle,
      permission,
      saleDate,
      saleTime: field(record, "SaleTime", "AuctionTime"),
      saleLocation: field(record, "SaleLocation", "AuctionLocation") ?? "Online — Palm Beach Clerk auction",
      openingBid: coerceNumber(field(record, "OpeningBid", "MinimumBid", "PlaintiffMaxBid")),
      judgmentAmount: coerceNumber(field(record, "FinalJudgmentAmount", "JudgmentAmount", "FinalJudgment")),
      assessedValue: coerceNumber(field(record, "AssessedValue", "AssessedTotal")),
      caseNumber,
      noticeType: field(record, "NoticeType", "SaleType"),
      trusteeName: null,
      sourceUrl: field(record, "AuctionURL", "CaseURL", "DetailURL", "URL"),
      source,
    });
    if (!property) return null;

    return toNormalizedEvent(property, {
      eventKey: eventKeyFor([caseNumber, saleDate, "pb"]),
      eventType: stage === "cancelled" ? "auction_cancelled" : stage === "postponed" ? "auction_postponed" : "auction_scheduled",
      lifecycle,
      foreclosureStage: stage,
      permission,
      source,
      // Plaintiff retained as INTERNAL case metadata only — never published.
      internal: { plaintiff: field(record, "Plaintiff", "PlaintiffName") },
    });
  }

  async enrichProperty(event: NormalizedEvent, fetchImpl: FetchLike = realFetch): Promise<NormalizedEvent> {
    const service = serverEnv.palmBeach.parcelArcgisUrl;
    const pcn = event.property.apn ? normalizeApn(event.property.apn) : null;
    if (!service || !pcn) {
      event.enrichment = { attempted: Boolean(service), matched: false };
      return event;
    }
    const result = await cached(`pb:parcel:${pcn}`, PARCEL_CACHE_TTL, Date.now(), () =>
      queryFeatures(
        service,
        {
          where: `PCN='${arcgisEscape(pcn)}' OR PARID='${arcgisEscape(pcn)}' OR PARCELNO='${arcgisEscape(pcn)}'`,
          outFields: "*",
          resultRecordCount: 1,
          returnGeometry: true,
        },
        fetchImpl,
      ),
    );
    const feat = result.features[0];
    if (!feat) {
      event.enrichment = { attempted: true, matched: false };
      return event;
    }
    const a = feat.attributes;
    const p = event.property;
    p.latitude = p.latitude ?? feat.geometry?.y ?? numAttr(a, "LATITUDE", "LAT", "Y");
    p.longitude = p.longitude ?? feat.geometry?.x ?? numAttr(a, "LONGITUDE", "LON", "X");
    p.address = p.address ?? strAttr(a, "SITUS_ADDR", "SITEADDRESS", "SITUS", "PROP_ADDR");
    p.city = p.city ?? strAttr(a, "SITUS_CITY", "CITY", "MUNI_NAME");
    p.zip = p.zip ?? strAttr(a, "SITUS_ZIP", "ZIPCODE", "ZIP");
    p.assessed_value = p.assessed_value ?? numAttr(a, "ASSD_VAL", "ASSESSEDVALUE", "TOT_VAL", "JV");
    if (p.estimated_value == null && p.assessed_value != null) p.estimated_value = p.assessed_value;
    p.lot_size = p.lot_size ?? numAttr(a, "ACRES", "LOTSIZE", "LAND_SF");
    p.year_built = p.year_built ?? numAttr(a, "YEARBUILT", "YR_BLT", "ACT_YR_BLT");
    event.enrichment = { attempted: true, matched: true };
    return event;
  }

  async syncIncremental(opts: SyncOptions = {}, fetchImpl: FetchLike = realFetch): Promise<NormalizedEvent[]> {
    const discovered = await this.discoverEvents(opts, fetchImpl);
    const out: NormalizedEvent[] = [];
    for (const raw of discovered.records) {
      const norm = this.normalizeEvent(raw);
      if (!norm) continue;
      out.push(opts.enrich === false ? norm : await this.enrichProperty(norm, fetchImpl));
    }
    return out;
  }

  async reconcileMissingEvents(seenExternalIds: string[], admin: unknown): Promise<string[]> {
    return reconcileMissing(admin as SupabaseClient, this.id, seenExternalIds);
  }
}

// ------------------------------ attribute helpers --------------------------
// (Palm Beach report bodies parse via the shared, pure feed layer.)

function parseCsvRecords(text: string): RawSourceRecord[] {
  return parseCsvFeed(text);
}
function parseJsonRecords(text: string): RawSourceRecord[] {
  return parseJsonFeed(text);
}

function numAttr(a: Record<string, string | number | null>, ...keys: string[]): number | null {
  for (const k of keys) {
    const found = Object.entries(a).find(([kk]) => kk.toLowerCase() === k.toLowerCase());
    if (found && found[1] != null && String(found[1]).trim() !== "") {
      const n = Number(String(found[1]).replace(/[$,\s]/g, ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}
function strAttr(a: Record<string, string | number | null>, ...keys: string[]): string | null {
  for (const k of keys) {
    const found = Object.entries(a).find(([kk]) => kk.toLowerCase() === k.toLowerCase());
    if (found && found[1] != null && String(found[1]).trim() !== "") return String(found[1]).trim();
  }
  return null;
}
