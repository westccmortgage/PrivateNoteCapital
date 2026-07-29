import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContact, validateFinancing, validateWatchlist } from "@/lib/validation";

test("validateContact: requires name and valid email", () => {
  assert.equal(validateContact({ firstName: "A", email: "a@b.com" }).ok, true);
  assert.equal(validateContact({ email: "a@b.com" }).ok, false);
  assert.equal(validateContact({ firstName: "A", email: "nope" }).ok, false);
});

test("validateFinancing: requires financing type and phone", () => {
  const bad = validateFinancing({ firstName: "A", email: "a@b.com", financingType: "bridge" });
  assert.equal(bad.ok, false); // missing phone
  const ok = validateFinancing({
    firstName: "A",
    email: "a@b.com",
    phone: "555",
    financingType: "bridge",
    requestedAmount: "$250,000",
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.requestedAmount, 250000);
});

test("validateFinancing: rejects unknown financing type", () => {
  const r = validateFinancing({ firstName: "A", email: "a@b.com", phone: "555", financingType: "banana" });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("financing type")));
});

test("validateWatchlist: consent is required (no consent = invalid)", () => {
  const noConsent = validateWatchlist({ firstName: "A", email: "a@b.com", consent: false });
  assert.equal(noConsent.ok, false);
  assert.ok(noConsent.errors.some((e) => e.toLowerCase().includes("consent")));

  const withConsent = validateWatchlist({
    firstName: "A",
    email: "a@b.com",
    consent: true,
    counties: ["Broward"],
    propertyTypes: ["single_family"],
  });
  assert.equal(withConsent.ok, true);
  assert.deepEqual(withConsent.value.counties, ["Broward"]);
});
