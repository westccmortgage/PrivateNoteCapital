import { NextResponse } from "next/server";
import { validateInvestor, validateSimple, isBotSubmission } from "@/lib/validation";
import { recordInterest } from "@/lib/lead";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Attribution = { utm_source?: string; utm_medium?: string; utm_campaign?: string; referrer?: string };

/**
 * One centralized private-debt inquiry endpoint. `request_type` selects the flow:
 *   - investor_inquiry : capital-partner intake (consent required)
 *   - book_review      : consultation / deal-review request
 * Both forward through the single GRCRM integration (recordInterest → lib/crm).
 */
export async function POST(request: Request) {
  const rl = rateLimit(`private-debt:${clientIp(request)}`, { limit: 6, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — silently accept bots without processing.
  if (isBotSubmission(body)) {
    return NextResponse.json({ ok: true, forwarded: false, message: "Request received." });
  }

  const requestType = String(body.request_type ?? "investor_inquiry");
  const user = await getCurrentUser();
  const attribution = (body.attribution as Attribution) || {};
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl : undefined;

  if (requestType === "book_review") {
    const { ok, errors, value } = validateSimple(body);
    if (!ok) return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    const outcome = await recordInterest({
      userId: user?.id ?? null,
      actionType: "book_review",
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone,
      notes: value.message,
      sourceDetail: "private-debt review request",
      sourceUrl,
      attribution,
    });
    return NextResponse.json({
      ok: true,
      forwarded: outcome.crmForwarded,
      message: "Thanks — we received your request and will reach out shortly.",
    });
  }

  // Default: investor_inquiry (consent-gated).
  const { ok, errors, value } = validateInvestor(body);
  if (!ok) return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
  const outcome = await recordInterest({
    userId: user?.id ?? null,
    actionType: "investor_inquiry",
    firstName: value.firstName,
    lastName: value.lastName,
    email: value.email,
    phone: value.phone,
    notes: value.message,
    capitalRange: value.capitalRange || undefined,
    lienPreference: value.lienPreference || undefined,
    timeline: value.timeline || undefined,
    sourceDetail: "private-debt investor intake",
    sourceUrl,
    consent: true,
    attribution,
  });
  return NextResponse.json({
    ok: true,
    forwarded: outcome.crmForwarded,
    message:
      "Thanks — a representative will reach out with information. This is not an offer of securities.",
  });
}
