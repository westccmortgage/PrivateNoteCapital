// Central, typed access to environment variables. Nothing here throws at import
// time so the app builds and renders (with graceful empty states) before any
// backend is wired — matching the pre-existing "no-op when unset" philosophy.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  // SERVER ONLY. Never import this into a client component.
  supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE || "",
  grcrmWebhookUrl:
    process.env.GRCRM_LEAD_WEBHOOK_URL || process.env.GRCRM_WEBHOOK_URL || "",
  grcrmWebhookSecret: process.env.GRCRM_WEBHOOK_SECRET || "",
};

/** Is the public (RLS-scoped) Supabase client configured? */
export function supabasePublicConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** Is the privileged (service-role) server client configured? */
export function supabaseAdminConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceRole);
}
