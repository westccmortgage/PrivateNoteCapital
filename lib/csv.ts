// CSV import engine: parse → map columns → validate → normalize → dedup.
// Pure and dependency-free so it is fully unit-testable without a database
// (see tests/csv.test.ts). The admin route calls these, then upserts by
// (source_name, external_id).

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

// Canonical writable fields for an import row.
export interface ImportRow {
  external_id: string;
  source_name: string;
  source_url: string | null;
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
  duplicateKeysInFile: string[]; // source_name|external_id seen more than once
}

function pick(rec: Record<string, string>, map: ColumnMap, field: keyof ImportRow): string {
  const col = map[field];
  if (!col) return "";
  return (rec[col] ?? "").trim();
}

/** Build + validate + normalize records into ImportRows. Dedups within the file. */
export function validateImport(
  records: Record<string, string>[],
  map: ColumnMap,
  sourceName: string,
): ValidationSummary {
  const byKey = new Map<string, ImportRow>(); // preserves insertion order; later row wins
  const rejected: RejectedRow[] = [];
  const dupKeys = new Set<string>();

  records.forEach((rec, index) => {
    const reasons: string[] = [];
    const external_id = pick(rec, map, "external_id");
    const state = (pick(rec, map, "state") || "").toUpperCase();

    if (!external_id) reasons.push("Missing external_id (required, prevents duplicates).");
    if (state !== "CA" && state !== "FL") reasons.push("state must be CA or FL.");

    const source_url = pick(rec, map, "source_url") || null;
    const address = pick(rec, map, "address") || null;
    const county = pick(rec, map, "county") || null;
    if (!address && !county) reasons.push("At least one of address or county is required.");

    if (reasons.length) {
      rejected.push({ index, reasons, raw: rec });
      return;
    }

    const estimated_value = coerceNumber(pick(rec, map, "estimated_value"));
    const estimated_debt = coerceNumber(pick(rec, map, "estimated_debt"));
    let estimated_equity = coerceNumber(pick(rec, map, "estimated_equity"));
    if (estimated_equity == null && estimated_value != null && estimated_debt != null) {
      estimated_equity = estimated_value - estimated_debt; // derive only when both exist
    }

    const row: ImportRow = {
      external_id,
      source_name: sourceName,
      source_url,
      state,
      county,
      city: pick(rec, map, "city") || null,
      zip: pick(rec, map, "zip") || null,
      address,
      apn: pick(rec, map, "apn") || null,
      property_type: normalizePropertyType(pick(rec, map, "property_type")),
      beds: coerceNumber(pick(rec, map, "beds")),
      baths: coerceNumber(pick(rec, map, "baths")),
      units: coerceNumber(pick(rec, map, "units")),
      square_feet: coerceNumber(pick(rec, map, "square_feet")),
      foreclosure_stage: normalizeStage(pick(rec, map, "foreclosure_stage")),
      original_auction_date: coerceDate(pick(rec, map, "original_auction_date")),
      current_auction_date: coerceDate(pick(rec, map, "current_auction_date")),
      opening_bid: coerceNumber(pick(rec, map, "opening_bid")),
      estimated_value,
      estimated_debt,
      estimated_equity,
      occupancy_status: pick(rec, map, "occupancy_status") || null,
      previous_sale_date: coerceDate(pick(rec, map, "previous_sale_date")),
      previous_sale_price: coerceNumber(pick(rec, map, "previous_sale_price")),
      source_url_present: Boolean(source_url),
    };

    const key = `${sourceName}|${external_id}`;
    if (byKey.has(key)) dupKeys.add(key); // duplicate within the file; latest row wins
    byKey.set(key, row);
  });

  return { valid: [...byKey.values()], rejected, duplicateKeysInFile: [...dupKeys] };
}
