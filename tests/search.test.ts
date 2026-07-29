import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSearchParams, toQueryString, classesToTypes } from "@/lib/search";

test("parseSearchParams: defaults", () => {
  const f = parseSearchParams({});
  assert.equal(f.state, undefined);
  assert.equal(f.sort, "auction_date");
  assert.equal(f.page, 1);
  assert.deepEqual(f.propertyTypes, []);
});

test("parseSearchParams: normalizes state and rejects unsupported", () => {
  assert.equal(parseSearchParams({ state: "ca" }).state, "CA");
  assert.equal(parseSearchParams({ state: "fl" }).state, "FL");
  assert.equal(parseSearchParams({ state: "TX" }).state, undefined);
});

test("parseSearchParams: multi-value + numeric coercion", () => {
  const f = parseSearchParams({
    propertyType: "single_family,condo",
    stage: "auction",
    bidMin: "$100,000",
    valueMax: "750000",
    equityMin: "50000",
    page: "3",
  });
  assert.deepEqual(f.propertyTypes, ["single_family", "condo"]);
  assert.deepEqual(f.stages, ["auction"]);
  assert.equal(f.openingBidMin, 100000);
  assert.equal(f.valueMax, 750000);
  assert.equal(f.equityMin, 50000);
  assert.equal(f.page, 3);
});

test("toQueryString: round-trips through parseSearchParams", () => {
  const original = parseSearchParams({
    state: "FL",
    county: "Broward",
    propertyType: "single_family",
    stage: "auction,postponed",
    bidMin: "50000",
    sort: "estimated_equity",
    page: "2",
  });
  const qs = toQueryString(original);
  const params: Record<string, string> = {};
  new URLSearchParams(qs).forEach((v, k) => (params[k] = v));
  const reparsed = parseSearchParams(params);
  assert.deepEqual(reparsed, original);
});

test("toQueryString: omits defaults (sort=auction_date, page=1)", () => {
  const qs = toQueryString({ state: "CA", sort: "auction_date", page: 1 });
  assert.equal(qs, "state=CA");
});

test("classesToTypes: expands coarse buckets", () => {
  assert.deepEqual(classesToTypes(["residential"]).sort(), ["condo", "single_family", "townhouse"]);
  const both = classesToTypes(["residential", "commercial"]);
  assert.ok(both.includes("commercial"));
  assert.ok(both.includes("land"));
});

test("shareable URL example: state=FL&county=Broward parses", () => {
  const f = parseSearchParams({ state: "FL", county: "Broward", financing: "auction" });
  assert.equal(f.state, "FL");
  assert.equal(f.county, "Broward");
});
