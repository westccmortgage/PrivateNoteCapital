import { test } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import { LAEventFeedProvider, LAAssessorEnrichmentProvider, FEED_REQUIREMENT } from "@/lib/providers/los-angeles";
import { clearHttpCache } from "@/lib/providers/http";
import { parseFeed } from "@/lib/providers/feed";
import type { FetchLike, FetchLikeResponse } from "@/lib/providers/types";

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
function respBuf(buf: Buffer, status = 200): FetchLikeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => buf.toString("utf8"),
    json: async () => JSON.parse(buf.toString("utf8")),
    arrayBuffer: async () => {
      const ab = new ArrayBuffer(buf.byteLength);
      new Uint8Array(ab).set(buf);
      return ab;
    },
  };
}
function stub(handler: (url: string, init?: { headers?: Record<string, string> }) => FetchLikeResponse): FetchLike {
  return async (url, init) => handler(url, init as { headers?: Record<string, string> });
}
function setEnv(over: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

// Minimal single-entry ZIP (deflate) so unzipEntries → inflateRawSync is exercised.
function makeZip(name: string, content: string): Buffer {
  const data = zlib.deflateRawSync(Buffer.from(content, "utf8"));
  const nameBuf = Buffer.from(name, "utf8");
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt32LE(0, 14); // crc (unchecked by reader)
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(content.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  const localBlock = Buffer.concat([local, nameBuf, data]);

  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0);
  cen.writeUInt16LE(20, 4);
  cen.writeUInt16LE(20, 6);
  cen.writeUInt16LE(0, 8);
  cen.writeUInt16LE(8, 10);
  cen.writeUInt32LE(0, 16);
  cen.writeUInt32LE(data.length, 20);
  cen.writeUInt32LE(content.length, 24);
  cen.writeUInt16LE(nameBuf.length, 28);
  cen.writeUInt32LE(0, 42); // local header offset
  const cenBlock = Buffer.concat([cen, nameBuf]);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cenBlock.length, 12);
  eocd.writeUInt32LE(localBlock.length, 16);
  return Buffer.concat([localBlock, cenBlock, eocd]);
}

function laRecord(over: Record<string, string> = {}): Record<string, string> {
  return {
    DocumentNumber: "20260099001",
    RecordingDate: "2026-07-15",
    DocumentType: "Notice of Trustee's Sale",
    AIN: "1234-005-010",
    PropertyAddress: "500 S Main St",
    City: "Los Angeles",
    Zip: "90013",
    SaleDate: "2026-09-10",
    Trustee: "First Trustee Co",
    Beneficiary: "Big Bank",
    Trustor: "Jane Homeowner",
    AmountInDefault: "42000",
    ...over,
  };
}

const provider = new LAEventFeedProvider();
const LA_CSV_HEADER = "DocumentNumber,RecordingDate,DocumentType,AIN,PropertyAddress,City,Zip,SaleDate";

// 1. No feed configured → disabled + the exact required message.
test("LA: no feed configured → disabled with precise requirement", async () => {
  setEnv({ LA_FORECLOSURE_FEED_TYPE: undefined, LA_FORECLOSURE_FEED_URL: undefined });
  assert.equal(provider.isEventSyncEnabled(), false);
  const d = await provider.discoverEvents();
  assert.equal(d.configured, false);
  assert.equal(d.blocker, FEED_REQUIREMENT);
});

// 2. HTTPS CSV feed.
test("LA: HTTPS CSV feed parses", async () => {
  setEnv({ LA_FORECLOSURE_FEED_TYPE: "csv", LA_FORECLOSURE_FEED_URL: "https://feed.example.gov/daily.csv" });
  const csv = `${LA_CSV_HEADER}\n20260099001,2026-07-15,Notice of Trustee's Sale,1234-005-010,500 S Main St,Los Angeles,90013,2026-09-10`;
  const d = await provider.discoverEvents({ limit: 50 }, stub(() => resp(csv)));
  assert.equal(d.records.length, 1);
  setEnv({ LA_FORECLOSURE_FEED_TYPE: undefined, LA_FORECLOSURE_FEED_URL: undefined });
});

// 3. JSON feed.
test("LA: JSON feed parses", async () => {
  setEnv({ LA_FORECLOSURE_FEED_TYPE: "json", LA_FORECLOSURE_FEED_URL: "https://feed.example.gov/daily.json" });
  const d = await provider.discoverEvents({}, stub(() => resp(JSON.stringify({ records: [laRecord()] }))));
  assert.equal(d.records.length, 1);
  setEnv({ LA_FORECLOSURE_FEED_TYPE: undefined, LA_FORECLOSURE_FEED_URL: undefined });
});

// 4. ZIP feed (deflate) containing a CSV.
test("LA: ZIP feed parses", async () => {
  setEnv({ LA_FORECLOSURE_FEED_TYPE: "zip", LA_FORECLOSURE_FEED_URL: "https://feed.example.gov/daily.zip" });
  const csv = `${LA_CSV_HEADER}\n20260099001,2026-07-15,Notice of Default,1234-005-010,500 S Main St,Los Angeles,90013,`;
  const zip = makeZip("daily.csv", csv);
  const d = await provider.discoverEvents({}, stub(() => respBuf(zip)));
  assert.equal(d.records.length, 1);
  assert.equal(d.records[0].DocumentType, "Notice of Default");
  setEnv({ LA_FORECLOSURE_FEED_TYPE: undefined, LA_FORECLOSURE_FEED_URL: undefined });
});

// 5. Malformed feed → no records (never throws, never fabricates).
test("LA: malformed JSON feed → 0 records", async () => {
  setEnv({ LA_FORECLOSURE_FEED_TYPE: "json", LA_FORECLOSURE_FEED_URL: "https://feed.example.gov/daily.json" });
  const d = await provider.discoverEvents({}, stub(() => resp("{ not json")));
  assert.equal(d.records.length, 0);
  setEnv({ LA_FORECLOSURE_FEED_TYPE: undefined, LA_FORECLOSURE_FEED_URL: undefined });
});

// 6. XML feed parses records.
test("LA: XML feed parses", () => {
  const xml = `<feed><record><DocumentNumber>1</DocumentNumber><DocumentType>Notice of Default</DocumentType><AIN>1234-005-010</AIN></record></feed>`;
  const { records } = parseFeed("xml", xml);
  assert.equal(records.length, 1);
  assert.equal(records[0].DocumentType, "Notice of Default");
});

// 7. NOD normalization.
test("LA: NOD → notice_of_default", () => {
  setEnv({ LA_FORECLOSURE_FEED_PUBLICATION_ALLOWED: "true" });
  const e = provider.normalizeEvent(laRecord({ DocumentType: "Notice of Default" }))!;
  assert.equal(e.property.foreclosure_stage, "notice_of_default");
  assert.equal(e.property.record_status, "published"); // contract_authorized + active
  setEnv({ LA_FORECLOSURE_FEED_PUBLICATION_ALLOWED: undefined });
});

// 8. NOS normalization.
test("LA: NOS → notice_of_sale", () => {
  const e = provider.normalizeEvent(laRecord({ DocumentType: "Notice of Trustee's Sale" }))!;
  assert.equal(e.property.foreclosure_stage, "notice_of_sale");
});

// 9. Rescission deactivates (archived).
test("LA: rescission → cancelled/archived", () => {
  setEnv({ LA_FORECLOSURE_FEED_PUBLICATION_ALLOWED: "true" });
  const e = provider.normalizeEvent(laRecord({ DocumentType: "Notice of Rescission" }))!;
  assert.equal(e.lifecycle, "cancelled");
  assert.equal(e.property.record_status, "archived");
  setEnv({ LA_FORECLOSURE_FEED_PUBLICATION_ALLOWED: undefined });
});

// 10. Trustee's deed → sold outcome.
test("LA: trustee's deed → sold", () => {
  const e = provider.normalizeEvent(laRecord({ DocumentType: "Trustee's Deed Upon Sale" }))!;
  assert.equal(e.lifecycle, "sold");
  assert.equal(e.property.foreclosure_stage, "sold_third_party");
});

// 11. Borrower/trustor kept internal, never on the property row.
test("LA: trustor/borrower kept internal only", () => {
  const e = provider.normalizeEvent(laRecord())!;
  assert.equal(e.internal?.borrowerName, "Jane Homeowner");
  assert.ok(!JSON.stringify(e.property).includes("Jane Homeowner"));
});

// 12. Document-number + recording-date dedup identity is stable.
test("LA: event key uses document number + recording date", () => {
  const a = provider.normalizeEvent(laRecord())!;
  const b = provider.normalizeEvent(laRecord({ SaleDate: "2026-10-10" }))!;
  assert.equal(a.eventKey, b.eventKey); // same doc# + recording date
  assert.match(a.eventKey, /20260099001/);
});

// 13. Publication held as draft when the license does not allow public display.
test("LA: review_required license → draft (not public)", () => {
  setEnv({ LA_FORECLOSURE_FEED_PUBLICATION_ALLOWED: "false" });
  const e = provider.normalizeEvent(laRecord())!;
  assert.equal(e.permission, "review_required");
  assert.equal(e.property.record_status, "draft");
  setEnv({ LA_FORECLOSURE_FEED_PUBLICATION_ALLOWED: undefined });
});

// 14. Assessor APN enrichment merges official parcel fields.
test("LA: assessor enrichment by AIN", async () => {
  clearHttpCache();
  setEnv({ LA_ASSESSOR_ARCGIS_URL: "https://assessor.example.gov/FeatureServer/0" });
  const e = provider.normalizeEvent(laRecord())!;
  const enriched = await provider.enrichProperty(
    e,
    stub((url) => {
      assert.match(url, /\/query\?/);
      return resp("", 200, { features: [{ attributes: { TotalValue: 500000, YearBuilt: 1965 }, geometry: { x: -118.25, y: 34.05 } }] });
    }),
  );
  assert.equal(enriched.enrichment?.matched, true);
  assert.equal(enriched.property.latitude, 34.05);
  assert.equal(enriched.property.assessed_value, 500000);
  setEnv({ LA_ASSESSOR_ARCGIS_URL: undefined });
});

// 15. Unmatched APN → no fabricated parcel data.
test("LA: unmatched AIN → enrichment.matched false", async () => {
  clearHttpCache();
  setEnv({ LA_ASSESSOR_ARCGIS_URL: "https://assessor.example.gov/FeatureServer/0" });
  const e = provider.normalizeEvent(laRecord({ AIN: "9999-999-999" }))!;
  const enriched = await provider.enrichProperty(e, stub(() => resp("", 200, { features: [] })));
  assert.equal(enriched.enrichment?.matched, false);
  assert.equal(enriched.property.latitude, null);
  setEnv({ LA_ASSESSOR_ARCGIS_URL: undefined });
});

// 16. Feed credentials are sent as a server-side Basic header, never in the URL.
test("LA: feed credentials stay server-side (Basic auth header)", async () => {
  setEnv({
    LA_FORECLOSURE_FEED_TYPE: "csv",
    LA_FORECLOSURE_FEED_URL: "https://feed.example.gov/daily.csv",
    LA_FORECLOSURE_FEED_USERNAME: "svc",
    LA_FORECLOSURE_FEED_PASSWORD: "secretpw",
  });
  let sawAuth = "";
  let sawUrl = "";
  await provider.discoverEvents(
    {},
    stub((url, init) => {
      sawUrl = url;
      sawAuth = init?.headers?.Authorization ?? "";
      return resp(LA_CSV_HEADER);
    }),
  );
  assert.match(sawAuth, /^Basic /);
  assert.ok(!sawUrl.includes("secretpw"));
  setEnv({ LA_FORECLOSURE_FEED_TYPE: undefined, LA_FORECLOSURE_FEED_URL: undefined, LA_FORECLOSURE_FEED_USERNAME: undefined, LA_FORECLOSURE_FEED_PASSWORD: undefined });
});

// 17. SFTP feed is not silently treated as HTTPS — reports the ingestion path.
test("LA: sftp feed → clear ingestion-path blocker (not fabricated)", async () => {
  setEnv({ LA_FORECLOSURE_FEED_TYPE: "sftp", LA_FORECLOSURE_FEED_SFTP_HOST: "sftp.example.gov" });
  assert.equal(provider.isEventSyncEnabled(), false);
  const d = await provider.discoverEvents();
  assert.match(String(d.blocker), /SFTP/i);
  setEnv({ LA_FORECLOSURE_FEED_TYPE: undefined, LA_FORECLOSURE_FEED_SFTP_HOST: undefined });
});

// 18. Assessor provider is independent + configurable.
test("LA: assessor enrichment provider is independent", async () => {
  const assessor = new LAAssessorEnrichmentProvider();
  setEnv({ LA_ASSESSOR_ARCGIS_URL: undefined });
  assert.equal(assessor.isConfigured(), false);
  const conn = await assessor.testConnection();
  assert.equal(conn.configured, false);
  assert.match(conn.detail, /not configured/i);
});
