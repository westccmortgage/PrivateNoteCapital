// Minimal in-memory rate limiter for public submission endpoints. Keyed by
// client IP + bucket name. This is per-serverless-instance and therefore
// best-effort; for strict multi-instance limits, back it with a shared store
// (Upstash/Redis) — documented in docs/foreclosure-platform-architecture.md.

interface Hit {
  count: number;
  resetAt: number;
}

const store = new Map<string, Hit>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  { limit = 8, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  const now = Date.now();
  const hit = store.get(key);
  if (!hit || hit.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  hit.count += 1;
  if (hit.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((hit.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - hit.count, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || req.headers.get("x-nf-client-connection-ip");
  return (xff?.split(",")[0] || "unknown").trim();
}

// Opportunistic cleanup so the map can't grow unbounded on a long-lived instance.
export function sweep(): void {
  const now = Date.now();
  for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
}
