import { NextResponse } from "next/server";
import { getServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { recordInterest } from "@/lib/lead";
import { cleanStr } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Save / track a property. Requires sign-in (RLS: owner-only). Also logs the
// action as an interest and forwards to GRCRM.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save properties." }, { status: 401 });

  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const propertyId = cleanStr(body.propertyId, 64);
  if (!propertyId) return NextResponse.json({ error: "Missing property." }, { status: 400 });
  const alertEnabled = body.alertEnabled === true;

  // Upsert the saved row (RLS enforces user_id = auth.uid()).
  const { error } = await supabase
    .from("saved_properties")
    .upsert(
      { user_id: user.id, property_id: propertyId, alert_enabled: alertEnabled },
      { onConflict: "user_id,property_id" },
    );
  if (error) {
    console.error("[saved] upsert error:", error.message);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  }

  // Fire-and-forget lead logging (don't block the UX on CRM).
  const action = body.action === "track_auction" ? "track_auction" : "save";
  await recordInterest({
    userId: user.id,
    propertyId,
    actionType: action,
    email: user.email ?? undefined,
    sourceDetail: "property page",
    attribution: (body.attribution as Attribution) || {},
  });

  return NextResponse.json({ ok: true });
}

// Remove a saved property.
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: "Missing property." }, { status: 400 });

  const { error } = await supabase
    .from("saved_properties")
    .delete()
    .eq("user_id", user.id)
    .eq("property_id", propertyId);
  if (error) return NextResponse.json({ error: "Could not remove." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

type Attribution = { utm_source?: string; utm_medium?: string; utm_campaign?: string; referrer?: string };
