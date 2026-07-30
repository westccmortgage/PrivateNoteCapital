// CSV import engine: parse → map columns → validate → normalize → dedup.
// Pure and dependency-free so it is fully unit-testable without a database
// (see tests/csv.test.ts). The admin route calls these, then upserts by
// (source_name, external_id).

import {
  normalizeState,
  normalizeCounty,
  normalizeZip,
  normalizeLifecycle,
  dedupExternalId,
  evaluateEligibility,
} from "@/lib/normalize";

// ------------------------------ parsing ------------------------------------

/** RFC-4180-ish CSV parser: handles quoted fields, embedded commas/newlines,
 *  and doubled quotes. Returns an array of string arrays (no header handling). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  // last field / row (ignore trailing empty line)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parse into header + records keyed by header name. */
export function parseCsvRecords(text: string): { headers: string[]; records: Record<string, string>[] } {
  const rows = parseCsv(text);
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== "")) // skip blank lines
    .map((r) => {
      const rec: Record<string, string> = {};
      headers.forEach((h, i) => (rec[h] = (r[i] ?? "").trim()));
      return rec;
    });
  return { headers, records };
}

// ------------------------- injection / sanitization ------------------------

/**
 * Neutralize CSV/spreadsheet formula injection. A cell beginning with =, +, -,
 * @, tab, or CR is prefixed with a single quote so Excel/Sheets treats it as
 * text, not a formula. Apply to any text field before it is stored, displayed
 * in a spreadsheet, or re-exported to CSV. Numbers/dates are parsed separately,
 * so this only guards free-text fields (address, county, city, notes, …).
 */
export function neutralizeFormula(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = String(v);
  if (s === "") return "";
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/**
 * Sanitize an uploaded filename for safe storage/display: strip path
 * separators and control characters, collapse whitespace, cap length. Never use
 * a raw client filename in a filesystem path.
 */
export function sanitizeFilename(name: string | null | undefined): string {
  if (!name) return "upload.csv";
  const base = String(name).split(/[\\/]/).pop() || "upload.csv";
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f<>:"/\\|?*]+/g, "_") // control + path-dangerous chars
    .replace(/^\.+/, "") // no leading dots
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "upload.csv").slice(0, 200);
}

// ---------------------------- normalization --------------------------------

export function coerceNumber(v: string | undefined | null): number | null {
  if (v == null) return null;
  const cleaned = v.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Normalize a date-ish string to ISO YYYY-MM-DD, or null. */
export function coerceDate(v: string | undefined | null): string | null {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // US M/D/Y
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const [, mo, d, y] = m;
    const yr = y.length === 2 ? `20${y}` : y;
    return `${yr}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return null;
}

const STAGE_SYNONYMS: Record<string, string> = {
  "pre-foreclosure": "pre_foreclosure",
  preforeclosure: "pre_foreclosure",
  "notice of default": "notice_of_default",
  nod: "notice_of_default",
  "notice of sale": "notice_of_sale",
  nos: "notice_of_sale",
  "lis pendens": "pre_foreclosure",
  auction: "auction",
  "auction scheduled": "auction",
  scheduled: "auction",
  postponed: "postponed",
  cancelled: "cancelled",
  canceled: "cancelled",
  "sold to third party": "sold_third_party",
  "third party": "sold_third_party",
  reo: "reo_bank_owned",
  "bank owned": "reo_bank_owned",
  "bank-owned": "reo_bank_owned",
};

export function normalizeStage(v: string | undefined | null): string | null {
  if (!v) return null;
  const key = v.trim().toLowerCase();
  return STAGE_SYNONYMS[key] ?? null;
}

const TYPE_SYNONYMS: Record<string, string> = {
  sfr: "single_family",
  "single family": "single_family",
  "single-family": "single_family",
  single_family: "single_family",
  condo: "condo",
  condominium: "condo",
  townhouse: "townhouse",
  townhome: "townhouse",
  duplex: "multifamily_2_4",
  triplex: "multifamily_2_4",
  fourplex: "multifamily_2_4",
  "2-4 units": "multifamily_2_4",
  multifamily: "multifamily_5plus",
  "multi-family": "multifamily_5plus",
  apartment: "multifamily_5plus",
  commercial: "commercial",
  land: "land",
  lot: "land",
  vacant: "land",
};

export function normalizePropertyType(v: string | undefined | null): string | null {
  if (!v) return null;
  const key = v.trim().toLowerCase();
  return TYPE_SYNONYMS[key] ?? "other";
}

// ------------------------------ mapping ------------------------------------

// Writable + mapped fields for an import row. Core fields map to columns present
// in migration 0001; rich fields map to optional columns from 0004 (the upsert
// writes only columns that actually exist). Transient/computed fields (marked)
// are never written to the DB as-is.
export interface ImportRow {
  // --- core (0001) ---
  external_id: string;
  source_name: string;
  source_url: string | null;
  source_last_updated_at: string | null;
  state: string;
  county: string | null;
  city: string | null;
  zip: string | null;
  address: string | null;
  apn: string | null;
  property_type: string | null;
  beds: number | null;
  baths: number | null;
  units: number | null;
  square_feet: number | null;
  foreclosure_stage: string | null;
  original_auction_date: string | null;
  current_auction_date: string | null;
  opening_bid: number | null;
  estimated_value: number | null;
  estimated_debt: number | null;
  estimated_equity: number | null;
  occupancy_status: string | null;
  previous_sale_date: string | null;
  previous_sale_price: number | null;
  // --- rich (0004, optional) ---
  latitude: number | null;
  longitude: number | null;
  year_built: number | null;
  lot_size: number | null;
  trustee_name: string | null;
  case_number: string | null;
  notice_type: string | null;
  notice_recording_date: string | null;
  default_date: string | null;
  auction_time: string | null;
  auction_location: string | null;
  unpaid_balance: number | null;
  judgment_amount: number | null;
  assessed_value: number | null;
  estimated_lien_position: string | null;
  source_license_status: string | null;
  // --- transient source inputs (mapped, used to compute, not stored as-is) ---
  status: string | null; // lifecycle source value
  market_value: number | null; // alias into estimated_value
  // --- computed (not mapped) ---
  record_status: string; // published | draft | archived
  eligible: boolean;
  eligibility_reasons: string[];
  source_url_present: boolean;
}

// A column map: canonical field -> source column header.
export type ColumnMap = Partial<Record<keyof ImportRow, string>>;

export interface RejectedRow {
  index: number;
  reasons: string[];
  raw: Record<string, string>;
}

export interface ValidationSummary {
  valid: ImportRow[];
  rejected: RejectedRow[];
  duplicateKeysInFile: string[]; // dedup key seen more than once
  publishable: number; // rows whose computed record_status === 'published'
}

function pick(rec: Record<string, string>, map: ColumnMap, field: keyof ImportRow): string {
  const col = map[field];
  if (!col) return "";
  return (rec[col] ?? "").trim();
}

export interface ValidateOptions {
  publicDisplayAllowed?: boolean; // from the source profile / license
  defaults?: { state?: string; county?: string }; // implicit values for county-specific exports
}

/**
 * Build + validate + normalize records into ImportRows, computing a dedup
 * identity (source record id → APN → address) and a per-row publication status.
 * Dedups within the file. Never fabricates values (missing → null).
 */
export function validateImport(
  records: Record<string, string>[],
  map: ColumnMap,
  sourceName: string,
  opts: ValidateOptions = {},
): ValidationSummary {
  const publicDisplayAllowed = opts.publicDisplayAllowed ?? true;
  const byKey = new Map<string, ImportRow>(); // preserves insertion order; later row wins
  const rejected: RejectedRow[] = [];
  const dupKeys = new Set<string>();

  records.forEach((rec, index) => {
    const reasons: string[] = [];
    const explicitId = pick(rec, map, "external_id");
    // Apply source-profile defaults when the row lacks its own state/county
    // (e.g. a Palm Beach County export is implicitly Palm Beach, FL).
    const state = normalizeState(pick(rec, map, "state")) ?? (opts.defaults?.state ?? null);
    const address = pick(rec, map, "address") || null;
    const county = normalizeCounty(pick(rec, map, "county")) ?? (opts.defaults?.county ?? null);
    const apn = pick(rec, map, "apn") || null;

    // Dedup identity: explicit id, else APN, else normalized address.
    const external_id = dedupExternalId({ external_id: explicitId, state, county, apn, address, zip: pick(rec, map, "zip") });
    if (!external_id) reasons.push("No usable identity (need a record id, APN, or address).");
    if (state !== "CA" && state !== "FL") reasons.push("State must be CA or FL.");
    if (!address && !county) reasons.push("At least one of address or county is required.");

    if (reasons.length || !external_id) {
      rejected.push({ index, reasons: reasons.length ? reasons : ["Invalid row."], raw: rec });
      return;
    }

    // Financial fallbacks (never fabricate; only fall back to a mapped alias).
    const market_value = coerceNumber(pick(rec, map, "market_value"));
    const assessed_value = coerceNumber(pick(rec, map, "assessed_value"));
    let estimated_value = coerceNumber(pick(rec, map, "estimated_value"));
    if (estimated_value == null) estimated_value = market_value ?? assessed_value;

    const unpaid_balance = coerceNumber(pick(rec, map, "unpaid_balance"));
    const judgment_amount = coerceNumber(pick(rec, map, "judgment_amount"));
    let estimated_debt = coerceNumber(pick(rec, map, "estimated_debt"));
    if (estimated_debt == null) estimated_debt = unpaid_balance ?? judgment_amount;

    let estimated_equity = coerceNumber(pick(rec, map, "estimated_equity"));
    if (estimated_equity == null && estimated_value != null && estimated_debt != null) {
      estimated_equity = estimated_value - estimated_debt; // derive only when both exist
    }

    const foreclosure_stage = normalizeStage(pick(rec, map, "foreclosure_stage"));
    const lifecycle = normalizeLifecycle(pick(rec, map, "status") || pick(rec, map, "foreclosure_stage"));
    const elig = evaluateEligibility({
      address, apn, state, county, foreclosure_stage, lifecycle, publicDisplayAllowed,
    });

    const source_url = pick(rec, map, "source_url") || null;
    const row: ImportRow = {
      external_id,
      source_name: sourceName,
      source_url,
      source_last_updated_at: coerceDate(pick(rec, map, "source_last_updated_at")),
      state: state as string,
      county,
      city: pick(rec, map, "city") || null,
      zip: normalizeZip(pick(rec, map, "zip")),
      address,
      apn,
      property_type: pick(rec, map, "property_type") ? normalizePropertyType(pick(rec, map, "property_type")) : null,
      beds: coerceNumber(pick(rec, map, "beds")),
      baths: coerceNumber(pick(rec, map, "baths")),
      units: coerceNumber(pick(rec, map, "units")),
      square_feet: coerceNumber(pick(rec, map, "square_feet")),
      foreclosure_stage,
      original_auction_date: coerceDate(pick(rec, map, "original_auction_date")),
      current_auction_date: coerceDate(pick(rec, map, "current_auction_date")),
      opening_bid: coerceNumber(pick(rec, map, "opening_bid")),
      estimated_value,
      estimated_debt,
      estimated_equity,
      occupancy_status: pick(rec, map, "occupancy_status") || null,
      previous_sale_date: coerceDate(pick(rec, map, "previous_sale_date")),
      previous_sale_price: coerceNumber(pick(rec, map, "previous_sale_price")),
      // rich (0004)
      latitude: coerceNumber(pick(rec, map, "latitude")),
      longitude: coerceNumber(pick(rec, map, "longitude")),
      year_built: coerceNumber(pick(rec, map, "year_built")),
      lot_size: coerceNumber(pick(rec, map, "lot_size")),
      trustee_name: pick(rec, map, "trustee_name") || null,
      case_number: pick(rec, map, "case_number") || null,
      notice_type: pick(rec, map, "notice_type") || null,
      notice_recording_date: coerceDate(pick(rec, map, "notice_recording_date")),
      default_date: coerceDate(pick(rec, map, "default_date")),
      auction_time: pick(rec, map, "auction_time") || null,
      auction_location: pick(rec, map, "auction_location") || null,
      unpaid_balance,
      judgment_amount,
      assessed_value,
      estimated_lien_position: pick(rec, map, "estimated_lien_position") || null,
      source_license_status: pick(rec, map, "source_license_status") || (publicDisplayAllowed ? "public" : "restricted"),
      status: pick(rec, map, "status") || null,
      market_value,
      record_status: elig.status,
      eligible: elig.eligible,
      eligibility_reasons: elig.reasons,
      source_url_present: Boolean(source_url),
    };

    if (byKey.has(external_id)) dupKeys.add(external_id); // duplicate within the file; latest wins
    byKey.set(external_id, row);
  });

  const valid = [...byKey.values()];
  return {
    valid,
    rejected,
    duplicateKeysInFile: [...dupKeys],
    publishable: valid.filter((r) => r.record_status === "published").length,
  };
}
