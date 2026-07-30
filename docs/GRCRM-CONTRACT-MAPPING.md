# GRCRM contract mapping (verified)

The GRCRM receiver contract was verified **read-only** from the connected repo.

## Verified receiver

- **Repo/file:** `westccmortgage/crm` → `netlify/functions/lead-inbound.mjs`
  (also `netlify/functions/_lib/supabase.mjs` for the service-role client;
  `lead_sources` table holds per-source tokens).
- **Endpoint:** `POST /.netlify/functions/lead-inbound?token=<token>`
- **Methods:** `OPTIONS` (CORS 204), `GET` (probe → 200 when token valid),
  `POST` (submit). Any other method → **405**.
- **Auth:** a **token** = exactly **24 lowercase hex chars**, accepted via query
  (`token`/`api_key`/`apikey`/`key`), header (`x-lead-token`, `authorization:
  Bearer <token>`, `x-api-key`, `api-key`), or body (`token`/`api_key`/`apikey`,
  stripped before mapping). **No HMAC. No signature. No timestamp. No replay
  protection.** The token IS the credential. Bad/missing/inactive → **401**.
- **Rate limit:** 120 requests / 60 s per token → **429**.
- **Body:** JSON or `x-www-form-urlencoded`; **max 64 KB** → **413**.
- **Field mapping** (`resolveFields`, case-insensitive, `-/space/.`→`_`):
  - name ← `full_name|name|fullname` / `first_name|firstname|fname|given_name` / `last_name|lastname|lname|surname|family_name`
  - email ← `email|email_address|work_email|business_email`
  - phone ← `phone|phone_number|mobile|cell|telephone|tel|contact_number`
  - notes ← `message|comment|comments|notes|note|inquiry|description|body|text|question|how_can_we_help|property_address`
- **Nested/structured objects are IGNORED** (only scalar aliases are read).
- **Contact build:** `type:'Lead'`, name (≤120), first/last (≤60), email
  lowercased (≤255), phone (≤30), notes (≤2000), `source` = the token's
  `lead_sources.name` (**not** a payload field), tags `['Web lead', default_tag]`.
- **Dedupe:** by email (case-insensitive), then normalized 10-digit phone. Match
  → merge tags + append notes + fill source if blank. No match → append new
  contact. (Also routes round-robin assignment + sends broker notification.)
- **Special branches:** Meta Lead Ads (`field_data`) and Arive LOS triggers (loan
  fields) — neither is triggered by Private Note Capital leads.
- **Responses:** `200 {ok:true,contactId,…}`; `400` validation (never 500 on bad
  input); `401` token; `405`; `413`; `429`; `500` server; `503` not configured.
- **No idempotency key.** Dedupe is by email/phone only.

## What this means for Private Note Capital

The **canonical scalar fields are the real contract.** The prior structured
payload (`contact`/`propertyInterest`/`opportunity`/`task`/`attribution`) is
**not consumed** by this receiver — there is **no Opportunity/Task/Property-
Interest creation** from lead-inbound. All that context is preserved because
`buildMessage()` embeds it into `message` → the contact's `notes`.

**GRCRM CONTRACT: IMPLEMENTED for flat lead capture; structured mapping NOT
IMPLEMENTED by the receiver.**

## Field mapping table (sender → verified receiver)

| PNC field | Sender source | Receiver field | Req? | Normalization | Consumed? |
|---|---|---|---|---|---|
| `name` | first+last (or email) | name → contact.name | one of name/email/phone | ≤120 | ✅ |
| `first_name` | lead.firstName | contact.firstName | — | ≤60 | ✅ (added in reconciliation) |
| `last_name` | lead.lastName | contact.lastName | — | ≤60 | ✅ (added) |
| `email` | lead.email | contact.email | one of | lowercased, format-checked | ✅ |
| `phone` | lead.phone | contact.phone | one of | 10-digit dedupe | ✅ |
| `message` | `buildMessage()` (property, financing, auction, consent, UTM) | contact.notes | — | ≤2000 | ✅ |
| `external_event_id` | `eventIdFor()` | — | — | — | ❌ ignored (sender traceability) |
| `source` | "Private Note Capital" | — (source from token) | — | — | ❌ ignored |
| `contact`/`propertyInterest`/`opportunity`/`task`/`attribution` | structured | — | — | — | ❌ ignored (forward-compat) |
| token | in `GRCRM_LEAD_WEBHOOK_URL` `?token=` | credential | **required** | 24-hex | ✅ (auth) |
| `X-PNC-Signature` (HMAC) | if `GRCRM_WEBHOOK_SECRET` set | — | — | — | ❌ ignored (receiver uses token) |

## Per-flow

| Flow | action_type | Property ref | Consent |
|---|---|---|---|
| Financing request | `financing_request` | propertyId + address in message | n/a |
| Watchlist | `watchlist` | criteria in message | `consent_at` (required by validation) |
| Save / Track | `save` / `track_auction` | propertyId in message | n/a |
| Deal review | `financing_request` (private_capital) | propertyId + address | n/a |

## Idempotency & duplicates

The receiver dedupes **contacts** by email/phone (so repeat submissions from the
same person merge rather than create duplicate contacts, but each POST appends a
note). There is **no event-ID idempotency**, so exactly-once delivery is **not**
guaranteed. `external_event_id` (`pnc_<sha256[:24]>`) is deterministic per logical
submission and stored in `property_interests.event_id` for sender-side
traceability only.

## To enable structured mapping (future, GRCRM-side change — out of scope here)

A GRCRM-side handler would need to read the structured objects and create
Opportunity/Task records. Until then, PNC sends everything in `message` and the
data is fully captured as contact notes.
