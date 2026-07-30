-- Migration 0003: lead delivery durability.
--
-- Adds a deterministic sender event id and an explicit delivery state to
-- property_interests so a lead is captured (state='received') BEFORE the external
-- GRCRM call, and the outcome is recorded afterward. This supports the delivery
-- failure model in docs/GRCRM-DELIVERY-FAILURE-MODEL.md.
--
-- NOTE: unapplied artifact. Apply in staging with 0001/0002, then verify.

alter table property_interests
  add column if not exists event_id text,
  add column if not exists delivery_state text not null default 'received';

-- event_id gives sender-side traceability / dedupe visibility. It is NOT unique:
-- the verified GRCRM receiver has no idempotency-key support (it dedupes contacts
-- by email/phone), and two genuinely distinct submissions could share content.
create index if not exists idx_pi_event_id on property_interests (event_id);
create index if not exists idx_pi_delivery_state on property_interests (delivery_state);

-- Allowed states (documented; enforced in application code, kept as text for
-- forward-compatibility): received | delivered | rejected | retry_pending |
-- sending_unknown | not_configured.
comment on column property_interests.delivery_state is
  'received|delivered|rejected|retry_pending|sending_unknown|not_configured';
