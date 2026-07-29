import { NextResponse } from "next/server";
import { validateFinancing } from "@/lib/validation";
import { recordInterest } from "@/lib/lead";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rl = rateLimit(`financing:${clientIp(request)}`, { limit: 6, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { ok, errors, value } = validateFinancing(body);
  if (!ok) return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });

  const user = await getCurrentUser();
  const outcome = await recordInterest({
    userId: user?.id ?? null,
    propertyId: (body.propertyId as string) || null,
    actionType: "financing_request",
    financingType: value.financingType,
    requestedAmount: value.requestedAmount,
    firstName: value.firstName,
    lastName: value.lastName,
    email: value.email,
    phone: value.phone,
    state: value.state,
    county: (body.county as string) || "",
    propertyAddress: value.propertyAddress,
    auctionDate: value.closingOrAuctionDate || null,
    investorExperience: value.investorExperience,
    notes: value.notes,
    sourceDetail: "financing form",
    attribution: (body.attribution as InterestAttribution) || {},
  });

  return NextResponse.json({
    ok: true,
    forwarded: outcome.crmForwarded,
    message: "Request received. A representative will review and reach out. Not a commitment to lend.",
  });
}

type InterestAttribution = { utm_source?: string; utm_medium?: string; utm_campaign?: string; referrer?: string };
