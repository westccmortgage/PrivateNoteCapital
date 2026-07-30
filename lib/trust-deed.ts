// Deterministic trust-deed / private-note math + the conservative guidelines and
// the securities disclosures that frame the whole investor site.
//
// IMPORTANT: nothing here is an offer, a solicitation, or a promise of returns.
// The yield illustrator is a neutral arithmetic illustration only.

// ---- Yield illustrator (illustrative only) ---------------------------------

export interface YieldIllustration {
  principal: number;
  annualRatePct: number;
  termMonths: number;
  monthlyIncome: number; // simple interest-only monthly accrual
  totalInterest: number; // over the full term, interest-only
  annualIncome: number;
}

// Generous but sane bounds so the illustration never shows an absurd figure.
const MIN_PRINCIPAL = 1_000;
const MAX_PRINCIPAL = 100_000_000;
const MAX_RATE = 25; // %
const MAX_TERM = 120; // months

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(Math.max(n, lo), hi);
}

/**
 * Interest-only illustration of a trust-deed note: principal × rate, accrued
 * monthly, held for term. Trust-deed notes are typically interest-only with
 * principal returned at payoff — so this models monthly interest income, not
 * compounding or amortization. Illustrative arithmetic ONLY.
 */
export function illustrateYield(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): YieldIllustration {
  const p = clamp(principal, 0, MAX_PRINCIPAL);
  const r = clamp(annualRatePct, 0, MAX_RATE);
  const t = clamp(termMonths, 1, MAX_TERM);
  const annualIncome = (p * r) / 100;
  const monthlyIncome = annualIncome / 12;
  const totalInterest = monthlyIncome * t;
  return {
    principal: p,
    annualRatePct: r,
    termMonths: t,
    monthlyIncome: Math.round(monthlyIncome),
    annualIncome: Math.round(annualIncome),
    totalInterest: Math.round(totalInterest),
  };
}

export const ILLUSTRATOR_BOUNDS = {
  principal: { min: MIN_PRINCIPAL, max: MAX_PRINCIPAL, step: 5_000, default: 250_000 },
  rate: { min: 6, max: MAX_RATE, step: 0.25, default: 9.5 },
  term: { min: 6, max: MAX_TERM, step: 1, default: 12 },
} as const;

// ---- Conservative underwriting guidelines (what we actually require) --------

export interface Guideline {
  title: string;
  body: string;
}

export const UNDERWRITING_GUIDELINES: Guideline[] = [
  {
    title: "Low loan-to-value",
    body: "We target conservative loan-to-value: generally up to about 65% LTV on a 1st deed of trust, lower for more specialized collateral. A meaningful equity cushion sits beneath every note.",
  },
  {
    title: "First-position priority",
    body: "We emphasize 1st-position deeds of trust — the senior, first-to-be-repaid claim against the property. Subordinate positions are considered only selectively and underwritten to combined leverage.",
  },
  {
    title: "Real collateral, in California",
    body: "Every note is secured by recorded real estate in California, which we know well. Title, lien position, and insurance are verified before funding.",
  },
  {
    title: "Documented exit",
    body: "Short-term private notes are underwritten to a clear, realistic repayment exit — sale, refinance, or term payoff — not just to the rate.",
  },
  {
    title: "Business-purpose focus",
    body: "We concentrate on business-purpose / investment-property lending, which is generally better suited to private capital and subject to fewer consumer-protection constraints.",
  },
  {
    title: "Independent valuation & review",
    body: "Property value is supported by independent valuation, and each file is reviewed by licensed professionals before it is ever presented to a capital partner.",
  },
];

// What a capital partner receives with each opportunity.
export const PARTNER_DELIVERABLES: string[] = [
  "Property address, type, and an independent valuation",
  "Loan amount, lien position, and loan-to-value",
  "Borrower business-purpose summary and documented exit",
  "Title, insurance, and recorded deed-of-trust details",
  "Term, rate, and how interest is paid",
];

// ---- Securities / trust-deed disclosures (open-to-all posture) -------------

export const NOT_AN_OFFER =
  "Nothing on this website is an offer to sell, or a solicitation of an offer to buy, " +
  "any security or investment, and nothing here is investment, legal, or tax advice.";

export const RISK_DISCLOSURE =
  "Trust-deed and private-note investments involve risk, including the possible loss of " +
  "principal and of expected income. Real estate values, borrower performance, and market " +
  "conditions can change. Past results do not indicate or guarantee future outcomes. Yields " +
  "are not guaranteed.";

export const SUITABILITY_NOTE =
  "Any investment opportunity, if and when available, is offered only through definitive " +
  "documents and only to investors for whom it is suitable, in accordance with applicable law. " +
  "Requesting information does not create any obligation and is not an agreement to invest.";

export const ILLUSTRATOR_DISCLAIMER =
  "Illustration only. This is a neutral arithmetic example of interest-only income at the inputs " +
  "you choose — not a quote, an offer, a projection, or a promise of any return. Actual terms, " +
  "availability, and outcomes vary and are never guaranteed.";

// Words/phrases the site must never use about returns (scrubbed defensively).
export const FORBIDDEN_RETURN_TERMS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bguaranteed returns?\b/gi, replacement: "potential returns (not guaranteed)" },
  { pattern: /\bguaranteed (?:yield|income|interest)\b/gi, replacement: "potential income (not guaranteed)" },
  { pattern: /\brisk[\s-]?free\b/gi, replacement: "risk-bearing" },
  { pattern: /\bno risk\b/gi, replacement: "risk is involved" },
  { pattern: /\bprincipal[\s-]?protected\b/gi, replacement: "secured by real estate (capital at risk)" },
  { pattern: /\byou will earn\b/gi, replacement: "you may potentially earn" },
  { pattern: /\bsafe investment\b/gi, replacement: "real-estate-secured investment (capital at risk)" },
];

/** Defensive scrub for any investor-facing free text. */
export function scrubReturnLanguage(text: string): string {
  let out = text;
  for (const { pattern, replacement } of FORBIDDEN_RETURN_TERMS) out = out.replace(pattern, replacement);
  return out;
}
