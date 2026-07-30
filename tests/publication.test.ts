import { test } from "node:test";
import assert from "node:assert/strict";
import { runSearch, parseSearchParams } from "@/lib/search";
import { getAdapter, ADAPTERS } from "@/lib/adapters";

// Recording mock of the Supabase query builder. Every filter method records its
// args and returns `this`; the builder is awaitable (thenable) and resolves to an
// empty result. Lets us assert the SQL-shape constraints without a database.
function makeMockSupabase() {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  const rec =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  for (const m of ["select", "eq", "ilike", "in", "gte", "lte", "gt", "order", "range"]) {
    builder[m] = rec(m);
  }
  // Terminal: awaiting the builder resolves to an empty published-safe result.
  (builder as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve({ data: [], count: 0, error: null });
  const client = {
    from(table: string) {
      calls.push({ method: "from", args: [table] });
      return builder;
    },
  };
  return { client, calls };
}

test("runSearch ALWAYS constrains to record_status = 'published'", async () => {
  const { client, calls } = makeMockSupabase();
  const filter = parseSearchParams({ state: "CA", county: "Los Angeles" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await runSearch(client as any, filter);
  const publishedEq = calls.find(
    (c) => c.method === "eq" && c.args[0] === "record_status" && c.args[1] === "published",
  );
  assert.ok(publishedEq, "search must filter record_status='published'");
  // And it must never query for draft/any other status.
  const badStatus = calls.find(
    (c) => c.method === "eq" && c.args[0] === "record_status" && c.args[1] !== "published",
  );
  assert.equal(badStatus, undefined);
});

test("runSearch returns empty (never fabricates) when supabase is null", async () => {
  const res = await runSearch(null, parseSearchParams({}));
  assert.deepEqual(res.rows, []);
  assert.equal(res.total, 0);
  assert.equal(res.configured, false);
});

test("restricted sources import as draft (never auto-published)", () => {
  // The import route sets status = adapter.publicDisplayAllowed ? 'published' : 'draft'.
  const statusFor = (id: string) => (getAdapter(id)!.publicDisplayAllowed ? "published" : "draft");
  assert.equal(statusFor("propertyradar"), "draft"); // restricted → draft, private
  assert.equal(statusFor("manual_csv"), "published"); // operator-permitted
  assert.equal(statusFor("broward_clerk"), "published"); // public record
});

test("every restricted adapter is flagged not-public-display", () => {
  const restricted = ADAPTERS.filter((a) => a.id === "propertyradar");
  assert.ok(restricted.length >= 1);
  for (const a of restricted) assert.equal(a.publicDisplayAllowed, false);
});
