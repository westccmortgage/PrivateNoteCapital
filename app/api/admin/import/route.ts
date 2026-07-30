import { NextResponse } from "next/server";
import { isAdmin, getAdminSupabase } from "@/lib/supabase/server";
import { parseCsvRecords, validateImport, sanitizeFilename, type ColumnMap, type ImportRow } from "@/lib/csv";
import { getAdapter } from "@/lib/adapters";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB upload cap

// All fields the importer may write. The upsert is filtered to the columns that
// actually exist in the live table, so it works whether or not migration 0004
// (rich fields) has been applied.
const ALL_DB_FIELDS = [
  "external_id", "source_name", "source_url", "state", "county", "city", "zip",
  "address", "apn", "property_type", "beds", "baths", "units", "square_feet",
  "foreclosure_stage", "original_auction_date", "current_auction_date", "opening_bid",
  "estimated_value", "estimated_debt", "estimated_equity", "occupancy_status",
  "previous_sale_date", "previous_sale_price", "record_status", "source_last_updated_at",
  // 0004 (optional)
  "latitude", "longitude", "year_built", "lot_size", "trustee_name", "case_number",
  "notice_type", "notice_recording_date", "default_date", "auction_time", "auction_location",
  "unpaid_balance", "judgment_amount", "assessed_value", "estimated_lien_position",
  "source_license_status", "last_seen_at",
] as const;

/** Which of our writable columns actually exist in the live table, so migration
 *  0004 is optional. Probe a representative 0004 column: if the select succeeds,
 *  the rich columns are present; otherwise fall back to the core (0001) set. */
async function liveColumns(admin: SupabaseClient): Promise<Set<string>> {
  const core = ALL_DB_FIELDS.filter((f) => !RICH_FIELDS.has(f));
  const { error } = await admin.from("foreclosure_properties").select("last_seen_at").limit(1);
  if (error) return new Set(core); // 0004 not applied → core columns only
  return new Set(ALL_DB_FIELDS); // 0004 applied → include rich columns
}

const RICH_FIELDS = new Set<string>([
  "latitude", "longitude", "year_built", "lot_size", "trustee_name", "case_number",
  "notice_type", "notice_recording_date", "default_date", "auction_time", "auction_location",
  "unpaid_balance", "judgment_amount", "assessed_value", "estimated_lien_position",
  "source_license_status", "last_seen_at",
]);

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form." }, { status: 400 });

  const action = String(form.get("action") || "validate");
  const admin = getAdminSupabase();

  // ---- bulk publish: publish all currently-eligible draft rows for a source ----
  if (action === "publish_eligible") {
    if (!admin) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    const src = String(form.get("source") || "");
    // Publish drafts that have the minimum publishable identity + active state.
    const { data, error } = await admin
      .from("foreclosure_properties")
      .update({ record_status: "published" })
      .eq("source_name", src)
      .eq("record_status", "draft")
      .not("county", "is", null)
      .not("foreclosure_stage", "is", null)
      .not("address", "is", null)
      .select("id");
    if (error) return NextResponse.json({ error: `Publish failed: ${error.message}` }, { status: 500 });
    return NextResponse.json({ ok: true, published: (data ?? []).length });
  }

  const sourceId = String(form.get("source") || "");
  const adapter = getAdapter(sourceId);
  if (!adapter) return NextResponse.json({ error: "Unknown source." }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File exceeds 5 MB limit." }, { status: 413 });
  const safeName = sanitizeFilename(file.name);
  const looksCsv =
    /\.csv$/i.test(safeName) || file.type === "text/csv" || file.type === "application/vnd.ms-excel" || file.type === "";
  if (!looksCsv) return NextResponse.json({ error: "Only .csv files are accepted." }, { status: 415 });

  const text = await file.text();
  const { headers, records } = parseCsvRecords(text);

  let map: ColumnMap = adapter.defaultColumnMap;
  const mapRaw = form.get("columnMap");
  if (typeof mapRaw === "string" && mapRaw.trim()) {
    try {
      map = { ...adapter.defaultColumnMap, ...(JSON.parse(mapRaw) as ColumnMap) };
    } catch {
      return NextResponse.json({ error: "Invalid columnMap JSON." }, { status: 400 });
    }
  }

  // Per-row publication status is computed from eligibility + the source license.
  const summary = validateImport(records, map, adapter.id, {
    publicDisplayAllowed: adapter.publicDisplayAllowed,
    defaults: adapter.defaults,
  });
  const publishable = summary.valid.filter((r) => r.record_status === "published").length;
  const draft = summary.valid.filter((r) => r.record_status === "draft").length;
  const archived = summary.valid.filter((r) => r.record_status === "archived").length;

  if (action === "validate") {
    return NextResponse.json({
      ok: true,
      headers,
      received: records.length,
      valid: summary.valid.length,
      publishable,
      draft,
      archived,
      rejected: summary.rejected,
      duplicateKeysInFile: summary.duplicateKeysInFile,
      publicDisplayAllowed: adapter.publicDisplayAllowed,
      // Preview: identity + key fields + why-not-eligible reasons.
      preview: summary.valid.slice(0, 15).map((r) => ({
        external_id: r.external_id,
        address: r.address,
        city: r.city,
        county: r.county,
        state: r.state,
        current_auction_date: r.current_auction_date,
        opening_bid: r.opening_bid,
        foreclosure_stage: r.foreclosure_stage,
        record_status: r.record_status,
        eligible: r.eligible,
        eligibility_reasons: r.eligibility_reasons,
      })),
    });
  }

  // ---- commit ----
  if (!admin) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const withdrawStale = String(form.get("withdrawStale") || "") === "true";
  const cols = await liveColumns(admin);
  const nowIso = new Date().toISOString();

  // Preload existing rows for this source to count created/updated + emit events.
  const extIds = summary.valid.map((r) => r.external_id);
  const { data: existing } = await admin
    .from("foreclosure_properties")
    .select("id, external_id, current_auction_date, opening_bid")
    .eq("source_name", adapter.id)
    .in("external_id", extIds.length ? extIds : ["__none__"]);
  const existingByExt = new Map((existing ?? []).map((e) => [e.external_id as string, e]));

  let created = 0;
  let updated = 0;
  const events: Record<string, unknown>[] = [];

  const rowsToUpsert = summary.valid.map((r) => {
    const prior = existingByExt.get(r.external_id);
    if (prior) {
      updated++;
      if (prior.current_auction_date !== r.current_auction_date && r.current_auction_date) {
        events.push({
          property_id: prior.id,
          event_type: prior.current_auction_date ? "auction_postponed" : "auction_scheduled",
          event_date: r.current_auction_date,
          previous_value: prior.current_auction_date ?? null,
          new_value: r.current_auction_date,
          source_name: adapter.id,
          source_url: r.source_url,
        });
      }
      if (prior.opening_bid != null && r.opening_bid != null && Number(prior.opening_bid) !== r.opening_bid) {
        events.push({
          property_id: prior.id,
          event_type: "opening_bid_changed",
          previous_value: String(prior.opening_bid),
          new_value: String(r.opening_bid),
          source_name: adapter.id,
          source_url: r.source_url,
        });
      }
    } else {
      created++;
    }
    return toDbRow(r, cols, nowIso);
  });

  const { error: upsertErr } = await admin
    .from("foreclosure_properties")
    .upsert(rowsToUpsert, { onConflict: "source_name,external_id" });
  if (upsertErr) {
    return NextResponse.json({ error: `Import failed: ${upsertErr.message}` }, { status: 500 });
  }
  if (events.length) await admin.from("auction_events").insert(events);

  // Stale withdrawal (opt-in): archive published rows from this source that were
  // NOT in this file (never delete — saved/inquiry relationships are preserved).
  let withdrawn = 0;
  if (withdrawStale && extIds.length) {
    const { data: staleRows } = await admin
      .from("foreclosure_properties")
      .update({ record_status: "archived" })
      .eq("source_name", adapter.id)
      .eq("record_status", "published")
      .not("external_id", "in", `(${extIds.map((id) => `"${id}"`).join(",")})`)
      .select("id");
    withdrawn = (staleRows ?? []).length;
  }

  await admin.from("import_jobs").insert({
    source_name: adapter.id,
    filename: safeName,
    records_received: records.length,
    records_created: created,
    records_updated: updated,
    records_rejected: summary.rejected.length,
    error_log: summary.rejected.slice(0, 200),
    completed_at: nowIso,
  });

  return NextResponse.json({
    ok: true,
    received: records.length,
    accepted: summary.valid.length,
    created,
    updated,
    duplicates: summary.duplicateKeysInFile.length,
    rejected: summary.rejected.length,
    published: publishable,
    draft,
    archived,
    withdrawn,
    richFieldsWritten: [...RICH_FIELDS].some((f) => cols.has(f)),
  });
}

// Map an ImportRow to the DB payload, keeping ONLY columns that exist in the live
// table (so 0004 is optional). Publication status is the row's computed status.
function toDbRow(r: ImportRow, cols: Set<string>, nowIso: string): Record<string, unknown> {
  const full: Record<string, unknown> = {
    external_id: r.external_id,
    source_name: r.source_name,
    source_url: r.source_url,
    state: r.state,
    county: r.county,
    city: r.city,
    zip: r.zip,
    address: r.address,
    apn: r.apn,
    property_type: r.property_type,
    beds: r.beds,
    baths: r.baths,
    units: r.units,
    square_feet: r.square_feet,
    foreclosure_stage: r.foreclosure_stage,
    original_auction_date: r.original_auction_date,
    current_auction_date: r.current_auction_date,
    opening_bid: r.opening_bid,
    estimated_value: r.estimated_value,
    estimated_debt: r.estimated_debt,
    estimated_equity: r.estimated_equity,
    occupancy_status: r.occupancy_status,
    previous_sale_date: r.previous_sale_date,
    previous_sale_price: r.previous_sale_price,
    record_status: r.record_status,
    source_last_updated_at: r.source_last_updated_at ?? nowIso,
    // rich (0004) — filtered out below if the columns don't exist yet
    latitude: r.latitude,
    longitude: r.longitude,
    year_built: r.year_built,
    lot_size: r.lot_size,
    trustee_name: r.trustee_name,
    case_number: r.case_number,
    notice_type: r.notice_type,
    notice_recording_date: r.notice_recording_date,
    default_date: r.default_date,
    auction_time: r.auction_time,
    auction_location: r.auction_location,
    unpaid_balance: r.unpaid_balance,
    judgment_amount: r.judgment_amount,
    assessed_value: r.assessed_value,
    estimated_lien_position: r.estimated_lien_position,
    source_license_status: r.source_license_status,
    last_seen_at: nowIso,
  };
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(full)) {
    if (cols.has(k)) out[k] = full[k];
  }
  return out;
}
