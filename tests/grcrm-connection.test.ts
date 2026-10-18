import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGrcrmConnection } from "@/lib/grcrm-connection";
import { readFileSync } from "node:fs";

const t1 = "0123456789abcdef01234567";
const t2 = "abcdef0123456789abcdef01";

test("legacy webhook URL token is moved out of the network URL", () => {
  const c = parseGrcrmConnection("https://grcrm.com/.netlify/functions/lead-inbound?token=" + t1);
  assert.deepEqual(c, {
    endpointUrl: "https://grcrm.com/.netlify/functions/lead-inbound",
    token: t1,
  });
  assert.ok(!c?.endpointUrl.includes(t1));
});

test("separate environment token is preferred to legacy token", () => {
  const c = parseGrcrmConnection("https://grcrm.com/.netlify/functions/lead-inbound?token=" + t1 + "&v=1", t2);
  assert.equal(c?.token, t2);
  assert.equal(c?.endpointUrl, "https://grcrm.com/.netlify/functions/lead-inbound?v=1");
});

test("invalid schemes and token formats are rejected", () => {
  assert.equal(parseGrcrmConnection("http://grcrm.com/webhook?token=" + t1), null);
  assert.equal(parseGrcrmConnection("https://grcrm.com/webhook?token=invalid"), null);
  assert.equal(parseGrcrmConnection("totally invalid", t2), null);
});

test("contact, investor and review intake actions are present in enum migration", () => {
  const sql = readFileSync("supabase/migrations/0006_inbound_interest_actions.sql", "utf8");
  for (const action of ["contact", "investor_inquiry", "book_review"]) {
    assert.ok(sql.includes("'" + action + "'"));
  }
});
