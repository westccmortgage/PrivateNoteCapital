// Pure normalization + deduplication + publication-eligibility helpers for the
// foreclosure importer. No DB, no I/O — fully unit-testable.

// ------------------------------ identity -----------------------------------

/** APN/parcel: keep only alphanumerics, uppercase. "123-456-789" -> "123456789". */
export function normalizeApn(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s || null;
}

const SUFFIX: Record<string, string> = {
  street: "st", str: "st", st: "st",
  avenue: "ave", av: "ave", ave: "ave",
  boulevard: "blvd", blvd: "blvd",
  drive: "dr", dr: "dr",
  road: "rd", rd: "rd",
  lane: "ln", ln: "ln",
  court: "ct", ct: "ct",
  place: "pl", pl: "pl",
  terrace: "ter", ter: "ter",
  circle: "cir", cir: "cir",
  parkway: "pkwy", pkwy: "pkwy",
  highway: "hwy", hwy: "hwy",
  way: "way",
  north: "n", south: "s", east: "e", west: "w",
  northeast: "ne", northwest: "nw", southeast: "se", southwest: "sw",
};

/** Normalize a street address for dedup: lowercase, drop punctuation, collapse
 *  whitespace, standardize directionals/suffixes, strip unit markers. */
export function normalizeAddress(v: string | null | undefined): string | null {
  if (!v) return null;
  let s = String(v).toLowerCase();
  // Drop unit/apt/suite designators (keep the base street identity).
  s = s.replace(/\b(apt|apartment|unit|ste|suite|#)\s*\S+/g, " ");
  s = s.replace(/[.,]/g, " ").replace(/[^a-z0-9\s]/g, " ");
  const tokens = s.split(/\s+/).filter(Boolean).map((t) => SUFFIX[t] ?? t);
  const out = tokens.join(" ").trim();
  return out || null;
}

export function normalizeZip(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = String(v).match(/\d{5}/);
  return m ? m[0] : null;
}

const STATE_MAP: Record<string, string> = {
  ca: "CA", california: "CA", calif: "CA",
  fl: "FL", florida: "FL", fla: "FL",
};
export function normalizeState(v: string | null | undefined): string | null {
  if (!v) return null;
  const key = String(v).trim().toLowerCase();
  return STATE_MAP[key] ?? (key.length === 2 ? key.toUpperCase() : null);
}

/** County: strip a trailing "county", collapse whitespace, Title Case. */
export function normalizeCounty(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v)
    .replace(/county/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!s) return null;
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Deterministic dedup identity, in preference order:
 *   1. explicit source record id
 *   2. state|county|normalized-APN
 *   3. normalized full address (+ zip when present)
 * Returns null only when there is no usable identity at all.
 */
export function dedupExternalId(row: {
  external_id?: string | null;
  state?: string | null;
  county?: string | null;
  apn?: string | null;
  address?: string | null;
  zip?: string | null;
}): string | null {
  const explicit = (row.external_id ?? "").trim();
  if (explicit) return explicit;

  const apn = normalizeApn(row.apn);
  if (apn) {
    const st = normalizeState(row.state) ?? "";
    const co = normalizeCounty(row.county) ?? "";
    return `apn:${st}:${co}:${apn}`.toLowerCase();
  }

  const addr = normalizeAddress(row.address);
  if (addr) {
    const zip = normalizeZip(row.zip);
    return `addr:${addr}${zip ? ":" + zip : ""}`;
  }
  return null;
}

// ------------------------------ lifecycle ----------------------------------

export type Lifecycle = "active" | "postponed" | "cancelled" | "sold" | "withdrawn";

const LIFECYCLE_MAP: Record<string, Lifecycle> = {
  active: "active", scheduled: "active", open: "active", published: "active",
  postponed: "postponed", rescheduled: "postponed", continued: "postponed",
  cancelled: "cancelled", canceled: "cancelled", rescinded: "cancelled",
  sold: "sold", "sold to third party": "sold", "third party": "sold",
  reo: "sold", "bank owned": "sold", "returned to lender": "sold",
  withdrawn: "withdrawn", removed: "withdrawn", closed: "withdrawn",
};

export function normalizeLifecycle(v: string | null | undefined): Lifecycle {
  if (!v) return "active";
  return LIFECYCLE_MAP[String(v).trim().toLowerCase()] ?? "active";
}

// ------------------------------ eligibility --------------------------------

export interface EligibilityInput {
  address: string | null;
  apn: string | null;
  state: string | null;
  county: string | null;
  foreclosure_stage: string | null;
  lifecycle: Lifecycle;
  publicDisplayAllowed: boolean; // from the source profile / license status
}

export interface Eligibility {
  eligible: boolean;
  status: "published" | "draft" | "archived";
  reasons: string[]; // why NOT eligible (empty when eligible)
}

/**
 * Decide the publication status for a row (Section 6). Publishable only when the
 * record has a usable identity, valid location, a recognized stage, an active
 * lifecycle, and the source license permits public display. Cancelled/sold/
 * withdrawn records are archived (never public). Everything else that fails a
 * check stays draft, with reasons.
 */
export function evaluateEligibility(i: EligibilityInput): Eligibility {
  // Terminal lifecycle -> archived (removed from public search), regardless.
  if (i.lifecycle === "cancelled" || i.lifecycle === "sold" || i.lifecycle === "withdrawn") {
    return { eligible: false, status: "archived", reasons: [`Lifecycle is ${i.lifecycle}.`] };
  }

  const reasons: string[] = [];
  const hasAddress = Boolean(i.address && i.address.trim());
  const hasApn = Boolean(normalizeApn(i.apn));
  if (!hasAddress && !hasApn) reasons.push("No usable address or parcel identity.");
  if (i.state !== "CA" && i.state !== "FL") reasons.push("State must be CA or FL.");
  if (!i.county) reasons.push("County is required.");
  if (!i.foreclosure_stage) reasons.push("A recognized foreclosure stage is required.");
  if (!i.publicDisplayAllowed) reasons.push("Source license does not permit public display.");

  return reasons.length === 0
    ? { eligible: true, status: "published", reasons: [] }
    : { eligible: false, status: "draft", reasons };
}
