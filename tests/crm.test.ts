import { test } from "node:test";
import assert from "node:assert/strict";
import { opportunityTitle, followUpTask, buildGrcrmPayload, buildMessage, type CrmLead } from "@/lib/crm";

const lead: CrmLead = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "555-1212",
  actionType: "financing_request",
  financingType: "auction_acquisition",
  requestedAmount: 400000,
  state: "FL",
  county: "Broward",
  propertyId: "abc-123",
  propertyAddress: "123 Palm Ave, Fort Lauderdale, FL",
  auctionDate: "2026-04-01",
  investorExperience: "6_20",
  notes: "Cash-heavy, quick close",
};

test("opportunityTitle: [County] Auction Acquisition — [Address]", () => {
  assert.equal(
    opportunityTitle(lead),
    "Broward Auction Acquisition — 123 Palm Ave, Fort Lauderdale, FL",
  );
});

test("followUpTask: mentions address and auction date", () => {
  assert.equal(
    followUpTask(lead),
    "Contact investor regarding 123 Palm Ave, Fort Lauderdale, FL before 2026-04-01",
  );
});

test("buildGrcrmPayload: canonical four present + structured extras", () => {
  const p = buildGrcrmPayload(lead) as Record<string, any>;
  assert.equal(p.name, "Jane Doe");
  assert.equal(p.email, "jane@example.com");
  assert.equal(p.phone, "555-1212");
  assert.equal(typeof p.message, "string");
  assert.equal(p.source, "Private Note Capital");
  // Property data must NOT be jammed into the contact name.
  assert.ok(!String(p.name).includes("123 Palm Ave"));
  assert.equal(p.propertyInterest.propertyId, "abc-123");
  assert.equal(p.opportunity.title, opportunityTitle(lead));
  assert.equal(p.task.title, followUpTask(lead));
});

test("buildMessage: includes property + suggested opportunity/task", () => {
  const m = buildMessage(lead);
  assert.ok(m.includes("123 Palm Ave"));
  assert.ok(m.includes("Suggested opportunity"));
  assert.ok(m.includes("Suggested task"));
});

test("followUpTask: graceful without auction date", () => {
  const t = followUpTask({ ...lead, auctionDate: undefined });
  assert.equal(t, "Contact investor regarding 123 Palm Ave, Fort Lauderdale, FL");
});
