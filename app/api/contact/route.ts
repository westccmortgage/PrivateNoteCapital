import { NextResponse } from "next/server";
import { validateSimple, isBotSubmission } from "@/lib/validation";
import { recordInterest } from "@/lib/lead";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Attribution = { utm_source?: string; utm_medium?: string; utm_campaign?: string; referrer?: string };

// General contact form → the single GRCRM integration.
export async function POST(request: Request) {
  const rl = rateLimit(`contact:${clientIp(request)}`, { limit: 6, windowMs: 60_000 });
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
  if (isBotSubmission(body)) {
    return NextResponse.json({ ok: true, forwarded: false, message: "Message received." });
  }

  const { ok, errors, value } = validateSimple(body);
  if (!ok) return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });

  const user = await getCurrentUser();
  const outcome = await recordInterest({
    userId: user?.id ?? null,
    actionType: "contact",
    firstName: value.firstName,
    lastName: value.lastName,
    email: value.email,
    phone: value.phone,
    notes: value.message,
    sourceDetail: "contact form",
    sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl : undefined,
    attribution: (body.attribution as Attribution) || {},
  });

  return NextResponse.json({
    ok: true,
    forwarded: outcome.crmForwarded,
    message: "Thanks — your message was received. We'll get back to you shortly.",
  });
}
