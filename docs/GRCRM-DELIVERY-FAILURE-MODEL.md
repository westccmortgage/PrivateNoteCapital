# GRCRM delivery failure model

How a lead submission behaves when GRCRM is unavailable, slow, or returns an
error. Goal: **a valid user submission is never silently lost, and the user is
never told "success" merely because a request was sent.**

## Pipeline (`lib/lead.ts` → `lib/crm.ts`)

1. **Durable capture first.** `recordInterest()` inserts the lead into
   `property_interests` with `delivery_state='received'` and a deterministic
   `event_id` **before** the external call. (No-op only if the DB is
   unconfigured — see limitation.)
2. **Send** to GRCRM (`sendToGRCRM`) with an **8 s AbortController timeout** and
   the token-in-URL credential.
3. **Record outcome** back onto the same row: `delivery_state`, `crm_forwarded`,
   and `crm_error`.
4. **Email fallback** (`sendNotificationEmail`) fires regardless, so a configured
   inbox always receives the lead.

## Delivery states

| State | Trigger | Retryable? | Meaning |
|---|---|---|---|
| `received` | persisted pre-send | — | Captured; delivery not yet attempted/finished |
| `delivered` | HTTP 2xx | no | GRCRM accepted the lead |
| `rejected` | HTTP 400/401/403/413/422 | **no** | Bad request/token/payload — do not retry blindly |
| `retry_pending` | HTTP 429/5xx or network error | **yes** | Transient — safe to retry later |
| `sending_unknown` | timeout/abort after send | **ambiguous** | Request may have been received; do NOT assume failure |
| `not_configured` | no webhook URL | — | Stored locally + emailed |

Classification is pure and unit-tested (`classifyStatus`, `classifyError` in
`tests/grcrm-contract.test.ts`).

## Behavior per GRCRM condition

| Condition | State | User sees | Lead safe? |
|---|---|---|---|
| Unavailable / network error | `retry_pending` | "Request received…" | ✅ persisted + emailed |
| Slow (>8 s) → timeout | `sending_unknown` | "Request received…" | ✅ persisted + emailed |
| 400 (bad payload) | `rejected` | "Request received…" | ✅ persisted + emailed |
| 401/403 (bad token) | `rejected` | "Request received…" | ✅ persisted + emailed |
| 409 | `rejected` | "Request received…" | ✅ |
| 429 (rate limited) | `retry_pending` | "Request received…" | ✅ |
| 500 | `retry_pending` | "Request received…" | ✅ |
| Malformed JSON response | treated as its HTTP status | — | ✅ |
| Accepted then timeout | `sending_unknown` | "Request received…" | ✅ (dedupe on retry by email/phone) |

The public response never exposes GRCRM internals and never claims CRM success —
it confirms **receipt** only.

## Duplicate / retry safety

- The verified receiver **dedupes contacts by email/phone**, so re-sending the
  same person merges into the existing contact (a duplicate contact is not
  created) — though each POST appends a note.
- There is **no receiver idempotency key**, so **exactly-once is not guaranteed.**
  `event_id` is deterministic per logical submission for sender-side visibility.
- A background retry worker is **not** implemented (would require a queue/cron).
  `retry_pending`/`sending_unknown` rows are the durable record from which a
  future retry job (or manual replay) can operate.

## Limitation (honest)

Full durable delivery requires the staging/production Supabase to be configured.
When `SUPABASE_SERVICE_ROLE` is **unset**, step 1 is a no-op and the only capture
is the **email fallback** + server logs. This is a **staging-infrastructure
requirement**, not a code gap: the code + migration `0003` are in place;
durability becomes live once the DB env is set. **Delivery durability is NOT
claimed as live in this repo-only phase.**
