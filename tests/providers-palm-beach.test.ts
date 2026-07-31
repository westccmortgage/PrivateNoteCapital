import { test } from "node:test";
import assert from "node:assert/strict";
import { PalmBeachForeclosureProvider } from "@/lib/providers/palm-beach";
import { clearHttpCache } from "@/lib/providers/http";
import type { FetchLike, FetchLikeResponse } from "@/lib/providers/types";

// ---- fetch stub ----
function resp(body: string, status = 200, json?: unknown): FetchLikeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => body,
    json: async () => (json !== undefined ? json : JSON.parse(body)),
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  };
}
function stub(handler: (url: string) => FetchLikeResponse): FetchLike {
  return async (url: string) => handler(url);
}

function setEnv(over: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function pbRecord(over: Record<string, string> = {}): Record<string, string> {
  return {
    CaseNumber: "50-2026-CA-000123",
    PropertyAddress: "123 Ocean Ave",
    City: "West Palm Beach",
    Zip: "33401",
    PCN: "00-43-44-12-05-000-0010",
    SaleDate: "09/01/2026",
    SaleTime: "10:00 AM",
    SaleStatus: "Scheduled",
    OpeningBid: "$250,000",
    FinalJudgmentAmount: "300000",
    Plaintiff: "ACME BANK NA",
    AuctionURL: "https://palmbeach.realforeclose.com/index.cfm?case=123",
    ...over,
  };
}

const provider = new PalmBeachForeclosureProvider();

// 1. Connection test hits the official parcel service + authorized report.
test("PB: testConnection reaches configured official sources", async () => {
  setEnv({
    PBC_PARCEL_ARCGIS_URL: "https://gis.example.gov/FeatureServer/0",
    PBC_AUCTION_REPORT_URL: "https://clerk.example.gov/report.json",
    PBC_AUCTION_SOURCE_TYPE: "json",
  });
  const conn = await provider.testConnection(stub(() => resp(JSON.stringify({ name: "Parcels" }))));
  assert.equal(conn.ok, true);
  assert.match(conn.detail, /Parcel ArcGIS reachable/);
  setEnv({ PBC_PARCEL_ARCGIS_URL: undefined, PBC_AUCTION_REPORT_URL: undefined, PBC_AUCTION_SOURCE_TYPE: undefined });
});

// 2. Upcoming sale normalizes to a published, active auction.
test("PB: upcoming sale → published auction", () => {
  const e = provider.normalizeEvent(pbRecord());
  assert.ok(e);
  assert.equal(e!.property.record_status, "published");
  assert.equal(e!.property.foreclosure_stage, "auction");
  assert.equal(e!.property.state, "FL");
  assert.equal(e!.property.county, "Palm Beach");
  assert.equal(e!.property.current_auction_date, "2026-09-01");
  assert.equal(e!.property.case_number, "50-2026-CA-000123");
  assert.equal(e!.property.opening_bid, 250000);
});

// 3. Plaintiff is retained internally but NEVER on the published property row.
test("PB: plaintiff kept internal, not on property row", () => {
  const e = provider.normalizeEvent(pbRecord())!;
  assert.equal(e.internal?.plaintiff, "ACME BANK NA");
  assert.ok(!JSON.stringify(e.property).includes("ACME BANK"));
});

// 4. Cancellation → archived.
test("PB: cancelled sale → archived", () => {
  const e = provider.normalizeEvent(pbRecord({ SaleStatus: "Canceled" }))!;
  assert.equal(e.lifecycle, "cancelled");
  assert.equal(e.property.record_status, "archived");
});

// 5. Postponement → postponed stage, still active lifecycle.
test("PB: postponed sale → postponed stage", () => {
  const e = provider.normalizeEvent(pbRecord({ SaleStatus: "Postponed" }))!;
  assert.equal(e.property.foreclosure_stage, "postponed");
  assert.equal(e.lifecycle, "postponed");
});

// 6. Changed sale date keeps one identity (idempotent upsert target).
test("PB: changed sale date → same external_id", () => {
  const a = provider.normalizeEvent(pbRecord({ SaleDate: "09/01/2026" }))!;
  const b = provider.normalizeEvent(pbRecord({ SaleDate: "10/15/2026" }))!;
  assert.equal(a.property.external_id, b.property.external_id);
});

// 7. Case-number/PCN dedup: same parcel → one property.
test("PB: same PCN dedupes to one property", () => {
  const a = provider.normalizeEvent(pbRecord({ PCN: "00-43-44-12-05-000-0010" }))!;
  const b = provider.normalizeEvent(pbRecord({ PCN: "0043441205000 0010", CaseNumber: "50-2026-CA-999" }))!;
  assert.equal(a.property.external_id, b.property.external_id);
});

// 8. Parcel PCN enrichment merges official parcel fields.
test("PB: parcel enrichment merges lat/long + assessed", async () => {
  clearHttpCache();
  setEnv({ PBC_PARCEL_ARCGIS_URL: "https://gis.example.gov/FeatureServer/0" });
  const e = provider.normalizeEvent(pbRecord())!;
  const enriched = await provider.enrichProperty(
    e,
    stub((url) => {
      assert.match(url, /\/query\?/);
      return resp("", 200, {
        features: [{ attributes: { ASSD_VAL: 275000, ACRES: 0.25, YEARBUILT: 1998 }, geometry: { x: -80.05, y: 26.71 } }],
      });
    }),
  );
  assert.equal(enriched.enrichment?.matched, true);
  assert.equal(enriched.property.latitude, 26.71);
  assert.equal(enriched.property.longitude, -80.05);
  assert.equal(enriched.property.assessed_value, 275000);
  assert.equal(enriched.property.year_built, 1998);
  setEnv({ PBC_PARCEL_ARCGIS_URL: undefined });
});

// 9. Missing parcel match → unmatched, no fabricated coordinates.
test("PB: no parcel match → enrichment.matched false", async () => {
  clearHttpCache();
  setEnv({ PBC_PARCEL_ARCGIS_URL: "https://gis.example.gov/FeatureServer/0" });
  const e = provider.normalizeEvent(pbRecord({ PCN: "99-99-99-99" }))!;
  const enriched = await provider.enrichProperty(e, stub(() => resp("", 200, { features: [] })));
  assert.equal(enriched.enrichment?.matched, false);
  assert.equal(enriched.property.latitude, null);
  setEnv({ PBC_PARCEL_ARCGIS_URL: undefined });
});

// 10. Completed sale → sold lifecycle, archived.
test("PB: sold to third party → archived", () => {
  const e = provider.normalizeEvent(pbRecord({ SaleStatus: "Sold to 3rd Party" }))!;
  assert.equal(e.lifecycle, "sold");
  assert.equal(e.property.record_status, "archived");
});

// 11. Repeated daily sync is idempotent (same identity + status).
test("PB: repeated sync is idempotent", () => {
  const a = provider.normalizeEvent(pbRecord())!;
  const b = provider.normalizeEvent(pbRecord())!;
  assert.equal(a.property.external_id, b.property.external_id);
  assert.equal(a.property.record_status, b.property.record_status);
  assert.equal(a.eventKey, b.eventKey);
});

// 12. discoverEvents pulls from the authorized report (JSON), bounded.
test("PB: discoverEvents parses the authorized JSON report", async () => {
  setEnv({ PBC_AUCTION_REPORT_URL: "https://clerk.example.gov/report.json", PBC_AUCTION_SOURCE_TYPE: "json" });
  const body = JSON.stringify([pbRecord(), pbRecord({ CaseNumber: "50-2026-CA-000999", PCN: "11-22-33" })]);
  const d = await provider.discoverEvents({ limit: 25 }, stub(() => resp(body)));
  assert.equal(d.configured, true);
  assert.equal(d.records.length, 2);
  setEnv({ PBC_AUCTION_REPORT_URL: undefined, PBC_AUCTION_SOURCE_TYPE: undefined });
});

// 13. Event sync disabled until an authorized source is configured (no fabrication).
test("PB: no event source → discover reports the exact owner action", async () => {
  setEnv({ PBC_AUCTION_REPORT_URL: undefined });
  assert.equal(provider.isEventSyncEnabled(), false);
  const d = await provider.discoverEvents();
  assert.equal(d.configured, false);
  assert.equal(d.records.length, 0);
  assert.match(String(d.blocker), /AUTHORIZED Palm Beach/i);
});
