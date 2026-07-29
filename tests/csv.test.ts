import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCsv,
  parseCsvRecords,
  coerceNumber,
  coerceDate,
  normalizeStage,
  normalizePropertyType,
  validateImport,
} from "@/lib/csv";

test("parseCsv: quoted fields with commas and newlines", () => {
  const text = 'a,b,c\n1,"hello, world","line1\nline2"\n2,x,y';
  const rows = parseCsv(text);
  assert.deepEqual(rows[0], ["a", "b", "c"]);
  assert.deepEqual(rows[1], ["1", "hello, world", "line1\nline2"]);
  assert.deepEqual(rows[2], ["2", "x", "y"]);
});

test("parseCsv: doubled quotes escape", () => {
  const rows = parseCsv('h\n"she said ""hi"""');
  assert.equal(rows[1][0], 'she said "hi"');
});

test("parseCsvRecords: skips blank lines, trims headers", () => {
  const { headers, records } = parseCsvRecords("external_id,state\n\nA1,CA\n\n");
  assert.deepEqual(headers, ["external_id", "state"]);
  assert.equal(records.length, 1);
  assert.equal(records[0].external_id, "A1");
});

test("coerceNumber: strips $ and commas", () => {
  assert.equal(coerceNumber("$1,250,000"), 1250000);
  assert.equal(coerceNumber(""), null);
  assert.equal(coerceNumber("n/a"), null);
});

test("coerceDate: ISO and US formats", () => {
  assert.equal(coerceDate("2026-03-15"), "2026-03-15");
  assert.equal(coerceDate("3/15/2026"), "2026-03-15");
  assert.equal(coerceDate("03/05/26"), "2026-03-05");
  assert.equal(coerceDate("garbage"), null);
});

test("normalizeStage / normalizePropertyType synonyms", () => {
  assert.equal(normalizeStage("Notice of Sale"), "notice_of_sale");
  assert.equal(normalizeStage("REO"), "reo_bank_owned");
  assert.equal(normalizePropertyType("SFR"), "single_family");
  assert.equal(normalizePropertyType("weird"), "other");
});

const MAP = {
  external_id: "id",
  state: "st",
  address: "addr",
  county: "cty",
  current_auction_date: "auction",
  opening_bid: "bid",
  estimated_value: "val",
  estimated_debt: "debt",
  source_url: "url",
} as const;

test("validateImport: rejects missing external_id and bad state", () => {
  const records = [
    { id: "", st: "CA", addr: "1 A St", cty: "", auction: "", bid: "", val: "", debt: "", url: "" },
    { id: "X1", st: "TX", addr: "2 B St", cty: "", auction: "", bid: "", val: "", debt: "", url: "" },
  ];
  const { valid, rejected } = validateImport(records, MAP, "manual_csv");
  assert.equal(valid.length, 0);
  assert.equal(rejected.length, 2);
  assert.ok(rejected[0].reasons.some((r) => r.includes("external_id")));
  assert.ok(rejected[1].reasons.some((r) => r.includes("CA or FL")));
});

test("validateImport: requires address or county", () => {
  const records = [{ id: "X1", st: "CA", addr: "", cty: "", auction: "", bid: "", val: "", debt: "", url: "" }];
  const { rejected } = validateImport(records, MAP, "manual_csv");
  assert.equal(rejected.length, 1);
  assert.ok(rejected[0].reasons.some((r) => r.includes("address or county")));
});

test("validateImport: derives equity when value and debt present", () => {
  const records = [{ id: "X1", st: "CA", addr: "1 A St", cty: "LA", auction: "3/1/2026", bid: "$100,000", val: "500000", debt: "300000", url: "http://x" }];
  const { valid } = validateImport(records, MAP, "manual_csv");
  assert.equal(valid.length, 1);
  assert.equal(valid[0].estimated_equity, 200000);
  assert.equal(valid[0].current_auction_date, "2026-03-01");
  assert.equal(valid[0].opening_bid, 100000);
  assert.equal(valid[0].source_url, "http://x"); // source URL preserved
});

test("validateImport: dedupes by (source, external_id), latest wins", () => {
  const records = [
    { id: "DUP", st: "CA", addr: "old", cty: "LA", auction: "", bid: "100", val: "", debt: "", url: "" },
    { id: "DUP", st: "CA", addr: "new", cty: "LA", auction: "", bid: "200", val: "", debt: "", url: "" },
    { id: "OTHER", st: "FL", addr: "z", cty: "Broward", auction: "", bid: "", val: "", debt: "", url: "" },
  ];
  const { valid, duplicateKeysInFile } = validateImport(records, MAP, "manual_csv");
  assert.equal(valid.length, 2);
  assert.ok(duplicateKeysInFile.includes("manual_csv|DUP"));
  const dup = valid.find((r) => r.external_id === "DUP");
  assert.equal(dup?.address, "new"); // latest wins
  assert.equal(dup?.opening_bid, 200);
});
