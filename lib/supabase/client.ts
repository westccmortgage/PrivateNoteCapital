"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, supabasePublicConfigured } from "@/lib/env";

// Browser Supabase client (anon key, RLS-enforced). Used by auth forms and
// signed-in client components. Returns null when not configured so UI can
// degrade gracefully instead of throwing.
export function getBrowserSupabase() {
  if (!supabasePublicConfigured()) return null;
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
