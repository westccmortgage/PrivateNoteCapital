// Admin control for the county collectors (Section 14). Admin-gated.
//   GET            → status for both counties (config + last run; no network)
//   POST test      → live connection test for one provider (or all)
//   POST sync      → run "Sync now" for one provider
// Credentials are never exposed. Uses the existing admin authorization.

import { NextResponse } from "next/server";
import { isAdmin, getAdminSupabase } from "@/lib/supabase/server";
import { getCountyStatuses } from "@/lib/providers/status";
import { getProvider } from "@/lib/providers/registry";
import { runCountySync } from "@/lib/providers/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const admin = getAdminSupabase();
  const counties = await getCountyStatuses(admin);
  return NextResponse.json({ ok: true, counties });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { action?: string; provider?: string };
  const action = body.action ?? "";

  if (action === "test") {
    const provider = getProvider(body.provider ?? "");
    if (!provider) return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
    const result = await provider.testConnection();
    return NextResponse.json({ ok: true, provider: provider.id, connection: result });
  }

  if (action === "sync") {
    const admin = getAdminSupabase();
    if (!admin) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    const provider = getProvider(body.provider ?? "");
    if (!provider) return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
    const result = await runCountySync(provider.id, admin, { triggeredBy: "admin" });
    return NextResponse.json({ ok: result.ok, result });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
