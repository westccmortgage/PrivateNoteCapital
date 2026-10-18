import { test } from "node:test";
import assert from "node:assert/strict";
import { ADAPTERS, getAdapter } from "@/lib/adapters";

test("getAdapter resolves by id", () => {
  assert.equal(getAdapter("broward_clerk")?.state, "FL");
  assert.equal(getAdapter("nope"), undefined);
});

test("FL adapters exist for the three supported counties", () => {
  for (const id of ["palm_beach_clerk", "broward_clerk", "miami_dade_clerk"]) {
    const a = getAdapter(id);
    assert.ok(a, `${id} adapter present`);
    assert.equal(a?.state, "FL");
  }
});

test("restricted PropertyRadar source is NOT public-display allowed", () => {
  const pr = getAdapter("propertyradar");
  assert.ok(pr);
  assert.equal(pr?.publicDisplayAllowed, false); // imports as draft, never auto-published
});

test("every adapter defines external_id and source_url mappings", () => {
  for (const a of ADAPTERS) {
    assert.ok(a.defaultColumnMap.external_id, `${a.id} maps external_id`);
    assert.ok(a.defaultColumnMap.source_url, `${a.id} maps source_url`);
  }
});

test("unverified CSV and county feeds do not automatically publish", () => {
  for (const id of ["manual_csv", "california_foreclosure", "propertyradar", "palm_beach_clerk", "broward_clerk", "miami_dade_clerk"]) {
    const adapter = getAdapter(id);
    assert.ok(adapter, `${id}: source exists`);
    assert.equal(adapter.publicDisplayAllowed, false, `${id} requires verified distribution rights`);
  }
});

test("tax assessment never silently populates estimated market value in Florida source maps", () => {
  for (const id of ["palm_beach_clerk", "broward_clerk", "miami_dade_clerk"]) {
    assert.notEqual(getAdapter(id)?.defaultColumnMap.estimated_value, "AssessedValue");
  }
});
