# GRCRM integration

GRCRM is an **internal** system. It is never surfaced to public users — no GRCRM branding,
URLs, tables, dashboards, or credentials appear anywhere in the public site or client bundle.

## Integration pattern (reuses the existing approved path)

The pre-foreclosure app already forwarded leads to GRCRM's **lead-inbound webhook** with the
canonical shape `{ name, email, phone, message }`. This platform **reuses that exact
approved pattern** — it does **not** invent new GRCRM API endpoints and does **not** touch
GRCRM's database directly. If/when GRCRM exposes a richer intake contract, the payload here
already carries structured fields it can map.

Implementation: `lib/crm.ts` (`sendToGRCRM`) + `lib/lead.ts` (`recordInterest`).

- The webhook URL (token embedded) lives in server env only:
  `GRCRM_LEAD_WEBHOOK_URL` (fallback `GRCRM_WEBHOOK_URL`).
- Optional HMAC-SHA256 signing via `GRCRM_WEBHOOK_SECRET` → header `X-PNC-Signature`.
- Best-effort: failures are captured (never thrown), and every lead is also stored in
  `property_interests` and emailed (fallback) so nothing is lost.
- **The Supabase service-role key is never in client code.** All CRM/DB writes are
  server-side (`runtime = "nodejs"` route handlers).

## When leads are sent

A GRCRM lead is forwarded when a visitor:

| Event | Route | `action_type` |
|---|---|---|
| Requests financing | `/api/financing` | `financing_request` |
| Subscribes to the weekly watchlist | `/api/watchlist` | `watchlist` |
| Saves a property | `/api/saved` | `save` |
| Tracks an auction | `/api/saved` (alert on) | `track_auction` |
| Requests a deal review | `/financing?intent=review` → `/api/financing` | `financing_request` (private_capital) |
| Registers | Supabase Auth (no CRM lead until they take an action) | — |

## Payload → CRM mapping

`buildGrcrmPayload` (in `lib/crm.ts`) sends the canonical four **plus** structured objects a
GRCRM handler may map to Contact / Lead-Opportunity / Property Interest / Follow-up Task:

- **Contact:** `firstName, lastName, email, phone`.
- **Property Interest:** `propertyId, propertyAddress, state, county, actionType,
  financingType, requestedAmount, auctionDate, investorExperience`.
- **Attribution:** `utmSource, utmMedium, utmCampaign, referrer, consentAt`.
- **Opportunity title (suggested):** `"[County] Auction Acquisition — [Property Address]"`.
- **Follow-up task (suggested):** `"Contact investor regarding [Property Address] before
  [Auction Date]"`.
- Fixed `source = "Private Note Capital"` and a `sourceDetail` (e.g. "financing form").

**Property data is never placed in the Contact/Lead name.** The name is the person; property
details live in the message body and the structured `propertyInterest` object (unit-tested in
`tests/crm.test.ts`).

## Security model

- Webhook URL + secret in **server env only**; never shipped to the browser.
- All forwarding happens in Node route handlers; the client only POSTs to our own `/api/*`.
- `property_interests` records `crm_forwarded` / `crm_error` for observability. Failed CRM
  submissions are logged (without secrets) for retry/triage.

## Tables, functions, security actually used

- **Function:** `lib/lead.ts#recordInterest` — inserts `property_interests` (service role),
  calls `sendToGRCRM`, records the outcome, and sends the email fallback.
- **Table written:** `property_interests` (server-side, service role). `search_alerts` for
  watchlist. No GRCRM tables are written directly.
- **Secret model:** `GRCRM_LEAD_WEBHOOK_URL`, `GRCRM_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE`
  — all server-only Netlify env vars.

## Blocker

If GRCRM should receive the **structured** fields (not just the canonical four), a GRCRM-side
handler must be added to read them. The exact GRCRM inbound contract beyond
`{ name, email, phone, message }` was **not inventable from this repo** (GRCRM lives in the
separate `westccmortgage/crm` project). Confirm the contract there, then the payload already
carries the data. Until then, GRCRM receives the canonical four with a rich `message` and can
ignore the extras safely.
