-- Production lead intake enum correction, 2026-10-18.
-- The website uses contact, investor_inquiry and book_review as action_type,
-- but migration 0001 only created the foreclosure-specific five enum values.
-- Without these values the durable property_interests insert fails, which
-- incorrectly surfaced as an HTTP 503 for otherwise valid public submissions.
--
-- Additive only; never rewrites or deletes existing leads. Safe if reapplied.
alter type public.interest_action add value if not exists 'contact';
alter type public.interest_action add value if not exists 'investor_inquiry';
alter type public.interest_action add value if not exists 'book_review';
