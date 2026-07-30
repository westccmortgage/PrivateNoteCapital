import { test } from "node:test";
import assert from "node:assert/strict";
import { illustrateYield, ILLUSTRATOR_BOUNDS } from "@/lib/trust-deed";
import { validateInvestor, validateSimple } from "@/lib/validation";
import { buildGrcrmPayload, buildMessage, opportunityTitle, type CrmLead } from "@/lib/crm";

// --- Yield illustrator math (neutral arithmetic, clamped) ---
test("illustrateYield: interest-only arithmetic", () => {
  const y = illustrateYield(250_000, 9.6, 12);
  assert.equal(y.annualIncome, 24_000); // 250k * 9.6%
  assert.equal(y.monthlyIncome, 2_000);
  assert.equal(y.totalInterest, 24_000); // 12 months
});

test("illustrateYield: clamps out-of-range inputs (never absurd)", () => {
  const hi = illustrateYield(9_999_999_999, 999, 9999);
  assert.ok(hi.annualRatePct <= ILLUSTRATOR_BOUNDS.rate.max);
  assert.ok(hi.termMonths <= 120);
  const lo = illustrateYield(-5, -5, 0);
  assert.ok(lo.principal >= 0 && lo.annualRatePct >= 0 && lo.termMonths >= 1);
});

// --- Consent validation ---
test("validateInvestor: consent required", () => {
  const noConsent = validateInvestor({ firstName: "A", email: "a@b.com", consent: false });
  assert.equal(noConsent.ok, false);
  assert.ok(noConsent.errors.some((e) => e.toLowerCase().includes("agree")));
  const ok = validateInvestor({ firstName: "A", email: "a@b.com", consent: true, capitalRange: "$1M – $5M" });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.capitalRange, "$1M – $5M");
});

test("validateSimple: name + email required (book-review / contact)", () => {
  assert.equal(validateSimple({ firstName: "A", email: "a@b.com", message: "hi" }).ok, true);
  assert.equal(validateSimple({ email: "a@b.com" }).ok, false);
  assert.equal(validateSimple({ firstName: "A", email: "bad" }).ok, false);
});

// --- Investor CRM payload routes through the ONE integration ---
const investor: CrmLead = {
  firstName: "Dana", lastName: "Lee", email: "dana@example.com", phone: "555-0199",
  actionType: "investor_inquiry", capitalRange: "$1M – $5M", lienPreference: "1st position",
  timeline: "Ready now", sourceDetail: "private-debt investor intake",
  sourceUrl: "https://privatenotecapital.com/private-debt/investors", submittedAt: "2026-07-30T00:00:00Z",
};

test("investor payload: request_type + private-debt metadata in message", () => {
  const p = buildGrcrmPayload(investor) as Record<string, unknown>;
  assert.equal(p.request_type, "investor_inquiry");
  assert.equal(p.source, "Private Note Capital");
  assert.equal(p.submitted_at, "2026-07-30T00:00:00Z");
  assert.equal(p.source_url, "https://privatenotecapital.com/private-debt/investors");
  const msg = buildMessage(investor);
  assert.ok(msg.includes("Capital to deploy: $1M – $5M"));
  assert.ok(msg.includes("Lien preference: 1st position"));
  assert.ok(msg.includes("Timeline: Ready now"));
  // Private-debt metadata mirrored in structured extras too.
  assert.equal((p.privateDebt as Record<string, string>).capitalRange, "$1M – $5M");
});

test("investor opportunity title reads as a capital partner", () => {
  assert.equal(opportunityTitle(investor), "Capital Partner — Dana Lee");
});
