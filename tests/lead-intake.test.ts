import { test } from "node:test";
import assert from "node:assert/strict";
import { leadAccepted, type LeadOutcome } from "@/lib/lead";

function outcome(overrides: Partial<LeadOutcome> = {}): LeadOutcome {
  return { stored: false, crmForwarded: false, crmMessage: "not configured", emailed: false, ...overrides };
}

test("a lead is not acknowledged when every delivery and storage channel failed", () => {
  assert.equal(leadAccepted(outcome()), false);
});

test("database persistence alone accepts a lead for later staff follow-up", () => {
  assert.equal(leadAccepted(outcome({ stored: true })), true);
});

test("verified CRM delivery alone accepts a lead", () => {
  assert.equal(leadAccepted(outcome({ crmForwarded: true })), true);
});

test("email delivery alone accepts a lead", () => {
  assert.equal(leadAccepted(outcome({ emailed: true })), true);
});
