import { NextResponse } from "next/server";
import { isAdmin, getAdminSupabase } from "@/lib/supabase/server";
import { parseCsvRecords, validateImport, sanitizeFilename, type ColumnMap, type ImportRow } from "@/lib/csv";
import { getAdapter } from "@/lib/adapters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB upload cap

// Admin-only CSV import. action=validate previews; action=commit upserts.
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form." }, { status: 400 });

  const action = String(form.get("action") || "validate");
  const sourceId = String(form.get("source") || "");
  const adapter = getAdapter(sourceId);
  if (!adapter) return NextResponse.json({ error: "Unknown source." }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File exceeds 5 MB limit." }, { status: 413 });
  // Validate MIME/extension loosely (browsers vary): accept text/csv or *.csv only.
  const safeName = sanitizeFilename(file.name);
  const looksCsv =
    /\.csv$/i.test(safeName) || file.type === "text/csv" || file.type === "application/vnd.ms-excel" || file.type === "";
  if (!looksCsv) return NextResponse.json({ error: "Only .csv files are accepted." }, { status: 415 });

  const text = await file.text();
  const { headers, records } = parseCsvRecords(text);

  // Column map: caller may override the adapter default.
  let map: ColumnMap = adapter.defaultColumnMap;
  const mapRaw = form.get("columnMap");
  if (typeof mapRaw === "string" && mapRaw.trim()) {
    try {
      map = { ...adapter.defaultColumnMap, ...(JSON.parse(mapRaw) as ColumnMap) };
    } catch {
      return NextResponse.json({ error: "Invalid columnMap JSON." }, { status: 400 });
    }
  }

  const summary = validateImport(records, map, adapter.id);

  if (action === "validate") {
    return NextResponse.json({
      ok: true,
      headers,
      received: records.length,
      valid: summary.valid.length,
      rejected: summary.rejected,
      duplicateKeysInFile: summary.duplicateKeysInFile,
      publicDisplayAllowed: adapter.publicDisplayAllowed,
      preview: summary.valid.slice(0, 10),
    });
  }

  // ---- commit ----
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  // Restricted sources import as draft (never auto-published).
  const status = adapter.publicDisplayAllowed ? "published" : "draft";

  // Preload existing rows to emit auction_events on change + count created/updated.
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
    return toDbRow(r, status);
  });

  const { error: upsertErr } = await admin
    .from("foreclosure_properties")
    .upsert(rowsToUpsert, { onConflict: "source_name,external_id" });
  if (upsertErr) {
    return NextResponse.json({ error: `Import failed: ${upsertErr.message}` }, { status: 500 });
  }
  if (events.length) await admin.from("auction_events").insert(events);

  await admin.from("import_jobs").insert({
    source_name: adapter.id,
    filename: safeName,
    records_received: records.length,
    records_created: created,
    records_updated: updated,
    records_rejected: summary.rejected.length,
    error_log: summary.rejected.slice(0, 200),
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    created,
    updated,
    rejected: summary.rejected.length,
    status,
  });
}

// Map an ImportRow to the DB column set (drops helper fields).
function toDbRow(r: ImportRow, status: string): Record<string, unknown> {
  return {
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
    record_status: status,
    source_last_updated_at: new Date().toISOString(),
  };
}
