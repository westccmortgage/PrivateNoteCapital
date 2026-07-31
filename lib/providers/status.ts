// Admin status assembly for /admin/data-sync. SERVER ONLY. Config + last-run
// only (no network) — a live connection test is an explicit on-demand action.

import type { SupabaseClient } from "@supabase/supabase-js";
import { allProviders } from "@/lib/providers/registry";
import { serverEnv } from "@/lib/env.server";
import { LAAssessorEnrichmentProvider, FEED_REQUIREMENT } from "@/lib/providers/los-angeles";

/** Documented daily schedule (kept in sync with netlify.toml scheduled function). */
export const SYNC_SCHEDULE_LABEL = "Daily · 09:00 UTC";

export interface LastRun {
  status: string;
  correlationId: string;
  received: number;
  created: number;
  updated: number;
  published: number;
  archived: number;
  rejected: number;
  startedAt: string;
  finishedAt: string | null;
  detail: string | null;
}

export interface CountyStatus {
  id: string;
  county: string;
  state: string;
  label: string;
  eventSyncEnabled: boolean;
  enrichmentConfigured: boolean;
  nextRun: string;
  ownerActionRequired: string | null;
  lastRun: LastRun | null;
  lastSuccessAt: string | null;
}

export async function getCountyStatuses(admin: SupabaseClient | null): Promise<CountyStatus[]> {
  const assessor = new LAAssessorEnrichmentProvider();
  const out: CountyStatus[] = [];

  for (const p of allProviders()) {
    const eventSyncEnabled = p.isEventSyncEnabled();
    const isLA = p.id === "la_county_recorder";
    const enrichmentConfigured = isLA
      ? assessor.isConfigured()
      : Boolean(serverEnv.palmBeach.parcelArcgisUrl);

    let ownerAction: string | null = null;
    if (!eventSyncEnabled) {
      ownerAction = isLA
        ? FEED_REQUIREMENT
        : "Configure an authorized Palm Beach Clerk auction/ClerkCart report URL (PBC_AUCTION_REPORT_URL).";
    }

    const { lastRun, lastSuccessAt } = await loadLastRun(admin, p.id);

    out.push({
      id: p.id,
      county: p.county,
      state: p.state,
      label: p.label,
      eventSyncEnabled,
      enrichmentConfigured,
      nextRun: eventSyncEnabled ? SYNC_SCHEDULE_LABEL : "Disabled until configured",
      ownerActionRequired: ownerAction,
      lastRun,
      lastSuccessAt,
    });
  }
  return out;
}

async function loadLastRun(admin: SupabaseClient | null, provider: string): Promise<{ lastRun: LastRun | null; lastSuccessAt: string | null }> {
  if (!admin) return { lastRun: null, lastSuccessAt: null };
  try {
    const { data, error } = await admin
      .from("provider_sync_runs")
      .select("status, correlation_id, received, created, updated, published, archived, rejected, started_at, finished_at, detail")
      .eq("provider", provider)
      .order("started_at", { ascending: false })
      .limit(10);
    if (error || !data?.length) return { lastRun: null, lastSuccessAt: null };
    const latest = data[0];
    const lastSuccess = data.find((r) => r.status === "completed");
    return {
      lastRun: {
        status: latest.status as string,
        correlationId: latest.correlation_id as string,
        received: (latest.received as number) ?? 0,
        created: (latest.created as number) ?? 0,
        updated: (latest.updated as number) ?? 0,
        published: (latest.published as number) ?? 0,
        archived: (latest.archived as number) ?? 0,
        rejected: (latest.rejected as number) ?? 0,
        startedAt: latest.started_at as string,
        finishedAt: (latest.finished_at as string) ?? null,
        detail: (latest.detail as string) ?? null,
      },
      lastSuccessAt: (lastSuccess?.finished_at as string) ?? null,
    };
  } catch {
    return { lastRun: null, lastSuccessAt: null };
  }
}
