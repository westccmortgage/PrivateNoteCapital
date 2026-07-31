// Conservative, compliant HTTP client for the county collectors. SERVER ONLY.
//
// Every automated request identifies itself, uses a timeout, backs off on
// transient failure, and caches stable responses. It never bypasses CAPTCHA,
// auth, or rate limits, and never imitates a browser session. Credentials, when
// present, come from server env and are attached by the caller — this helper
// does not log headers or bodies.

import type { FetchLike, FetchLikeResponse } from "@/lib/providers/types";

/** Identifiable agent string so an official source can see exactly who we are. */
export const COLLECTOR_USER_AGENT =
  "PrivateNoteCapital-Collector/1.0 (+https://privatenotecapital.com; foreclosure data collection)";

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number; // default 15s
  retries?: number; // default 2 (transient only)
  backoffMs?: number; // base backoff (default 500ms, exponential)
}

/** The real fetch, wrapped to match FetchLike (so tests can inject a stub). */
export const realFetch: FetchLike = (url, init) =>
  fetch(url, init) as unknown as Promise<FetchLikeResponse>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch with an identifiable UA, timeout, and bounded retry/backoff on transient
 * failures (429/5xx/network). 4xx (except 429) is returned as-is — retrying a
 * hard rejection would be abusive. Throws only after exhausting retries on a
 * network/timeout error.
 */
export async function conservativeFetch(
  url: string,
  opts: FetchOptions = {},
  fetchImpl: FetchLike = realFetch,
): Promise<FetchLikeResponse> {
  const { method = "GET", headers = {}, body, timeoutMs = 15_000, retries = 2, backoffMs = 500 } = opts;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method,
        headers: { "User-Agent": COLLECTOR_USER_AGENT, Accept: "application/json, text/csv, */*", ...headers },
        body,
        signal: controller.signal,
      });
      // Retry only transient statuses; return everything else (incl. 4xx) as-is.
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          await sleep(backoffMs * Math.pow(2, attempt));
          continue;
        }
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(backoffMs * Math.pow(2, attempt));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("request failed");
}

// --------------------------- tiny TTL cache --------------------------------

interface CacheEntry<T> {
  value: T;
  expires: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

/** Cache stable data (e.g. parcel lookups) for `ttlMs`. Deterministic time is
 *  passed in so the module has no ambient clock dependency in tests. */
export async function cached<T>(
  key: string,
  ttlMs: number,
  now: number,
  produce: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value as T;
  const value = await produce();
  cache.set(key, { value, expires: now + ttlMs });
  return value;
}

/** Clear the cache (used by tests). */
export function clearHttpCache(): void {
  cache.clear();
}
