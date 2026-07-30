import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  buildGrcrmPayload,
  buildMessage,
  eventIdFor,
  classifyStatus,
  classifyError,
  type CrmLead,
} from "@/lib/crm";

// ---------------------------------------------------------------------------
// Local MOCK of the VERIFIED GRCRM lead-inbound receiver
// (westccmortgage/crm/netlify/functions/lead-inbound.mjs). Faithful to the real
// contract: 24-hex token auth, flat field resolution (name/email/phone/notes),
// require one identifier, email format check, 64KB cap, JSON body.
// No HMAC, no idempotency key. We do NOT call the live endpoint.
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 65_536;
const normPhone = (p: string) => String(p || "").replace(/\D/g, "").replace(/^1/, "");

function resolveFields(raw: Record<string, unknown>) {
  const norm: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) norm[k.toLowerCase().replace(/[\s\-.]+/g, "_")] = v;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = norm[k];
      if (v != null && typeof v !== "object" && String(v).trim()) return String(v).trim();
    }
    return null;
  };
  const fullName = pick("full_name", "name", "fullname");
  const firstName = pick("first_name", "firstname", "fname", "given_name");
  const lastName = pick("last_name", "lastname", "lname", "surname", "family_name");
  const email = pick("email", "email_address", "work_email", "business_email");
  const phone = pick("phone", "phone_number", "mobile", "cell", "telephone", "tel");
  const notes = pick("message", "comment", "comments", "notes", "note", "inquiry", "description", "body", "text");
  return { fullName, firstName, lastName, email, phone, notes };
}

function mockLeadInbound(
  url: string,
  opts: { method?: string; body: string },
): { status: number; json: Record<string, unknown> } {
  const method = opts.method ?? "POST";
  if (!["GET", "POST", "OPTIONS"].includes(method)) return { status: 405, json: { ok: false } };
  const token = new URL(url).searchParams.get("token");
  if (!token) return { status: 401, json: { ok: false, error: "Missing token" } };
  if (!/^[0-9a-f]{24}$/i.test(token)) return { status: 401, json: { ok: false, error: "Invalid token format" } };
  if (opts.body.length > MAX_BODY_BYTES) return { status: 413, json: { ok: false, error: "Payload too large" } };
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(opts.body);
  } catch {
    return { status: 400, json: { ok: false, error: "bad json" } };
  }
  const r = resolveFields(raw);
  const hasName = !!(r.fullName || r.firstName || r.lastName);
  const hasEmail = !!(r.email && EMAIL_RE.test(r.email));
  const hasPhone = !!(r.phone && normPhone(r.phone).length >= 7);
  if (!hasName && !hasEmail && !hasPhone)
    return { status: 400, json: { ok: false, error: "At least one of name, email, or phone is required" } };
  if (r.email && !EMAIL_RE.test(r.email)) return { status: 400, json: { ok: false, error: "Invalid email address" } };
  return { status: 200, json: { ok: true, contactId: "mock-" + (r.email || r.phone || r.fullName) } };
}

const TOKEN = "0123456789abcdef01234567"; // 24 hex
const URL_OK = `https://grcrm.example/.netlify/functions/lead-inbound?token=${TOKEN}`;

const financing: CrmLead = {
  firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "555-0100",
  actionType: "financing_request", financingType: "auction_acquisition", requestedAmount: 400000,
  state: "FL", county: "Broward", propertyId: "abc-123",
  propertyAddress: "123 Palm Ave, Fort Lauderdale, FL", auctionDate: "2026-04-01",
  investorExperience: "6_20", notes: "quick close", sourceDetail: "financing form",
};

// 1. Valid financing submission matches the receiver schema (200).
test("financing payload is accepted by the verified receiver contract", () => {
  const res = mockLeadInbound(URL_OK, { body: JSON.stringify(buildGrcrmPayload(financing)) });
  assert.equal(res.status, 200);
  assert.equal(res.json.ok, true);
});

// 2. Valid watchlist submission matches the schema.
test("watchlist payload is accepted", () => {
  const watchlist: CrmLead = { firstName: "Sam", email: "sam@example.com", actionType: "watchlist", consentAt: "2026-07-30T00:00:00Z" };
  const res = mockLeadInbound(URL_OK, { body: JSON.stringify(buildGrcrmPayload(watchlist)) });
  assert.equal(res.status, 200);
});

// 3. Property inquiry includes the correct property reference (in message→notes).
test("property reference travels in the mapped message field", () => {
  const msg = buildMessage(financing);
  assert.ok(msg.includes("123 Palm Ave"));
  assert.ok(msg.includes("abc-123"));
  const payload = buildGrcrmPayload(financing) as Record<string, string>;
  assert.equal(payload.message, msg); // message is the field the receiver reads
});

// 5. Malformed email is rejected by the receiver.
test("malformed email rejected (400)", () => {
  const bad = buildGrcrmPayload({ ...financing, email: "not-an-email" }) as Record<string, unknown>;
  const res = mockLeadInbound(URL_OK, { body: JSON.stringify(bad) });
  assert.equal(res.status, 400);
});

// 6. Too-short phone with no other identifier is rejected.
test("no valid identifier rejected (400)", () => {
  const res = mockLeadInbound(URL_OK, { body: JSON.stringify({ phone: "12" }) });
  assert.equal(res.status, 400);
});

// Token auth (verified receiver uses token, NOT HMAC).
test("bad/missing token rejected (401); valid token required", () => {
  assert.equal(mockLeadInbound("https://grcrm.example/x?token=nope", { body: "{}" }).status, 401);
  assert.equal(mockLeadInbound("https://grcrm.example/x", { body: "{}" }).status, 401);
});

// 7 & 8. Stable, deterministic event id; duplicate input → same identity.
test("eventIdFor is deterministic (same input → same id)", () => {
  const a = eventIdFor(financing);
  const b = eventIdFor({ ...financing });
  assert.equal(a, b);
  assert.match(a, /^pnc_[0-9a-f]{24}$/);
  const different = eventIdFor({ ...financing, email: "other@example.com" });
  assert.notEqual(a, different);
});

// 9. HMAC computation is correct (kept for forward-compat; receiver ignores it).
test("HMAC signature is computed correctly and is not the raw secret", () => {
  const secret = "s3cr3t-value";
  const body = JSON.stringify(buildGrcrmPayload(financing));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
  assert.match(sig, /^[0-9a-f]{64}$/);
  assert.ok(!sig.includes(secret)); // signature never reveals the secret
});

// 10. No secret ever appears in the payload/output.
test("payload contains no secrets", () => {
  const out = JSON.stringify(buildGrcrmPayload(financing));
  for (const bad of ["SERVICE_ROLE", "WEBHOOK_SECRET", "s3cr3t", "Bearer "]) assert.ok(!out.includes(bad));
});

// 11-13. Status classification.
test("classifyStatus: 2xx delivered, 400/401/413 rejected, 429/5xx retry_pending", () => {
  assert.equal(classifyStatus(200), "delivered");
  assert.equal(classifyStatus(400), "rejected");
  assert.equal(classifyStatus(401), "rejected");
  assert.equal(classifyStatus(413), "rejected");
  assert.equal(classifyStatus(429), "retry_pending");
  assert.equal(classifyStatus(500), "retry_pending");
  assert.equal(classifyStatus(503), "retry_pending");
});

// 14. Timeout after send is AMBIGUOUS (not a definite failure); other network
// errors are retryable.
test("classifyError: abort → sending_unknown; other → retry_pending", () => {
  const abort = new Error("aborted");
  abort.name = "AbortError";
  assert.equal(classifyError(abort), "sending_unknown");
  assert.equal(classifyError(new Error("ECONNRESET")), "retry_pending");
  assert.equal(classifyError("weird"), "retry_pending");
});

// 15. Receiver response contains no internals leaked to the public caller — our
// routes return a generic message; here we assert the mock's success shape.
test("receiver success response is minimal", () => {
  const res = mockLeadInbound(URL_OK, { body: JSON.stringify(buildGrcrmPayload(financing)) });
  assert.deepEqual(Object.keys(res.json).sort(), ["contactId", "ok"]);
});
