import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { parseSearchParams, runSearch } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// JSON search endpoint (public, RLS-scoped to published rows). Powers optional
// client-side infinite loading and is easy to test. Never returns unpublished data.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw: Record<string, string> = {};
  searchParams.forEach((v, k) => (raw[k] = v));
  const filter = parseSearchParams(raw);
  const supabase = getServerSupabase();
  const result = await runSearch(supabase, filter);
  return NextResponse.json(result);
}
