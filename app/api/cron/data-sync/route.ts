// Protected scheduled sync (Section 15). NOT public: requires the server-side
// shared secret in the Authorization header. Invoked once daily by the Netlify
// scheduled function (netlify/functions/data-sync-daily). Runs BOTH providers;
// LA event sync stays disabled until a lawful feed is configured. Idempotent,
// overlap-guarded, bounded. Logs carry no secrets or PII.

import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";
import { runAllCounties } from "@/lib/providers/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = serverEnv.dataSyncCronSecret;
  if (!secret) return false; // never allow public execution when unset
  const header = request.headers.get("authorization") || request.headers.get("x-data-sync-secret") || "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  // Constant-time-ish compare (length-guarded).
  if (provided.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= provided.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const started = Date.now();
  const results = await runAllCounties(admin, { triggeredBy: "cron" });
  // Summarize only — no PII, no secrets.
  const summary = results.map((r) => ({
    county: r.county,
    provider: r.provider,
    correlationId: r.correlationId,
    ok: r.ok,
    enabled: r.enabled,
    received: r.received,
    created: r.created,
    updated: r.updated,
    published: r.published,
    archived: r.archived,
    rejected: r.rejected,
    ownerActionRequired: r.ownerActionRequired,
  }));
  console.log(`[cron:data-sync] completed in ${Date.now() - started}ms: ${summary.map((s) => `${s.provider}=${s.ok ? "ok" : "fail"}(${s.received})`).join(", ")}`);
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results: summary });
}

export async function POST(request: Request) {
  return handle(request);
}

// GET supported so a scheduled function or uptime pinger can trigger it too.
export async function GET(request: Request) {
  return handle(request);
}
