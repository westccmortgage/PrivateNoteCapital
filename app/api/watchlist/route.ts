import { NextResponse } from "next/server";
import { validateWatchlist } from "@/lib/validation";
import { recordInterest } from "@/lib/lead";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getCurrentUser, getAdminSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rl = rateLimit(`watchlist:${clientIp(request)}`, { limit: 6, windowMs: 60_000 });
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

  const { ok, errors, value } = validateWatchlist(body);
  if (!ok) return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });

  const user = await getCurrentUser();
  const nowIso = new Date().toISOString();

  // Persist the subscription (service role). consented_at is set ONLY because the
  // user explicitly opted in (validation requires consent === true).
  const admin = getAdminSupabase();
  if (admin) {
    const { error } = await admin.from("search_alerts").insert({
      user_id: user?.id ?? null,
      email: value.email,
      first_name: value.firstName || null,
      last_name: value.lastName || null,
      phone: value.phone || null,
      state: value.state || null,
      counties: value.counties,
      property_types: value.propertyTypes,
      minimum_price: value.minPrice,
      maximum_price: value.maxPrice,
      auction_date_horizon: value.auctionHorizon || null,
      financing_type: value.financingType || null,
      investor_experience: value.investorExperience || null,
      frequency: "weekly",
      consented_at: nowIso, // explicit opt-in
      active: true,
    });
    if (error) console.error("[watchlist] insert error:", error.message);
  }

  // Forward as a lead so the team can follow up.
  const outcome = await recordInterest({
    userId: user?.id ?? null,
    actionType: "watchlist",
    financingType: value.financingType || null,
    firstName: value.firstName,
    lastName: value.lastName,
    email: value.email,
    phone: value.phone,
    state: value.state,
    investorExperience: value.investorExperience,
    notes: `Watchlist: counties=${value.counties.join("|") || "any"}; types=${value.propertyTypes.join("|") || "any"}; horizon=${value.auctionHorizon || "—"}`,
    sourceDetail: "weekly watchlist",
    consent: true,
    attribution: (body.attribution as Attribution) || {},
  });

  return NextResponse.json({
    ok: true,
    forwarded: outcome.crmForwarded,
    message: "You're subscribed. Your first weekly watchlist will arrive soon. You can unsubscribe anytime.",
  });
}

type Attribution = { utm_source?: string; utm_medium?: string; utm_campaign?: string; referrer?: string };
