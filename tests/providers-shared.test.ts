import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { publicDisplayAllowed, permissionFor } from "@/lib/providers/permission";
import { buildProperty, stageAndLifecycle } from "@/lib/providers/event";
import { buildGrcrmPayload, buildMessage, type CrmLead } from "@/lib/crm";
import type { SourceMeta } from "@/lib/providers/types";

function meta(over: Partial<SourceMeta> = {}): SourceMeta {
  return {
    authority: "Test Authority",
    sourceType: "test",
    accessMethod: "https_csv",
    url: "https://example.gov/record",
    collectedAt: "2026-07-31T00:00:00.000Z",
    sourceUpdatedAt: "2026-07-30T00:00:00.000Z",
    permission: "public_official",
    ...over,
  };
}

// 1. Only official/authorized permissions may auto-publish.
test("permission gate: only public_official + contract_authorized publish", () => {
  assert.equal(publicDisplayAllowed("public_official"), true);
  assert.equal(publicDisplayAllowed("contract_authorized"), true);
  assert.equal(publicDisplayAllowed("review_required"), false);
  assert.equal(publicDisplayAllowed("restricted"), false);
  assert.equal(publicDisplayAllowed("unknown"), false);
});

// 2. permissionFor mapping.
test("permissionFor derives the right state", () => {
  assert.equal(permissionFor({ official: true }), "public_official");
  assert.equal(permissionFor({ official: false, licensed: true }), "contract_authorized");
  assert.equal(permissionFor({ official: true, reviewRequired: true }), "review_required");
  assert.equal(permissionFor({ official: true, restricted: true }), "restricted");
  assert.equal(permissionFor({ official: false }), "unknown");
});

// 3. Active eligible official data → published.
test("active eligible official event → published", () => {
  const p = buildProperty({
    sourceName: "palm_beach_county", state: "FL", county: "Palm Beach",
    address: "123 Ocean Ave", apn: "00-43-44-12-05-000-0010",
    foreclosureStage: "auction", lifecycle: "active", permission: "public_official",
    saleDate: "2026-09-01", source: meta(),
  });
  assert.ok(p);
  assert.equal(p!.record_status, "published");
});

// 4. review_required / restricted data → draft (never public).
test("review_required + restricted events stay draft (not public)", () => {
  const base = {
    sourceName: "la_county_recorder", state: "CA" as const, county: "Los Angeles",
    address: "1 Main St", apn: "1234-005-010", foreclosureStage: "notice_of_sale",
    lifecycle: "active" as const, saleDate: "2026-09-01", source: meta(),
  };
  assert.equal(buildProperty({ ...base, permission: "review_required" })!.record_status, "draft");
  assert.equal(buildProperty({ ...base, permission: "restricted" })!.record_status, "draft");
  assert.equal(buildProperty({ ...base, permission: "unknown" })!.record_status, "draft");
});

// 5. Cancelled / sold events → archived (hidden from public search).
test("cancelled + sold lifecycles → archived", () => {
  const base = {
    sourceName: "palm_beach_county", state: "FL" as const, county: "Palm Beach",
    address: "9 Palm Ave", apn: "00-11-22-33", permission: "public_official" as const, source: meta(),
  };
  assert.equal(buildProperty({ ...base, foreclosureStage: "cancelled", lifecycle: "cancelled" })!.record_status, "archived");
  assert.equal(buildProperty({ ...base, foreclosureStage: "sold_third_party", lifecycle: "sold" })!.record_status, "archived");
});

// 6. Parcel-stable identity: changed auction date keeps ONE property (no dup card).
test("changed sale date keeps one parcel identity (saved links survive)", () => {
  const a = buildProperty({ sourceName: "palm_beach_county", state: "FL", county: "Palm Beach", apn: "00-43-44-12", foreclosureStage: "auction", lifecycle: "active", permission: "public_official", saleDate: "2026-09-01", source: meta() });
  const b = buildProperty({ sourceName: "palm_beach_county", state: "FL", county: "Palm Beach", apn: "0043 4412", foreclosureStage: "postponed", lifecycle: "postponed", permission: "public_official", saleDate: "2026-10-15", source: meta() });
  assert.equal(a!.external_id, b!.external_id); // same normalized parcel → same upsert target
  assert.notEqual(a!.current_auction_date, b!.current_auction_date);
});

// 7. NOD and NOS on the same parcel share one property identity.
test("NOD then NOS on the same parcel → one property", () => {
  const nod = buildProperty({ sourceName: "la_county_recorder", state: "CA", county: "Los Angeles", apn: "1234-005-010", foreclosureStage: "notice_of_default", lifecycle: "active", permission: "contract_authorized", source: meta() });
  const nos = buildProperty({ sourceName: "la_county_recorder", state: "CA", county: "Los Angeles", apn: "1234005010", foreclosureStage: "notice_of_sale", lifecycle: "active", permission: "contract_authorized", source: meta() });
  assert.equal(nod!.external_id, nos!.external_id);
});

// 8. No usable identity → no property (never fabricate a card).
test("event with no parcel or address → null (no fabrication)", () => {
  const p = buildProperty({ sourceName: "palm_beach_county", state: "FL", county: "Palm Beach", foreclosureStage: "auction", lifecycle: "active", permission: "public_official", source: meta() });
  assert.equal(p, null);
});

// 9. No personal party data lands on the published property row.
test("no borrower/plaintiff PII on the property row", () => {
  const p = buildProperty({ sourceName: "la_county_recorder", state: "CA", county: "Los Angeles", apn: "1234-005-010", foreclosureStage: "notice_of_sale", lifecycle: "active", permission: "contract_authorized", source: meta() });
  const keys = Object.keys(p!).join(" ").toLowerCase();
  assert.ok(!/borrower|plaintiff|trustor|owner_name|defendant/.test(keys));
});

// 10. Inquiry retains the county source references (Section 17).
test("property inquiry retains source references", () => {
  const lead: CrmLead = {
    actionType: "financing_request", email: "j@example.com",
    propertyId: "abc", propertyAddress: "123 Ocean Ave", state: "FL", county: "Palm Beach",
    sourceName: "palm_beach_county", apn: "00-43-44-12", caseNumber: "50-2026-CA-001",
    documentNumber: "20260099", foreclosureStage: "auction",
  };
  const p = buildGrcrmPayload(lead) as Record<string, unknown>;
  const pi = p.propertyInterest as Record<string, unknown>;
  assert.equal(pi.caseNumber, "50-2026-CA-001");
  assert.equal(pi.documentNumber, "20260099");
  assert.equal(pi.apn, "00-43-44-12");
  assert.equal(pi.sourceName, "palm_beach_county");
  const msg = buildMessage(lead);
  assert.match(msg, /Case number: 50-2026-CA-001/);
  assert.match(msg, /Recorder document #: 20260099/);
});

// 11. Stage/lifecycle mapping recognizes FL + CA vocabularies.
test("stage + lifecycle mapping", () => {
  assert.deepEqual(stageAndLifecycle("Cancelled"), { stage: "cancelled", lifecycle: "cancelled" });
  assert.deepEqual(stageAndLifecycle("Postponed"), { stage: "postponed", lifecycle: "postponed" });
  assert.deepEqual(stageAndLifecycle(null, "Notice of Default"), { stage: "notice_of_default", lifecycle: "active" });
  assert.deepEqual(stageAndLifecycle(null, "Notice of Trustee's Sale"), { stage: "notice_of_sale", lifecycle: "active" });
  assert.deepEqual(stageAndLifecycle(null, "Notice of Rescission"), { stage: "cancelled", lifecycle: "cancelled" });
  assert.deepEqual(stageAndLifecycle(null, "Trustee's Deed Upon Sale"), { stage: "sold_third_party", lifecycle: "sold" });
});

// 12. The cron endpoint is protected (no public execution) + no hardcoded secrets.
test("cron sync endpoint requires the shared secret", () => {
  const src = readFileSync("app/api/cron/data-sync/route.ts", "utf8");
  assert.match(src, /dataSyncCronSecret/);
  assert.match(src, /status: 401/);
  assert.match(src, /if \(!secret\) return false/); // unset secret → never public
});

// 13. Provider source files carry no hardcoded credentials/tokens.
test("no hardcoded tokens in provider sources", () => {
  for (const f of ["lib/providers/palm-beach.ts", "lib/providers/los-angeles.ts"]) {
    const src = readFileSync(f, "utf8");
    // credentials only ever come from serverEnv; no inline bearer/api keys.
    assert.ok(!/(api[_-]?key|secret|password)\s*[:=]\s*["'][A-Za-z0-9]{8,}["']/i.test(src), `${f} has no inline secret`);
  }
});
