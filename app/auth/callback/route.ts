import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/auth-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supabase recovery/OAuth callback (PKCE). Exchanges the `code` for a session
// (sets auth cookies) and forwards to a sanitized internal `next` path. On any
// failure it redirects to the reset page's invalid state. Never logs codes or
// tokens; the sensitive `code` param is dropped by redirecting to a clean path.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeNextPath(url.searchParams.get("next"));
  const invalid = new URL("/auth/reset-password?error=invalid", url.origin);

  if (!code) return NextResponse.redirect(invalid);

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.redirect(invalid);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Do not log or surface the raw error / code.
    return NextResponse.redirect(invalid);
  }

  // Success: session cookies are set. Redirect to the clean internal path,
  // which drops the code from the visible URL.
  return NextResponse.redirect(new URL(next, url.origin));
}
