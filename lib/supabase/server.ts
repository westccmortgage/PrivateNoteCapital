import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicConfigured } from "@/lib/env";
import { serverEnv, supabaseAdminConfigured } from "@/lib/env.server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cookie-bound server client (anon key + RLS). Reads the signed-in user's
// session in Server Components and Route Handlers. Returns null when unconfigured.
// Next 15: cookies() is async, so this is async too.
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!supabasePublicConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // set() throws in a pure Server Component render — safe to ignore;
          // session refresh still works via middleware/route handlers.
        }
      },
    },
  });
}

// Privileged service-role client. SERVER ONLY — used for imports, interest
// logging, and admin operations. Bypasses RLS. Never expose to the browser.
export function getAdminSupabase(): SupabaseClient | null {
  if (!supabaseAdminConfigured()) return null;
  return createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Resolve the signed-in user (or null) from the cookie-bound client. */
export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Is the current user an admin? Checked against the admin_users table. */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const admin = getAdminSupabase();
  if (!admin) return false;
  const { data } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
}
