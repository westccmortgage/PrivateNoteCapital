export const GA_ID = "G-ZTBBK1LZ38";

type Gtag = (...args: unknown[]) => void;

/** Fire a GA4 event if the tag is loaded. Never sends form field values. */
export function track(event: string, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof g === "function") g("event", event, params);
}
