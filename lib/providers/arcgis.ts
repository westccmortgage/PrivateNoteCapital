// Minimal, compliant Esri ArcGIS FeatureServer query client. SERVER ONLY.
//
// Palm Beach County (Property Appraiser) and Los Angeles County (Assessor) both
// publish official parcel data as ArcGIS FeatureServer / MapServer layers with a
// public REST query API. This client issues ONLY documented `query` requests,
// respects maxRecordCount + pagination, times out, and backs off. It is used for
// ENRICHMENT of an already-discovered foreclosure event — never to discover that
// a property is in foreclosure.

import { conservativeFetch } from "@/lib/providers/http";
import type { FetchLike } from "@/lib/providers/types";

export interface ArcgisQuery {
  where: string; // e.g. "PCN='00434412...'"  (build with arcgisEscape)
  outFields?: string; // default "*"
  resultRecordCount?: number; // bounded page size
  resultOffset?: number;
  returnGeometry?: boolean; // default false (centroid handled separately)
  outSR?: number; // spatial reference for geometry (default 4326 → lat/long)
}

export interface ArcgisFeature {
  attributes: Record<string, string | number | null>;
  geometry?: { x?: number; y?: number } | null;
}

export interface ArcgisResult {
  ok: boolean;
  features: ArcgisFeature[];
  exceededTransferLimit: boolean;
  error?: string | null;
  status: number;
}

/** Escape a value for an ArcGIS SQL `where` string (single-quote SQL literal). */
export function arcgisEscape(v: string): string {
  return String(v).replace(/'/g, "''");
}

/** Build a documented FeatureServer query URL. `service` is the layer's base
 *  (…/FeatureServer/0). No credentials, no tokens embedded here. */
export function buildQueryUrl(service: string, q: ArcgisQuery): string {
  const base = service.replace(/\/+$/, "");
  const params = new URLSearchParams({
    f: "json",
    where: q.where,
    outFields: q.outFields ?? "*",
    returnGeometry: String(q.returnGeometry ?? false),
    outSR: String(q.outSR ?? 4326),
  });
  if (q.resultRecordCount != null) params.set("resultRecordCount", String(q.resultRecordCount));
  if (q.resultOffset != null) params.set("resultOffset", String(q.resultOffset));
  return `${base}/query?${params.toString()}`;
}

/**
 * Run a single bounded ArcGIS query. Returns features (possibly empty) and a flag
 * for whether the server truncated the result. Never throws — network/parse
 * failures come back as { ok:false, error }.
 */
export async function queryFeatures(
  service: string,
  q: ArcgisQuery,
  fetchImpl?: FetchLike,
): Promise<ArcgisResult> {
  const url = buildQueryUrl(service, q);
  try {
    const res = await conservativeFetch(url, { timeoutMs: 15_000, retries: 2 }, fetchImpl);
    if (!res.ok) {
      return { ok: false, features: [], exceededTransferLimit: false, status: res.status, error: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as {
      features?: ArcgisFeature[];
      exceededTransferLimit?: boolean;
      error?: { message?: string };
    };
    if (body.error) {
      return { ok: false, features: [], exceededTransferLimit: false, status: res.status, error: body.error.message ?? "ArcGIS error" };
    }
    return {
      ok: true,
      features: Array.isArray(body.features) ? body.features : [],
      exceededTransferLimit: Boolean(body.exceededTransferLimit),
      status: res.status,
    };
  } catch (err) {
    return {
      ok: false,
      features: [],
      exceededTransferLimit: false,
      status: 0,
      error: err instanceof Error ? err.message : "request failed",
    };
  }
}

/**
 * Query with pagination, respecting the server's page size and an overall hard
 * cap so we never hammer a service. Stops at `maxRecords` or when the server
 * reports no more pages.
 */
export async function queryAll(
  service: string,
  q: ArcgisQuery,
  opts: { pageSize?: number; maxRecords?: number } = {},
  fetchImpl?: FetchLike,
): Promise<ArcgisResult> {
  const pageSize = Math.min(opts.pageSize ?? 200, 1000);
  const maxRecords = opts.maxRecords ?? 1000;
  const all: ArcgisFeature[] = [];
  let offset = 0;
  let lastStatus = 0;

  while (all.length < maxRecords) {
    const page = await queryFeatures(
      service,
      { ...q, resultRecordCount: pageSize, resultOffset: offset },
      fetchImpl,
    );
    lastStatus = page.status;
    if (!page.ok) {
      // Return what we have plus the error (partial success is still useful).
      return { ok: all.length > 0, features: all, exceededTransferLimit: false, status: lastStatus, error: page.error };
    }
    all.push(...page.features);
    if (!page.exceededTransferLimit || page.features.length === 0) break;
    offset += page.features.length;
  }
  return { ok: true, features: all.slice(0, maxRecords), exceededTransferLimit: false, status: lastStatus };
}

/** Reachability probe: query the layer's metadata (`?f=json`) without fetching
 *  records. Confirms the official service responds, publishing nothing. */
export async function pingService(
  service: string,
  fetchImpl?: FetchLike,
): Promise<{ ok: boolean; status: number; name?: string; error?: string }> {
  const base = service.replace(/\/+$/, "");
  try {
    const res = await conservativeFetch(`${base}?f=json`, { timeoutMs: 12_000, retries: 1 }, fetchImpl);
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const body = (await res.json()) as { name?: string; error?: { message?: string } };
    if (body.error) return { ok: false, status: res.status, error: body.error.message ?? "service error" };
    return { ok: true, status: res.status, name: body.name };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : "request failed" };
  }
}
