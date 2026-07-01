// Compliance language rules for CADeed.
//
// The engine speaks in "preliminary scenario" terms only. It must never imply
// an approval, decline, guarantee, funding, rate lock, or qualification. This
// module centralizes the forbidden vocabulary, the safe replacements, the
// consent text, and the flag computation used for GRCRM routing.

import { COMPLIANCE_NOTE } from "./types";
import type { ComplianceFlags, ExtractedScenario } from "./types";

export const COMPLIANCE_DISCLAIMER = COMPLIANCE_NOTE;

/** Shown before sending a scenario to GRCRM; the user must accept it. */
export const CONSENT_TEXT =
  "By submitting this scenario, you authorize West Coast Capital Mortgage / " +
  "CADeed to review your information and share it with selected private " +
  "capital sources for financing review. This is not a loan approval or " +
  "commitment to lend.";

/** Caution surfaced whenever a property is owner-occupied / primary residence. */
export const OWNER_OCCUPIED_CAUTION =
  "Owner-occupied scenarios require additional compliance review and may not " +
  "be suitable for all private capital sources.";

export const BUSINESS_PURPOSE_QUESTION =
  "Is this loan for business/investment purpose or personal/consumer purpose?";

/** CAN-SPAM reminder for any capital-source email handled downstream. */
export const CAN_SPAM_NOTE =
  "All email communication must include accurate sender identification, a " +
  "physical mailing address, and opt-out handling inside GRCRM.";

/**
 * Phrases the engine may never present to a user, paired with compliant
 * rewrites. Matching is case-insensitive and word-boundary aware.
 */
const FORBIDDEN_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bpre-?qualif(?:ied|y|ies|ication)\b/gi, replacement: "preliminarily reviewed" },
  { pattern: /\bapproval odds\b/gi, replacement: "preliminary review" },
  { pattern: /\byou'?re approved\b/gi, replacement: "this may be reviewable" },
  { pattern: /\bpre-?approved\b/gi, replacement: "preliminarily reviewed" },
  { pattern: /\bapproval\b/gi, replacement: "preliminary review" },
  { pattern: /\bapproved\b/gi, replacement: "reviewed (preliminary)" },
  { pattern: /\bdeclined\b/gi, replacement: "may require restructuring" },
  { pattern: /\bdenied\b/gi, replacement: "may require restructuring" },
  { pattern: /\bguaranteed\b/gi, replacement: "subject to review" },
  { pattern: /\bguarantee\b/gi, replacement: "preliminary review" },
  { pattern: /\bfully funded\b/gi, replacement: "subject to review" },
  { pattern: /\bfunded\b/gi, replacement: "placed (subject to review)" },
  { pattern: /\brate locked\b/gi, replacement: "subject to review" },
  { pattern: /\brate lock\b/gi, replacement: "subject to review" },
  { pattern: /\blocked\b/gi, replacement: "subject to review" },
  { pattern: /\byou qualify\b/gi, replacement: "this may be reviewable" },
  { pattern: /\byou're qualified\b/gi, replacement: "this may be reviewable" },
  { pattern: /\bqualified\b/gi, replacement: "potentially reviewable" },
  {
    pattern: /\bany loan can be done\b/gi,
    replacement: "scenarios are subject to review",
  },
];

/** Bare forbidden words, for assertions / tests. */
export const FORBIDDEN_TERMS = [
  "approved",
  "approval",
  "declined",
  "denied",
  "guaranteed",
  "guarantee",
  "funded",
  "rate lock",
  "rate locked",
  "you qualify",
  "qualified",
  "any loan can be done",
] as const;

/** A scenario may only be sent to GRCRM after explicit consent. */
export function consentSatisfied(consentGiven: unknown): boolean {
  return consentGiven === true;
}

/** Replace any forbidden language with compliant phrasing. */
export function scrubForbiddenLanguage(text: string): string {
  let out = text;
  for (const { pattern, replacement } of FORBIDDEN_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** Return the list of forbidden terms found in a string (empty if clean). */
export function findForbiddenLanguage(text: string): string[] {
  const found: string[] = [];
  for (const term of FORBIDDEN_TERMS) {
    const re = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) found.push(term);
  }
  return found;
}

function isOwnerOccupied(extracted: ExtractedScenario): boolean {
  const occ = (extracted.occupancy ?? "").toLowerCase();
  return /owner|primary|occupied|residence/.test(occ);
}

function businessPurposeValue(extracted: ExtractedScenario): boolean | null {
  const bp = (extracted.businessPurpose ?? "").toLowerCase();
  if (!bp) return null;
  if (/business|investment|commercial/.test(bp)) return true;
  if (/consumer|personal/.test(bp)) return false;
  return null;
}

/**
 * Compute the compliance flags for a scenario. ownerOccupiedFlag drives the
 * caution banner; businessPurposeFlag and the notes list feed GRCRM routing.
 */
export function computeComplianceFlags(
  extracted: ExtractedScenario,
): ComplianceFlags {
  const flags: string[] = [];
  const ownerOccupiedFlag = isOwnerOccupied(extracted);
  const bp = businessPurposeValue(extracted);
  const businessPurposeFlag = bp === true;

  if (ownerOccupiedFlag) {
    flags.push("OWNER_OCCUPIED_REVIEW_REQUIRED");
  }
  if (bp === false) {
    flags.push("CONSUMER_PURPOSE_HIGH_COMPLIANCE");
  }
  if (bp === null) {
    flags.push("BUSINESS_PURPOSE_UNCONFIRMED");
  }
  if (ownerOccupiedFlag && bp === false) {
    flags.push("OWNER_OCCUPIED_CONSUMER_LICENSED_REVIEW");
  }

  return { ownerOccupiedFlag, businessPurposeFlag, complianceFlags: flags };
}
