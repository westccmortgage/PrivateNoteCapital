# GRCRM integration verification

**No live test was sent.** This documents the exact payload the code builds and the security
properties, verified by reading `lib/crm.ts`, `lib/lead.ts`, and the route handlers, plus the
unit tests in `tests/crm.test.ts`.

## Transport & security (verified)

- **Server-side only.** `sendToGRCRM` runs in Node route handlers (`runtime = "nodejs"`).
  The webhook URL comes from `serverEnv.grcrmWebhookUrl` (`lib/env.server.ts`), which is not
  in the client bundle (verified by bundle scan).
- **URL/secret never exposed to the client.** The browser only POSTs to our own `/api/*`.
- **HMAC signing:** if `GRCRM_WEBHOOK_SECRET` is set, the body is signed HMAC-SHA256 and sent
  as `X-PNC-Signature: sha256=<hex>`. Otherwise unsigned (documented, best-effort).
- **Timeout/retry:** currently **no explicit timeout and no automatic retry.** Failures are
  caught (never thrown); the lead is still persisted to `property_interests` with
  `crm_forwarded=false` + `crm_error`, and an email fallback fires. → **Durability gap noted
  as a recommendation** (add an AbortController timeout + a retry/queue) — see the report.
- **Idempotency/duplicate leads:** no dedup of repeat submissions today; each POST creates a
  new `property_interests` row and one webhook call. Rate limiting (6/min/IP) blunts abuse.
- **PII in logs:** the "not configured" log line was corrected to log only `action_type`
  (no email/phone). No secrets are logged.
- **Consent:** `consent_at` is recorded (watchlist requires explicit consent; validation
  enforces it).

## When leads fire

| Event | Route | action_type |
|---|---|---|
| Financing request | `/api/financing` | `financing_request` |
| Weekly watchlist | `/api/watchlist` | `watchlist` |
| Save property | `/api/saved` | `save` |
| Track auction | `/api/saved` (alert on) | `track_auction` |
| Deal review (property) | `/financing?intent=review` → `/api/financing` | `financing_request` |

Registration alone does **not** send a CRM lead (only actions do).

## Receiving contract — verification status

The **canonical** shape `{ name, email, phone, message }` is the pattern the prior production
app already used against GRCRM's lead-inbound webhook, so it is reused verbatim. The
**structured extras** (contact/propertyInterest/opportunity/task/attribution) are **additive**;
whether GRCRM maps them depends on a GRCRM-side handler.

> ⚠️ **The exact GRCRM receiving contract beyond the canonical four could NOT be verified from
> this repository** (GRCRM lives in the separate `westccmortgage/crm` project). A GRCRM-side
> handler must be confirmed/added to consume the structured fields. Until then GRCRM receives
> the four canonical fields plus a rich human-readable `message`, and can ignore the extras.

## Property data is never placed in the contact/lead name (verified)

`buildGrcrmPayload` sets `name` from the person's first/last (or email), and puts property
details in `message` and the structured `propertyInterest` object. Asserted in
`tests/crm.test.ts` ("property data must NOT be jammed into the contact name").

## Concrete test payload (fictional — do NOT send to production)

Input lead (financing request on a Broward property):

```json
{
  "firstName": "Jane", "lastName": "Doe",
  "email": "jane@example.com", "phone": "555-0100",
  "actionType": "financing_request", "financingType": "auction_acquisition",
  "requestedAmount": 400000, "state": "FL", "county": "Broward",
  "propertyId": "abc-123", "propertyAddress": "123 Palm Ave, Fort Lauderdale, FL",
  "auctionDate": "2026-04-01", "investorExperience": "6_20",
  "notes": "Cash-heavy, quick close", "sourceDetail": "financing form",
  "utm": { "source": "suncoast", "medium": "referral", "campaign": "fl-auctions" },
  "referrer": "https://suncoastcapitalmortgage.com", "consentAt": "2026-07-30T00:00:00Z"
}
```

Outgoing webhook body (built by `buildGrcrmPayload`):

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "555-0100",
  "message": "[Financing request] via PrivateNoteCapital.com\nSource: financing form\n\nProperty: 123 Palm Ave, Fort Lauderdale, FL\nProperty ID: abc-123\nLocation: Broward County, FL\nAuction date: 2026-04-01\nFinancing: Auction Acquisition Financing\nRequested amount: $400,000\nInvestor experience: 6_20\n\nNotes: Cash-heavy, quick close\n\nSuggested opportunity: Broward Auction Acquisition — 123 Palm Ave, Fort Lauderdale, FL\nSuggested task: Contact investor regarding 123 Palm Ave, Fort Lauderdale, FL before 2026-04-01",
  "source": "Private Note Capital",
  "sourceDetail": "financing form",
  "contact": { "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "phone": "555-0100" },
  "propertyInterest": {
    "propertyId": "abc-123", "propertyAddress": "123 Palm Ave, Fort Lauderdale, FL",
    "state": "FL", "county": "Broward", "actionType": "financing_request",
    "financingType": "auction_acquisition", "requestedAmount": 400000,
    "auctionDate": "2026-04-01", "investorExperience": "6_20"
  },
  "opportunity": { "title": "Broward Auction Acquisition — 123 Palm Ave, Fort Lauderdale, FL" },
  "task": { "title": "Contact investor regarding 123 Palm Ave, Fort Lauderdale, FL before 2026-04-01" },
  "attribution": { "utmSource": "suncoast", "utmMedium": "referral", "utmCampaign": "fl-auctions", "referrer": "https://suncoastcapitalmortgage.com", "consentAt": "2026-07-30T00:00:00Z" }
}
```

Headers: `Content-Type: application/json`, `X-PNC-Source: PrivateNoteCapital.com`, and (if a
secret is set) `X-PNC-Signature: sha256=<hmac>`.

## Recommendations (blockers/hardening)

1. **Confirm the GRCRM contract** in `westccmortgage/crm` and add a handler for the
   structured fields (blocker for full mapping).
2. Add an **AbortController timeout** (e.g. 8s) and a **retry/queue** for durability.
3. Consider a **dedup window** (same email+action+property within N minutes) to reduce
   duplicate opportunities/tasks.
