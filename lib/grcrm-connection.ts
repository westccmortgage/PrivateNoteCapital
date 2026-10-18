/**
 * Move GRCRM receiver tokens into a request HEADER, not the URL.
 *
 * The GRCRM receiver accepts x-lead-token and authorization headers. Keeping
 * tokens in query strings causes disclosure in CDN / Netlify request logs.
 * Supports legacy ?token=... configuration but strips it before fetch.
 */
const TOKEN_RE = /^[0-9a-f]{24}$/;

export interface GrcrmConnection {
  endpointUrl: string;
  token: string;
}

export function parseGrcrmConnection(rawUrl: string, configuredToken = ""): GrcrmConnection | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return null;
    const token = configuredToken || url.searchParams.get("token") || "";
    if (!TOKEN_RE.test(token)) return null;

    // Both legacy and future token-based query aliases must never be passed to fetch.
    for (const key of ["token", "api_key", "apikey", "key"]) {
      url.searchParams.delete(key);
    }
    url.hash = "";
    return { endpointUrl: url.toString(), token };
  } catch {
    return null;
  }
}
