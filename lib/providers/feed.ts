// Feed parsing for the LA County event-feed receiver. SERVER ONLY.
//
// Supports the automated source formats an official/licensed daily recorder feed
// is delivered in: HTTPS CSV, JSON, XML, and ZIP-containing-CSV/XML. Everything
// here is pure (bytes/string in → records out) so it is fully unit-testable with
// crafted fixtures and never touches the network. No third-party deps: the ZIP
// reader uses Node's built-in zlib.

import zlib from "node:zlib";
import { parseCsvRecords } from "@/lib/csv";
import type { RawSourceRecord } from "@/lib/providers/types";

export type FeedFormat = "csv" | "json" | "xml" | "zip";

/** Parse a CSV feed body into records (header-keyed). */
export function parseCsvFeed(text: string): RawSourceRecord[] {
  const { records } = parseCsvRecords(text);
  return records as RawSourceRecord[];
}

/**
 * Parse a JSON feed. Accepts either a top-level array of objects, or an object
 * with a `records`/`data`/`results`/`documents` array. Non-object entries are
 * dropped.
 */
export function parseJsonFeed(text: string): RawSourceRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const arr = Array.isArray(parsed)
    ? parsed
    : isObj(parsed)
      ? (parsed.records ?? parsed.data ?? parsed.results ?? parsed.documents ?? [])
      : [];
  if (!Array.isArray(arr)) return [];
  return arr.filter(isObj).map((o) => {
    const rec: RawSourceRecord = {};
    for (const [k, v] of Object.entries(o)) {
      rec[k] = v == null ? null : typeof v === "object" ? JSON.stringify(v) : (v as string | number);
    }
    return rec;
  });
}

/**
 * Parse a simple XML feed of records. Recognizes repeated <record>, <document>,
 * <row>, or <item> elements, each containing flat <field>value</field> children.
 * Conservative + dependency-free (regex-based); a strict schema feed should be
 * delivered as CSV/JSON where possible.
 */
export function parseXmlFeed(text: string): RawSourceRecord[] {
  const out: RawSourceRecord[] = [];
  const recordRe = /<(record|document|row|item)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = recordRe.exec(text))) {
    const inner = m[2];
    const rec: RawSourceRecord = {};
    const fieldRe = /<([A-Za-z_][\w.-]*)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let f: RegExpExecArray | null;
    while ((f = fieldRe.exec(inner))) {
      const key = f[1];
      const val = decodeXml(f[2].trim());
      rec[key] = val;
    }
    if (Object.keys(rec).length) out.push(rec);
  }
  return out;
}

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// ------------------------------- ZIP reader --------------------------------

interface ZipEntry {
  name: string;
  data: Buffer;
}

/**
 * Extract entries from a ZIP archive using the central directory. Supports the
 * two methods a daily feed realistically uses: stored (0) and deflate (8).
 * Returns [] if the buffer is not a valid ZIP.
 */
export function unzipEntries(buf: Buffer): ZipEntry[] {
  const EOCD_SIG = 0x06054b50;
  const CEN_SIG = 0x02014b50;
  // Find End Of Central Directory (scan backward; comment may follow).
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return [];
  const total = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16); // central directory offset
  const entries: ZipEntry[] = [];

  for (let n = 0; n < total; n++) {
    if (ptr + 46 > buf.length || buf.readUInt32LE(ptr) !== CEN_SIG) break;
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOff = buf.readUInt32LE(ptr + 42);
    const name = buf.toString("utf8", ptr + 46, ptr + 46 + nameLen);

    // Local header: 30 bytes + name + extra, then data.
    const lhNameLen = buf.readUInt16LE(localOff + 26);
    const lhExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lhNameLen + lhExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    try {
      const data = method === 0 ? Buffer.from(raw) : method === 8 ? zlib.inflateRawSync(raw) : null;
      if (data && !name.endsWith("/")) entries.push({ name, data });
    } catch {
      // skip an unreadable entry
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Parse a ZIP feed: find the first CSV/XML/JSON entry and parse it. */
export function parseZipFeed(buf: Buffer): { records: RawSourceRecord[]; entryName: string | null } {
  const entries = unzipEntries(buf);
  const pick =
    entries.find((e) => /\.csv$/i.test(e.name)) ??
    entries.find((e) => /\.xml$/i.test(e.name)) ??
    entries.find((e) => /\.json$/i.test(e.name)) ??
    entries[0];
  if (!pick) return { records: [], entryName: null };
  const text = pick.data.toString("utf8");
  if (/\.xml$/i.test(pick.name)) return { records: parseXmlFeed(text), entryName: pick.name };
  if (/\.json$/i.test(pick.name)) return { records: parseJsonFeed(text), entryName: pick.name };
  return { records: parseCsvFeed(text), entryName: pick.name };
}

/** Dispatch to the right parser by declared format. `body` is a string for
 *  text formats and a Buffer for zip. */
export function parseFeed(format: FeedFormat, body: string | Buffer): { records: RawSourceRecord[]; entryName: string | null } {
  switch (format) {
    case "csv":
      return { records: parseCsvFeed(String(body)), entryName: null };
    case "json":
      return { records: parseJsonFeed(String(body)), entryName: null };
    case "xml":
      return { records: parseXmlFeed(String(body)), entryName: null };
    case "zip":
      return parseZipFeed(Buffer.isBuffer(body) ? body : Buffer.from(body));
    default:
      return { records: [], entryName: null };
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
