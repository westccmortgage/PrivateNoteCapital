// County sync orchestrator. SERVER ONLY.
//
// Drives one bounded, idempotent, overlap-safe run for a provider:
//   discover → normalize → enrich → persist → reconcile
// with a correlation ID and per-county result. No overlapping run for the same
// county (in-process guard + best-effort DB lock via provider_sync_runs when
// migration 0005 is applied). Logs carry NO secrets and NO owner PII.

import type { SupabaseClient } from "@supabase/supabase-js";
import { persistEvents } from "@/lib/providers/persist";
import { getProvider, allProviders } from "@/lib/providers/registry";
import type { CountyProvider, NormalizedEvent, SyncResult, FetchLike } from "@/lib/providers/types";

const MAX_RECORDS_PER_RUN = 200;
const running = new Set<string>(); // in-process overlap guard

export interface RunOptions {
  limit?: number;
  correlationId?: string;
  fetchImpl?: FetchLike;
  triggeredBy?: string; // "cron" | "admin" | correlation source (no PII)
}

/** Make a correlation id (server runtime; not a workflow script). */
function newCorrelationId(providerId: string): string {
  return `sync_${providerId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyResult(p: CountyProvider, correlationId: string, over: Partial<SyncResult>): SyncResult {
  return {
    county: p.county,
    provider: p.id,
    correlationId,
    ranAt: new Date().toISOString(),
    ok: true,
    configured: false,
    enabled: false,
    received: 0,
    created: 0,
    updated: 0,
    published: 0,
    draft: 0,
    archived: 0,
    deactivated: 0,
    rejected: 0,
    unmatchedParcels: 0,
    reconciliationFlagged: 0,
    ownerActionRequired: null,
    detail: "",
    ...over,
  };
}

/** Run one provider end-to-end. Never throws; failures come back in the result. */
export async function runCountySync(providerId: string, admin: SupabaseClient, opts: RunOptions = {}): Promise<SyncResult> {
  const provider = getProvider(providerId);
  const correlationId = opts.correlationId ?? newCorrelationId(providerId);
  if (!provider) return emptyResult({ id: providerId, county: providerId } as CountyProvider, correlationId, { ok: false, detail: "Unknown provider." });

  // No overlapping run for the same county (in-process).
  if (running.has(provider.id)) {
    return emptyResult(provider, correlationId, { ok: false, enabled: true, configured: true, detail: "A sync for this county is already running." });
  }
  running.add(provider.id);
  const lockId = await acquireDbLock(admin, provider, correlationId, opts.triggeredBy);

  try {
    // Event sync disabled (e.g. LA with no lawful feed) → do NOT fabricate.
    if (!provider.isEventSyncEnabled()) {
      const conn = await provider.testConnection(opts.fetchImpl).catch(() => null);
      const detail = conn?.detail ?? "Event sync not configured.";
      const res = emptyResult(provider, correlationId, {
        configured: Boolean(conn?.configured),
        enabled: false,
        detail,
        ownerActionRequired: conn?.blocker && conn.blocker !== "not_configured" ? detail : `Configure an authorized event source for ${provider.county}.`,
      });
      await finishDbLock(admin, lockId, res);
      return res;
    }

    const limit = Math.min(opts.limit ?? MAX_RECORDS_PER_RUN, MAX_RECORDS_PER_RUN);
    const discovered = await provider.discoverEvents({ limit }, opts.fetchImpl);
    if (!discovered.configured || discovered.blocker) {
      const res = emptyResult(provider, correlationId, {
        configured: discovered.configured,
        enabled: provider.isEventSyncEnabled(),
        ok: discovered.configured,
        received: discovered.records.length,
        detail: discovered.detail,
        ownerActionRequired: discovered.blocker ?? null,
      });
      await finishDbLock(admin, lockId, res);
      return res;
    }

    // Normalize + enrich (bounded).
    const events: NormalizedEvent[] = [];
    let rejected = 0;
    let unmatched = 0;
    for (const raw of discovered.records) {
      const norm = provider.normalizeEvent(raw);
      if (!norm) {
        rejected++;
        continue;
      }
      const enriched = await provider.enrichProperty(norm, opts.fetchImpl);
      if (enriched.enrichment?.attempted && !enriched.enrichment.matched) unmatched++;
      events.push(enriched);
    }

    const eventCounts = tallyEvents(events);
    const result = await persistEvents(admin, {
      county: provider.county,
      provider: provider.id,
      correlationId,
      events,
      received: discovered.records.length,
      rejected,
      unmatchedParcels: unmatched,
      eventCounts,
      detail: discovered.detail,
    });

    // Reconcile records no longer present (flag, never delete).
    const seen = events.map((e) => e.property.external_id);
    const flagged = await provider.reconcileMissingEvents(seen, admin).catch(() => []);
    result.reconciliationFlagged = flagged.length;

    await finishDbLock(admin, lockId, result);
    return result;
  } catch (err) {
    const res = emptyResult(provider, correlationId, {
      ok: false,
      enabled: provider.isEventSyncEnabled(),
      configured: true,
      detail: `Sync error: ${err instanceof Error ? err.message : "unknown"}`,
    });
    await finishDbLock(admin, lockId, res);
    return res;
  } finally {
    running.delete(provider.id);
  }
}

/** Run BOTH counties (the scheduled daily job). LA runs only if its feed is
 *  lawfully configured; otherwise it returns a not-enabled result (no fabrication). */
export async function runAllCounties(admin: SupabaseClient, opts: RunOptions = {}): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const provider of allProviders()) {
    // Sequential: bounded + avoids hammering shared infra. Overlap-guarded.
    results.push(await runCountySync(provider.id, admin, opts));
  }
  return results;
}

function tallyEvents(events: NormalizedEvent[]): Record<string, number> {
  const t: Record<string, number> = { nod: 0, nos: 0, rescission: 0, trustee_deed: 0, scheduled: 0, postponed: 0, cancelled: 0, sold: 0 };
  for (const e of events) {
    switch (e.foreclosureStage) {
      case "notice_of_default":
        t.nod++;
        break;
      case "notice_of_sale":
        t.nos++;
        t.scheduled++;
        break;
      case "auction":
        t.scheduled++;
        break;
      case "postponed":
        t.postponed++;
        break;
      case "cancelled":
        t.cancelled++;
        if (e.lifecycle === "cancelled") t.rescission++;
        break;
      case "sold_third_party":
      case "reo_bank_owned":
        t.sold++;
        t.trustee_deed++;
        break;
    }
  }
  return t;
}

// --------------------------- best-effort DB lock ---------------------------
// provider_sync_runs (migration 0005). When absent, locking is in-process only.

async function acquireDbLock(admin: SupabaseClient, provider: CountyProvider, correlationId: string, triggeredBy?: string): Promise<string | null> {
  try {
    const { data, error } = await admin
      .from("provider_sync_runs")
      .insert({
        provider: provider.id,
        county: provider.county,
        correlation_id: correlationId,
        status: "running",
        triggered_by: triggeredBy ?? "manual",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();
    if (error) return null; // table not present (0005 not applied) → in-process lock only
    return (data?.id as string) ?? null;
  } catch {
    return null;
  }
}

async function finishDbLock(admin: SupabaseClient, lockId: string | null, result: SyncResult): Promise<void> {
  if (!lockId) return;
  try {
    await admin
      .from("provider_sync_runs")
      .update({
        status: result.ok ? "completed" : "error",
        finished_at: new Date().toISOString(),
        received: result.received,
        created: result.created,
        updated: result.updated,
        published: result.published,
        archived: result.archived,
        rejected: result.rejected,
        detail: result.detail.slice(0, 500),
      })
      .eq("id", lockId);
  } catch {
    // best-effort audit; never fail a sync because the lock table update failed
  }
}
