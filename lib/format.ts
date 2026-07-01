// Small shared formatting / parsing helpers for the public pages and tools.

export function formatMoney(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(n: number | null, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Number(n.toFixed(digits))}%`;
}

export function formatNumber(n: number | null, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number(n.toFixed(digits)).toLocaleString("en-US");
}

/**
 * Parse a loosely-typed money/number string. Strips $ , % and spaces and
 * understands k / m / mil / million / b suffixes ("500k" -> 500000).
 */
export function parseNum(input: string | undefined | null): number | null {
  if (!input) return null;
  const cleaned = input.replace(/[\s,$%]/g, "").toLowerCase();
  const m = cleaned.match(/^(-?\d*\.?\d+)(k|thousand|mm|mil|million|m|bn|billion|b)?$/);
  if (!m) return null;
  let v = parseFloat(m[1]);
  switch (m[2]) {
    case "k":
    case "thousand":
      v *= 1_000;
      break;
    case "m":
    case "mm":
    case "mil":
    case "million":
      v *= 1_000_000;
      break;
    case "b":
    case "bn":
    case "billion":
      v *= 1_000_000_000;
      break;
  }
  return Number.isFinite(v) ? v : null;
}
