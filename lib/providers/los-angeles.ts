// Los Angeles County (CA) — two INDEPENDENT pieces (Sections 9–13). SERVER ONLY.
//
//  1. LAEventFeedProvider — a production-ready automatic receiver for an official
//     or licensed daily recorded-document feed (NOD / NOS / rescission / trustee
//     deed). It consumes HTTPS CSV/JSON/XML/ZIP without code changes via env
//     config. It stays DISABLED until a lawful feed is configured — the LA
//     Registrar-Recorder has no public countywide automated NOD/NOS index, so we
//     never invent one and never fabricate events.
//
//  2. LAAssessorEnrichmentProvider — official LA County Assessor parcel ArcGIS
//     enrichment by AIN/APN. Enrichment ONLY; Assessor data never implies that a
//     property is in foreclosure.

import { serverEnv } from "@/lib/env.server";
import { conservativeFetch, realFetch, cached } from "@/lib/providers/http";
import { queryFeatures, pingService, arcgisEscape } from "@/lib/providers/arcgis";
import { normalizeApn } from "@/lib/normalize";
import { coerceNumber } from "@/lib/csv";
import { parseFeed, type FeedFormat } from "@/lib/providers/feed";
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

const RECORDER_AUTHORITY = "Los Angeles County Registrar-Recorder/County Clerk (or licensed recorded-document feed)";
const ASSESSOR_AUTHORITY = "Los Angeles County Office of the Assessor";
const HTTPS_FORMATS = new Set(["csv", "json", "xml", "zip"]);
const DEFAULT_LIMIT = 200;
const PARCEL_CACHE_TTL = 7 * 86_400_000;

function field(rec: RawSourceRecord, ...keys: string[]): string | null {
  const lower: Record<string, string | number | null | undefined> = {};
  for (const [k, v] of Object.entries(rec)) lower[k.toLowerCase().replace(/[\s_]+/g, "")] = v;
  for (const key of keys) {
    const v = lower[key.toLowerCase().replace(/[\s_]+/g, "")];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

// ------------------------ Assessor enrichment (piece 2) --------------------

export class LAAssessorEnrichmentProvider {
  readonly id = "la_assessor";
  readonly authority = ASSESSOR_AUTHORITY;

  isConfigured(): boolean {
    return Boolean(serverEnv.la.assessorArcgisUrl);
  }

  async testConnection(fetchImpl: FetchLike = realFetch): Promise<ConnectionResult> {
    const checkedAt = new Date().toISOString();
    if (!this.isConfigured()) {
      return {
        ok: false,
        configured: false,
        detail: "Assessor ArcGIS not configured (set LA_ASSESSOR_ARCGIS_URL — official public service, no credentials).",
        checkedAt,
        blocker: "not_configured",
      };
    }
    const ping = await pingService(serverEnv.la.assessorArcgisUrl, fetchImpl);
    return {
      ok: ping.ok,
      configured: true,
      detail: ping.ok ? `Assessor ArcGIS reachable${ping.name ? ` (${ping.name})` : ""}.` : `Assessor ArcGIS ${ping.error ?? "unreachable"}.`,
      checkedAt,
      blocker: ping.ok ? null : ping.error ?? "unreachable",
    };
  }

  meta(): SourceMeta {
    return {
      authority: ASSESSOR_AUTHORITY,
      sourceType: "arcgis_parcel",
      accessMethod: "arcgis_query",
      url: serverEnv.la.assessorArcgisUrl || null,
      collectedAt: new Date().toISOString(),
      sourceUpdatedAt: null,
      permission: "public_official",
    };
  }

  /** Enrich a normalized event by AIN/APN. Returns the same event with parcel
   *  fields merged and enrichment.matched set. */
  async enrich(event: NormalizedEvent, fetchImpl: FetchLike = realFetch): Promise<NormalizedEvent> {
    const service = serverEnv.la.assessorArcgisUrl;
    const ain = event.property.apn ? normalizeApn(event.property.apn) : null;
    if (!service || !ain) {
      event.enrichment = { attempted: Boolean(service), matched: false };
      return event;
    }
    const result = await cached(`la:parcel:${ain}`, PARCEL_CACHE_TTL, Date.now(), () =>
      queryFeatures(
        service,
        {
          where: `AIN='${arcgisEscape(ain)}' OR APN='${arcgisEscape(ain)}'`,
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
    p.latitude = p.latitude ?? feat.geometry?.y ?? numAttr(a, "CENTER_LAT", "LATITUDE", "LAT", "Y");
    p.longitude = p.longitude ?? feat.geometry?.x ?? numAttr(a, "CENTER_LON", "LONGITUDE", "LON", "X");
    p.address = p.address ?? strAttr(a, "SitusAddress", "SITUS_ADDR", "SitusStreet", "PropertyLocation");
    p.city = p.city ?? strAttr(a, "SitusCity", "SITUS_CITY", "City");
    p.zip = p.zip ?? strAttr(a, "SitusZIP", "SITUS_ZIP", "ZIPcode5");
    p.assessed_value = p.assessed_value ?? numAttr(a, "TotalValue", "AssdValue", "Roll_totLandImp", "TOT_VALUE");
    if (p.estimated_value == null && p.assessed_value != null) p.estimated_value = p.assessed_value;
    p.year_built = p.year_built ?? numAttr(a, "YearBuilt", "YR_BLT", "EffectiveYear");
    p.lot_size = p.lot_size ?? numAttr(a, "SQFTmain", "LotArea", "ParcelArea");
    p.property_type = p.property_type ?? mapUseType(strAttr(a, "UseType", "GeneralUseType", "PropertyType"));
    event.enrichment = { attempted: true, matched: true };
    return event;
  }
}

// ------------------------ Event-feed receiver (piece 1) --------------------

export class LAEventFeedProvider implements CountyProvider {
  readonly id = "la_county_recorder";
  readonly county = "Los Angeles";
  readonly state = "CA" as const;
  readonly label = "Los Angeles County recorded-document feed";
  private assessor = new LAAssessorEnrichmentProvider();

  private feedFormat(): FeedFormat | null {
    const t = serverEnv.la.feedType;
    return HTTPS_FORMATS.has(t) ? (t as FeedFormat) : null;
  }

  /** Enabled only when a lawful HTTPS feed (url + supported format) is set. */
  isEventSyncEnabled(): boolean {
    return Boolean(this.feedFormat() && serverEnv.la.feedUrl);
  }

  private feedMeta(): SourceMeta {
    return {
      authority: RECORDER_AUTHORITY,
      sourceType: "recorder_feed",
      accessMethod: `https_${serverEnv.la.feedType || "unknown"}`,
      url: null, // feed URL may embed a token → never surfaced
      collectedAt: new Date().toISOString(),
      sourceUpdatedAt: null,
      // Publish publicly ONLY when the license explicitly allows it.
      permission: serverEnv.la.publicationAllowed ? "contract_authorized" : "review_required",
    };
  }

  private authHeaders(): Record<string, string> {
    const { feedUsername, feedPassword } = serverEnv.la;
    if (feedUsername || feedPassword) {
      const token = Buffer.from(`${feedUsername}:${feedPassword}`).toString("base64");
      return { Authorization: `Basic ${token}` };
    }
    return {};
  }

  async testConnection(fetchImpl: FetchLike = realFetch): Promise<ConnectionResult> {
    const checkedAt = new Date().toISOString();
    const parts: string[] = [];
    let ok = false;
    let blocker: string | null = null;

    // Assessor enrichment is independent and may be live on its own.
    const assessor = await this.assessor.testConnection(fetchImpl);
    parts.push(assessor.ok ? "Assessor enrichment reachable." : `Assessor: ${assessor.detail}`);
    if (assessor.ok) ok = true;

    if (serverEnv.la.feedType === "sftp") {
      blocker = "sftp_ingestion_required";
      parts.push("SFTP feed configured — requires the secure file-drop ingestion worker (not an HTTPS pull).");
    } else if (this.isEventSyncEnabled()) {
      try {
        const res = await conservativeFetch(serverEnv.la.feedUrl, { headers: this.authHeaders(), timeoutMs: 15_000, retries: 1 }, fetchImpl);
        if (res.ok) {
          ok = true;
          parts.push("Event feed reachable.");
        } else {
          blocker = blocker ?? `feed HTTP ${res.status}`;
          parts.push(`Event feed returned HTTP ${res.status}.`);
        }
      } catch (err) {
        blocker = blocker ?? (err instanceof Error ? err.message : "feed unreachable");
        parts.push("Event feed unreachable.");
      }
    } else {
      parts.push(FEED_REQUIREMENT);
    }
    return { ok, configured: this.isEventSyncEnabled() || this.assessor.isConfigured(), detail: parts.join(" "), checkedAt, blocker: ok && this.isEventSyncEnabled() ? null : blocker };
  }

  async discoverEvents(opts: DiscoverOptions = {}, fetchImpl: FetchLike = realFetch): Promise<DiscoverResult> {
    if (serverEnv.la.feedType === "sftp") {
      return { configured: true, records: [], detail: "SFTP feed configured.", blocker: "SFTP requires the secure file-drop ingestion worker; HTTPS pull only in this runtime." };
    }
    if (!this.isEventSyncEnabled()) {
      return { configured: false, records: [], detail: "LA event feed not configured.", blocker: FEED_REQUIREMENT };
    }
    const format = this.feedFormat()!;
    const limit = opts.limit ?? DEFAULT_LIMIT;
    try {
      const res = await conservativeFetch(serverEnv.la.feedUrl, { headers: this.authHeaders(), timeoutMs: 30_000, retries: 2 }, fetchImpl);
      if (!res.ok) return { configured: true, records: [], detail: "Feed fetch failed.", blocker: `HTTP ${res.status}` };
      const body = format === "zip" ? Buffer.from(await res.arrayBuffer()) : await res.text();
      const { records } = parseFeed(format, body);
      return { configured: true, records: records.slice(0, limit), detail: `Parsed ${Math.min(records.length, limit)} record(s) from the ${format.toUpperCase()} feed.` };
    } catch (err) {
      return { configured: true, records: [], detail: "Feed unreachable.", blocker: err instanceof Error ? err.message : "request failed" };
    }
  }

  async fetchEventDetails(record: RawSourceRecord): Promise<RawSourceRecord> {
    return record; // a recorded-document feed carries full detail per row
  }

  normalizeEvent(record: RawSourceRecord): NormalizedEvent | null {
    const docNumber = field(record, "DocumentNumber", "DocNumber", "DocumentID", "InstrumentNumber", "RecordingNumber");
    const recordingDate = field(record, "RecordingDate", "RecordedDate", "DocumentDate");
    const docType = field(record, "DocumentType", "DocType", "DocumentTypeDescription", "NoticeType");
    const ain = field(record, "AIN", "APN", "ParcelNumber", "AssessorID");
    const address = field(record, "PropertyAddress", "SitusAddress", "Address", "PropertyStreet");

    if (!docType) return null; // a foreclosure event must declare its document type
    if (!ain && !address) return null; // need a property identity

    const { stage, lifecycle } = stageAndLifecycle(null, docType);
    const source = this.feedMeta();
    const permission = source.permission;

    const property = buildProperty({
      sourceName: this.id,
      state: "CA",
      county: this.county,
      address,
      city: field(record, "City", "PropertyCity", "SitusCity"),
      zip: field(record, "Zip", "ZipCode", "PropertyZip", "SitusZip"),
      apn: ain,
      propertyType: field(record, "PropertyType", "UseType"),
      foreclosureStage: stage,
      lifecycle,
      permission,
      saleDate: field(record, "SaleDate", "AuctionDate", "TrusteeSaleDate"),
      saleTime: field(record, "SaleTime", "AuctionTime"),
      saleLocation: field(record, "SaleLocation", "AuctionLocation"),
      openingBid: coerceNumber(field(record, "OpeningBid", "MinimumBid", "UnpaidBalance")),
      judgmentAmount: coerceNumber(field(record, "AmountInDefault", "DefaultAmount", "JudgmentAmount")),
      caseNumber: field(record, "CaseNumber", "TSNumber", "TrusteeSaleNumber"),
      documentNumber: docNumber,
      noticeType: docType,
      noticeRecordingDate: recordingDate,
      defaultDate: field(record, "DefaultDate", "DateOfDefault"),
      trusteeName: field(record, "Trustee", "TrusteeName"),
      sourceUrl: field(record, "DocumentURL", "DetailURL", "URL"),
      source,
    });
    if (!property) return null;

    // Event identity: doc# + recording date preferred; else APN + docType + date.
    const key = docNumber
      ? eventKeyFor([docNumber, recordingDate, "la"])
      : eventKeyFor([ain, docType, recordingDate, "la"]);

    return toNormalizedEvent(property, {
      eventKey: key,
      eventType: laEventType(stage),
      lifecycle,
      foreclosureStage: stage,
      permission,
      source,
      // Trustor/borrower + beneficiary retained INTERNAL only — never published.
      internal: {
        borrowerName: field(record, "Trustor", "TrustorName", "BorrowerName", "OwnerName"),
        beneficiary: field(record, "Beneficiary", "BeneficiaryName", "Lender"),
        trustee: field(record, "Trustee", "TrusteeName"),
      },
    });
  }

  async enrichProperty(event: NormalizedEvent, fetchImpl: FetchLike = realFetch): Promise<NormalizedEvent> {
    return this.assessor.enrich(event, fetchImpl);
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

/** The single precise requirement shown when no LA feed is configured. */
export const FEED_REQUIREMENT =
  "Los Angeles County foreclosure event feed required. Configure an authorized Recorder bulk feed or licensed NOD/NOS daily feed.";

function laEventType(stage: string | null): string {
  switch (stage) {
    case "notice_of_default":
      return "new_filing";
    case "notice_of_sale":
      return "auction_scheduled";
    case "cancelled":
      return "auction_cancelled";
    case "sold_third_party":
      return "sold_to_third_party";
    default:
      return "new_filing";
  }
}

function mapUseType(v: string | null): string | null {
  if (!v) return null;
  const s = v.toLowerCase();
  if (/single|sfr|residential/.test(s)) return "single_family";
  if (/condo/.test(s)) return "condo";
  if (/duplex|triplex|2-4|two-four/.test(s)) return "multifamily_2_4";
  if (/apartment|multi/.test(s)) return "multifamily_5plus";
  if (/commercial|retail|office/.test(s)) return "commercial";
  if (/vacant|land/.test(s)) return "land";
  return "other";
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
