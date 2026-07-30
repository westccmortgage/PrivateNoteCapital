"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, supabasePublicConfigured } from "@/lib/env";

// Browser Supabase client (anon key, RLS-enforced). Used by auth forms and
// signed-in client components. Returns null when not configured so UI can
// degrade gracefully instead of throwing. Imports ONLY public env — no secret
// names reach the client bundle.
export function getBrowserSupabase() {
  if (!supabasePublicConfigured()) return null;
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
