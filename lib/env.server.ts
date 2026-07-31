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

  // --- County collectors (Palm Beach + Los Angeles). All server-only. ---------
  // These read process.env at ACCESS time (getters) so a config change takes
  // effect without a rebuild, and so tests can vary the config per-case.

  // Shared secret protecting the scheduled sync endpoint from public execution.
  get dataSyncCronSecret(): string {
    return process.env.DATA_SYNC_CRON_SECRET || "";
  },

  // Palm Beach County (FL) — PRIMARY live collector.
  //  - Parcel enrichment: official Property Appraiser ArcGIS FeatureServer (no
  //    credentials; a public service URL is configuration, not a secret).
  //  - Event source: an AUTHORIZED machine-readable auction/ClerkCart report URL.
  //    Left blank until the owner confirms terms + provides the authorized URL.
  get palmBeach() {
    return {
      parcelArcgisUrl: process.env.PBC_PARCEL_ARCGIS_URL || "",
      eventSourceUrl: process.env.PBC_AUCTION_REPORT_URL || "",
      eventSourceType: (process.env.PBC_AUCTION_SOURCE_TYPE || "csv").toLowerCase(), // csv | json
      eventSourceToken: process.env.PBC_AUCTION_REPORT_TOKEN || "", // ?token= or Bearer; never logged
      publicationAllowed: (process.env.PBC_PUBLICATION_ALLOWED || "true").toLowerCase() !== "false",
    };
  },

  // Los Angeles County (CA) — event feed stays DISABLED until an authorized
  // Recorder/NOD-NOS feed is configured. Assessor enrichment may run standalone.
  get la() {
    return {
      feedType: (process.env.LA_FORECLOSURE_FEED_TYPE || "").toLowerCase(), // csv | json | xml | zip | sftp
      feedUrl: process.env.LA_FORECLOSURE_FEED_URL || "",
      feedUsername: process.env.LA_FORECLOSURE_FEED_USERNAME || "",
      feedPassword: process.env.LA_FORECLOSURE_FEED_PASSWORD || "",
      feedSftpHost: process.env.LA_FORECLOSURE_FEED_SFTP_HOST || "",
      feedSftpPath: process.env.LA_FORECLOSURE_FEED_SFTP_PATH || "",
      publicationAllowed: (process.env.LA_FORECLOSURE_FEED_PUBLICATION_ALLOWED || "false").toLowerCase() === "true",
      timezone: process.env.LA_FORECLOSURE_FEED_TIMEZONE || "America/Los_Angeles",
      assessorArcgisUrl: process.env.LA_ASSESSOR_ARCGIS_URL || "",
    };
  },
};

/** Is the privileged (service-role) server client configured? */
export function supabaseAdminConfigured(): boolean {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRole);
}

export { supabasePublicConfigured };
