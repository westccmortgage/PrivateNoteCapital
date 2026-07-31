// Netlify scheduled function — the ONE daily job (Section 15). It does no work
// itself; it simply invokes the protected /api/cron/data-sync endpoint on this
// same site with the server-side shared secret. Keeping the logic in the Next
// route means one code path for both scheduled and manual (admin) runs.
//
// Required env (Netlify site settings, server-side only):
//   DATA_SYNC_CRON_SECRET  — must match the value the Next route checks.
//
// Not typechecked by `npm run typecheck` (.mts is outside the tsconfig globs);
// Netlify bundles it separately. No third-party imports, no secrets logged.

export default async () => {
  const base =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.SITE_URL ||
    "https://privatenotecapital.com";
  const secret = process.env.DATA_SYNC_CRON_SECRET || "";
  if (!secret) {
    console.log("[data-sync-daily] DATA_SYNC_CRON_SECRET not set — skipping (no public execution).");
    return new Response("skipped: secret not configured", { status: 200 });
  }
  try {
    const res = await fetch(`${base}/api/cron/data-sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const text = await res.text();
    console.log(`[data-sync-daily] cron endpoint responded ${res.status}`);
    return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[data-sync-daily] failed to invoke cron endpoint:", err instanceof Error ? err.message : "unknown");
    return new Response("error invoking cron endpoint", { status: 502 });
  }
};

// Daily at 09:00 UTC. Keep in sync with SYNC_SCHEDULE_LABEL in lib/providers/status.ts.
export const config = { schedule: "0 9 * * *" };
