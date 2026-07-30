// SERVER-ONLY environment access. Holds secrets: the Supabase service-role key
// and the GRCRM webhook URL + signing secret. This module must NEVER be imported
// by a client component. The runtime guard below throws if it is ever evaluated
// in a browser, and — because only server files import it — its identifiers are
// kept out of the client bundle entirely.

import { publicEnv, supabasePublicConfigured } from "./env";

if (typeof window !== "undefined") {
  throw new Error("lib/env.server.ts must not be imported in client-side code.");
}

export const serverEnv = {
  supabaseUrl: publicEnv.supabaseUrl,
  supabaseAnonKey: publicEnv.supabaseAnonKey,
  // Secrets — server only.
  supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE || "",
  grcrmWebhookUrl:
    process.env.GRCRM_LEAD_WEBHOOK_URL || process.env.GRCRM_WEBHOOK_URL || "",
  grcrmWebhookSecret: process.env.GRCRM_WEBHOOK_SECRET || "",
};

/** Is the privileged (service-role) server client configured? */
export function supabaseAdminConfigured(): boolean {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRole);
}

export { supabasePublicConfigured };
