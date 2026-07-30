// PUBLIC environment access — safe to import from client OR server code.
// Only NEXT_PUBLIC_* values live here. Server-only secrets (service role, GRCRM
// webhook + secret) live in lib/env.server.ts, which must never be imported by a
// client component. This split keeps secret env NAMES out of the client bundle.
//
// Nothing here throws at import time, so the app builds/renders with graceful
// empty states before any backend is wired.

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

/** Is the public (RLS-scoped) Supabase client configured? */
export function supabasePublicConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}
