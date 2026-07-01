// Internal baseline guidelines for CADeed scenario reasoning.
//
// Conservative, non-binding heuristics that shape the engine's language —
// capital path, scenario strength, risk notes, follow-up questions. These are
// NOT lender commitments. The engine must never say "approved", quote final
// terms, or promise funding.

import type { ScenarioStrength } from "./types";

/** Leverage comfort bands, expressed as percentages. */
export const LEVERAGE_GUIDELINES = {
  // First deed of trust, evaluated on LTV.
  firstDeed: {
    strongMax: 60, // <= 60% LTV generally strong
    reviewableMax: 65, // 60–65% reviewable
    ceiling: 70, // sometimes to 70% depending on collateral / lender
  },
  // Second deed of trust, evaluated on COMBINED LTV.
  secondDeed: {
    strongMax: 55, // <= 55% CLTV strongest
    reviewableMax: 60, // <= 60% CLTV generally stronger
    ceiling: 65, // 60–65% CLTV possible depending on property / borrower / purpose / exit
  },
  // Purchase + rehab bridge, evaluated on LTC and ARV.
  bridge: {
    ltcCeiling: 85,
    arvCeiling: 70,
  },
} as const;

/** What a construction-completion review needs before it can be placed. */
export const CONSTRUCTION_REQUIREMENTS = [
  "Project stage / percent complete",
  "Permits and approvals status",
  "Remaining budget to complete",
  "Amount already invested",
  "As-is value",
  "As-complete value",
  "Contractor / general contractor status",
  "Exit strategy",
] as const;

export const GUIDELINE_NOTES = {
  firstDeed:
    "1st deed private capital is generally strongest up to ~60–65% LTV, sometimes to ~70% depending on collateral and the specific capital source.",
  secondDeed:
    "2nd deed private capital is evaluated on combined LTV — generally stronger under ~60% CLTV, with ~60–65% possible depending on property, borrower, purpose, and exit.",
  construction:
    "Construction completion requires project stage, permits, remaining budget, amount already invested, as-is value, as-complete value, contractor status, and exit strategy.",
  ownerOccupied:
    "Owner-occupied financing is compliance-sensitive and must be reviewed carefully by a licensed mortgage professional.",
  businessPurpose:
    "Business-purpose / investment-property scenarios are generally more suitable for private capital review.",
} as const;

export interface LeverageVerdict {
  strength: ScenarioStrength;
  notes: string[];
}

/**
 * Grade a leverage figure against the guideline band for the relevant lien
 * position. For a 2nd, pass the CLTV; for a 1st, pass the LTV. Never returns a
 * decline — only a graded strength with notes.
 */
export function gradeLeverage(
  lienPosition: string | null,
  metricPct: number | null,
): LeverageVerdict {
  if (metricPct === null) {
    return { strength: "Needs More Info", notes: [] };
  }

  const isSecond = lienPosition === "2nd";
  const band = isSecond
    ? LEVERAGE_GUIDELINES.secondDeed
    : LEVERAGE_GUIDELINES.firstDeed;
  const metricLabel = isSecond ? "combined LTV" : "LTV";

  if (metricPct <= band.strongMax) {
    return {
      strength: "Strong",
      notes: [
        `Estimated ${metricLabel} of ~${metricPct}% sits within a generally strong private-capital range, subject to review.`,
      ],
    };
  }
  if (metricPct <= band.reviewableMax) {
    return {
      strength: "Moderate",
      notes: [
        `Estimated ${metricLabel} of ~${metricPct}% is within a reviewable range, subject to property, borrower, purpose, and exit.`,
      ],
    };
  }
  if (metricPct <= band.ceiling) {
    return {
      strength: "Moderate",
      notes: [
        `Estimated ${metricLabel} of ~${metricPct}% is near the upper end of typical private-capital tolerance; terms are likely tighter and conditioned on a strong exit.`,
      ],
    };
  }
  return {
    strength: "Needs Restructure",
    notes: [
      `Estimated ${metricLabel} of ~${metricPct}% exceeds the typical private-capital ceiling (~${band.ceiling}%). This scenario may require restructuring rather than a decline.`,
    ],
  };
}
