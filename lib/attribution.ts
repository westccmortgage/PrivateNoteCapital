// Read UTM + referrer attribution in the browser, to attach to lead POSTs so
// GRCRM receives campaign context. Safe to call only client-side.
export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const a: Attribution = {};
  const s = p.get("utm_source");
  const m = p.get("utm_medium");
  const c = p.get("utm_campaign");
  if (s) a.utm_source = s;
  if (m) a.utm_medium = m;
  if (c) a.utm_campaign = c;
  // Prefer stored first-touch referrer if we set one, else document.referrer.
  const ref = document.referrer;
  if (ref && !ref.includes(window.location.host)) a.referrer = ref;
  return a;
}
