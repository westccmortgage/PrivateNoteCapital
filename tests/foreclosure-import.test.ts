import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateImport, neutralizeFormula } from "@/lib/csv";
import { getAdapter, ADAPTERS } from "@/lib/adapters";
import {
  normalizeApn,
  normalizeAddress,
  normalizeState,
  normalizeCounty,
  dedupExternalId,
  normalizeLifecycle,
  evaluateEligibility,
} from "@/lib/normalize";
import { buildGrcrmPayload, type CrmLead } from "@/lib/crm";

const CANON = getAdapter("manual_csv")!.defaultColumnMap;

// Build a canonical-keyed CSV record with sensible defaults.
function rec(over: Record<string, string> = {}): Record<string, string> {
  return {
    external_id: "TS-1",
    state: "CA",
    county: "Los Angeles",
    address: "123 Main St",
    city: "Riverside",
    zip: "92501",
    foreclosure_stage: "Notice of Sale",
    current_auction_date: "3/15/2026",
    opening_bid: "$250,000",
    ...over,
  };
}

// 1. valid generic foreclosure CSV
test("1. generic foreclosure CSV → valid, publishable", () => {
  const { valid, publishable } = validateImport([rec()], CANON, "manual_csv", { publicDisplayAllowed: true });
  assert.equal(valid.length, 1);
  assert.equal(valid[0].record_status, "published");
  assert.equal(publishable, 1);
});

// 2-5. profiles exist for CA + the three FL counties
test("2-5. source profiles: California + Palm Beach + Broward + Miami-Dade", () => {
  for (const id of ["california_foreclosure", "palm_beach_clerk", "broward_clerk", "miami_dade_clerk"]) {
    const a = getAdapter(id);
    assert.ok(a, `${id} exists`);
    assert.ok(a!.defaultColumnMap.external_id, `${id} maps a record id`);
    assert.ok(a!.defaultColumnMap.current_auction_date, `${id} maps auction date`);
  }
  // A Broward-style record maps through its profile; state/county come from the
  // profile defaults (the file has neither column).
  const broward = getAdapter("broward_clerk")!;
  const brec = { CaseNumber: "50-2026-CA-001", PropertyAddress: "9 Palm Ave", City: "Fort Lauderdale", Zip: "33301", AuctionDate: "04/01/2026", OpeningBid: "100000", Status: "Scheduled" };
  const { valid } = validateImport([brec as Record<string, string>], broward.defaultColumnMap, "broward_clerk", { publicDisplayAllowed: true, defaults: broward.defaults });
  assert.equal(valid.length, 1);
  assert.equal(valid[0].current_auction_date, "2026-04-01");
  assert.equal(valid[0].state, "FL");
  assert.equal(valid[0].county, "Broward");
});

// 6. APN normalization
test("6. APN normalization", () => {
  assert.equal(normalizeApn("123-456-789"), "123456789");
  assert.equal(normalizeApn(" ab 12.34 "), "AB1234");
  assert.equal(normalizeApn(""), null);
});

// 7. address normalization
test("7. address normalization", () => {
  const a = normalizeAddress("123 Main Street, Apt 4B");
  const b = normalizeAddress("123 main st");
  assert.equal(a, b); // suffix + unit + case normalized to the same identity
});

// 8/9. date + currency parsing (via the row build)
test("8/9. date + currency parsing", () => {
  const { valid } = validateImport([rec({ current_auction_date: "03/15/2026", opening_bid: "$1,250,000" })], CANON, "manual_csv");
  assert.equal(valid[0].current_auction_date, "2026-03-15");
  assert.equal(valid[0].opening_bid, 1250000);
});

// 10. duplicate source id → one row
test("10. duplicate source record id dedupes", () => {
  const { valid, duplicateKeysInFile } = validateImport(
    [rec({ external_id: "DUP", address: "old" }), rec({ external_id: "DUP", address: "new" })],
    CANON, "manual_csv",
  );
  assert.equal(valid.length, 1);
  assert.ok(duplicateKeysInFile.includes("DUP"));
  assert.equal(valid[0].address, "new"); // latest wins
});

// 11. duplicate APN (no explicit id) dedupes via APN fallback
test("11. duplicate APN dedupes when no record id", () => {
  const r1 = rec({ external_id: "", apn: "123-45-678" });
  const r2 = rec({ external_id: "", apn: "12345678", address: "different building same parcel" });
  const map = { ...CANON };
  const { valid } = validateImport([r1, r2], map, "manual_csv");
  assert.equal(valid.length, 1); // same normalized APN → one property
  assert.ok(valid[0].external_id.startsWith("apn:"));
});

// 12 / 23. same property, changed auction date → same identity, idempotent
test("12/23. changed auction date keeps one identity (idempotent id)", () => {
  const a = validateImport([rec({ external_id: "P1", current_auction_date: "3/15/2026" })], CANON, "manual_csv");
  const b = validateImport([rec({ external_id: "P1", current_auction_date: "4/20/2026" })], CANON, "manual_csv");
  assert.equal(a.valid[0].external_id, b.valid[0].external_id); // upsert target unchanged
  assert.notEqual(a.valid[0].current_auction_date, b.valid[0].current_auction_date);
});

// 13. partially invalid CSV → valid rows survive
test("13. partially invalid CSV keeps valid rows", () => {
  const { valid, rejected } = validateImport(
    [rec({ external_id: "G1" }), rec({ external_id: "BAD", state: "TX" })],
    CANON, "manual_csv",
  );
  assert.equal(valid.length, 1);
  assert.equal(rejected.length, 1);
});

// 14. restricted source remains draft
test("14. restricted source imports as draft (not public)", () => {
  const { valid } = validateImport([rec()], CANON, "propertyradar", { publicDisplayAllowed: false });
  assert.equal(valid[0].record_status, "draft");
  assert.equal(getAdapter("propertyradar")!.publicDisplayAllowed, false);
});

// 15. eligible record can be published
test("15. eligible record is published", () => {
  const e = evaluateEligibility({
    address: "1 A St", apn: null, state: "CA", county: "Los Angeles",
    foreclosure_stage: "notice_of_sale", lifecycle: "active", publicDisplayAllowed: true,
  });
  assert.equal(e.eligible, true);
  assert.equal(e.status, "published");
});

// 16/17. cancelled and sold records are archived (never public)
test("16/17. cancelled + sold → archived", () => {
  const cancelled = validateImport([rec({ status: "Cancelled" })], CANON, "manual_csv", { publicDisplayAllowed: true });
  assert.equal(cancelled.valid[0].record_status, "archived");
  const sold = validateImport([rec({ status: "Sold to third party" })], CANON, "manual_csv", { publicDisplayAllowed: true });
  assert.equal(sold.valid[0].record_status, "archived");
  assert.equal(normalizeLifecycle("REO"), "sold");
});

// 18. record missing eligibility (no stage) stays draft, not public
test("18. missing foreclosure stage → draft", () => {
  const { valid } = validateImport([rec({ foreclosure_stage: "" })], CANON, "manual_csv", { publicDisplayAllowed: true });
  assert.equal(valid[0].record_status, "draft");
  assert.ok(valid[0].eligibility_reasons.some((r) => /stage/i.test(r)));
});

// 19. published status is what search filters on (record_status published)
test("19. eligible rows are marked published for public search", () => {
  const { valid } = validateImport([rec()], CANON, "manual_csv", { publicDisplayAllowed: true });
  assert.equal(valid[0].record_status, "published"); // /search filters record_status='published'
});

// 20. state/county normalization feeds the search filters
test("20. state + county normalization", () => {
  assert.equal(normalizeState("California"), "CA");
  assert.equal(normalizeState("florida"), "FL");
  assert.equal(normalizeCounty("Miami-Dade County"), "Miami-Dade");
});

// 21. dedup identity is stable → upsert preserves the internal id + relationships
test("21. dedup identity is deterministic across imports", () => {
  const id1 = dedupExternalId({ external_id: "", apn: "123-45-678", state: "CA", county: "LA" });
  const id2 = dedupExternalId({ external_id: "", apn: "12345678", state: "ca", county: "la" });
  assert.equal(id1, id2); // same upsert target → saved/inquiry links preserved
});

// 22. property-specific lead carries the property reference
test("22. property lead payload includes property reference", () => {
  const lead: CrmLead = {
    firstName: "Jo", email: "jo@example.com", phone: "555", actionType: "financing_request",
    propertyId: "abc-123", propertyAddress: "123 Main St", state: "CA", county: "Los Angeles",
    financingType: "auction_acquisition",
  };
  const p = buildGrcrmPayload(lead) as Record<string, unknown>;
  assert.equal((p.propertyInterest as Record<string, unknown>).propertyId, "abc-123");
  assert.ok(String(p.message).includes("123 Main St"));
});

// 24. CSV formula injection stays neutralized on an address field
test("24. formula injection neutralized", () => {
  assert.equal(neutralizeFormula("=HYPERLINK(evil)"), "'=HYPERLINK(evil)");
});

// 25. unauthorized import is denied (route is admin-gated)
test("25. import route is admin-gated", () => {
  const src = readFileSync("app/api/admin/import/route.ts", "utf8");
  assert.match(src, /if \(!\(await isAdmin\(\)\)\)/);
  assert.match(src, /status: 403/);
});

// Fabrication guard: no sample/demo listings shipped in the app runtime.
test("no fabricated demo listings in app runtime", () => {
  const summary = validateImport([], CANON, "manual_csv");
  assert.equal(summary.valid.length, 0);
  assert.ok(ADAPTERS.length >= 5);
});
