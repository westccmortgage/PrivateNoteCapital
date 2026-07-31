// Persist normalized county events into the EXISTING canonical model. SERVER ONLY.
//
// Reuses the same column-aware upsert as the CSV importer (lib/import-writer),
// the same (source_name, external_id) key, the same auction_events change log,
// and the same import_jobs audit table. No new property/search tables.
//
// Idempotent: re-running a day's sync updates rows in place (saved + inquiry
// relationships preserved) and emits change events only when a value actually
// changed. Cancelled/sold/withdrawn events land as record_status='archived' and
// disappear from public search without being deleted.

import type { SupabaseClient } from "@supabase/supabase-js";
import { liveColumns, toDbRow, providerMetaLive } from "@/lib/import-writer";
import type { NormalizedEvent, SyncResult } from "@/lib/providers/types";

export interface PersistInput {
  county: string;
  provider: string; // source_name
  correlationId: string;
  events: NormalizedEvent[];
  received: number; // raw records discovered (before normalize/reject)
  rejected: number;
  unmatchedParcels: number;
  eventCounts?: Record<string, number>;
  ownerActionRequired?: string | null;
  detail: string;
  filename?: string | null; // for the import_jobs audit (e.g. feed file name)
}

/**
 * Upsert a batch of normalized events. Never throws on a per-row basis; a DB
 * error aborts the batch and is returned in `detail`. Logs carry NO PII/secrets.
 */
export async function persistEvents(admin: SupabaseClient, input: PersistInput): Promise<SyncResult> {
  const ranAt = new Date().toISOString();
  const base: SyncResult = {
    county: input.county,
    provider: input.provider,
    correlationId: input.correlationId,
    ranAt,
    ok: false,
    configured: true,
    enabled: true,
    received: input.received,
    created: 0,
    updated: 0,
    published: 0,
    draft: 0,
    archived: 0,
    deactivated: 0,
    rejected: input.rejected,
    unmatchedParcels: input.unmatchedParcels,
    reconciliationFlagged: 0,
    ownerActionRequired: input.ownerActionRequired ?? null,
    detail: input.detail,
    events: input.eventCounts,
  };

  const rows = input.events.map((e) => e.property);
  if (rows.length === 0) {
    base.ok = true;
    await writeAudit(admin, input, 0, 0);
    return base;
  }

  const cols = await liveColumns(admin);
  const nowIso = ranAt;

  // Preload existing rows for change detection + created/updated counting.
  const extIds = rows.map((r) => r.external_id);
  const { data: existing } = await admin
    .from("foreclosure_properties")
    .select("id, external_id, current_auction_date, opening_bid, foreclosure_stage, record_status")
    .eq("source_name", input.provider)
    .in("external_id", extIds.length ? extIds : ["__none__"]);
  const existingByExt = new Map((existing ?? []).map((e) => [e.external_id as string, e]));

  const changeEvents: Record<string, unknown>[] = [];
  const upsertRows = rows.map((r) => {
    const prior = existingByExt.get(r.external_id);
    if (prior) {
      base.updated++;
      // Auction date change → postponed/scheduled event.
      if (prior.current_auction_date !== r.current_auction_date && r.current_auction_date) {
        changeEvents.push({
          property_id: prior.id,
          event_type: prior.current_auction_date ? "auction_postponed" : "auction_scheduled",
          event_date: r.current_auction_date,
          previous_value: prior.current_auction_date ?? null,
          new_value: r.current_auction_date,
          source_name: input.provider,
          source_url: r.source_url,
        });
      }
      // Stage transition (e.g. NOD → NOS, or → cancelled/sold).
      if (prior.foreclosure_stage !== r.foreclosure_stage && r.foreclosure_stage) {
        changeEvents.push({
          property_id: prior.id,
          event_type: stageEventType(r.foreclosure_stage),
          previous_value: (prior.foreclosure_stage as string) ?? null,
          new_value: r.foreclosure_stage,
          source_name: input.provider,
          source_url: r.source_url,
        });
      }
      // Opening-bid change.
      if (prior.opening_bid != null && r.opening_bid != null && Number(prior.opening_bid) !== r.opening_bid) {
        changeEvents.push({
          property_id: prior.id,
          event_type: "opening_bid_changed",
          previous_value: String(prior.opening_bid),
          new_value: String(r.opening_bid),
          source_name: input.provider,
          source_url: r.source_url,
        });
      }
    } else {
      base.created++;
    }
    // Tally publication status.
    if (r.record_status === "published") base.published++;
    else if (r.record_status === "archived") base.archived++;
    else base.draft++;
    return toDbRow(r, cols, nowIso);
  });
  base.deactivated = base.archived;

  const { error: upsertErr } = await admin
    .from("foreclosure_properties")
    .upsert(upsertRows, { onConflict: "source_name,external_id" });
  if (upsertErr) {
    base.detail = `Upsert failed: ${upsertErr.message}`;
    return base;
  }
  if (changeEvents.length) await admin.from("auction_events").insert(changeEvents);

  await writeAudit(admin, input, base.created, base.updated);
  base.ok = true;
  if (!providerMetaLive(cols)) {
    base.detail += " (provider metadata columns not applied — migration 0005 optional).";
  }
  return base;
}

function stageEventType(stage: string): string {
  switch (stage) {
    case "cancelled":
      return "auction_cancelled";
    case "postponed":
      return "auction_postponed";
    case "sold_third_party":
      return "sold_to_third_party";
    case "reo_bank_owned":
      return "returned_to_lender";
    case "auction":
    case "notice_of_sale":
      return "auction_scheduled";
    default:
      return "new_filing";
  }
}

async function writeAudit(admin: SupabaseClient, input: PersistInput, created: number, updated: number): Promise<void> {
  await admin.from("import_jobs").insert({
    source_name: input.provider,
    filename: input.filename ?? `auto-sync:${input.correlationId}`,
    records_received: input.received,
    records_created: created,
    records_updated: updated,
    records_rejected: input.rejected,
    error_log: [],
    completed_at: new Date().toISOString(),
  });
}

/**
 * Reconcile: published rows for this source that were NOT seen in the latest pull
 * and haven't been seen for `staleDays`+ are FLAGGED (returned) — never deleted.
 * Flagging keeps saved/inquiry relationships intact; the owner decides on removal.
 */
export async function reconcileMissing(
  admin: SupabaseClient,
  provider: string,
  seenExternalIds: string[],
  staleDays = 3,
): Promise<string[]> {
  const cutoff = new Date(Date.now() - staleDays * 86_400_000).toISOString();
  // Only meaningful when last_seen_at exists (migration 0004). Guard the select.
  const probe = await admin.from("foreclosure_properties").select("last_seen_at").limit(1);
  if (probe.error) return []; // no last_seen_at column → cannot reconcile by staleness
  let q = admin
    .from("foreclosure_properties")
    .select("external_id")
    .eq("source_name", provider)
    .eq("record_status", "published")
    .lt("last_seen_at", cutoff);
  if (seenExternalIds.length) {
    q = q.not("external_id", "in", `(${seenExternalIds.map((id) => `"${id}"`).join(",")})`);
  }
  const { data } = await q.limit(500);
  return (data ?? []).map((r) => r.external_id as string);
}
