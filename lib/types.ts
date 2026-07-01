// Shared types for the CADeed California Deal Intake Terminal (V3).

export type ScenarioStrength =
  | "Strong"
  | "Moderate"
  | "Needs Restructure"
  | "Needs More Info";

export type LienPosition = "1st" | "2nd" | null;

/**
 * Facts extracted from plain-English conversation. The AI only ever fills
 * these — it never computes derived numbers.
 */
export interface ExtractedScenario {
  propertyLocation: string | null;
  propertyState: "CA" | null;
  estimatedValue: number | null; // current "as-is" value
  currentDebt: number | null; // existing first / senior loan balance
  requestedLoanAmount: number | null; // new money requested
  requestedCashOut: number | null;
  purchasePrice: number | null;
  rehabBudget: number | null;
  constructionBudget: number | null; // remaining cost to complete
  arv: number | null; // after-repair / as-complete value
  propertyType: string | null;
  loanPurpose: string | null;
  lienPosition: string | null; // "1st" | "2nd" (stored loosely from AI)
  occupancy: string | null; // Owner-occupied | Investment | Second home
  businessPurpose: string | null; // Business | Consumer
  closingTimeline: string | null;
  exitStrategy: string | null;
  projectStatus: string | null; // construction stage / % complete
  borrowerRole: string | null; // Borrower | Broker | Investor
}

/** A single highlighted leverage metric for the live dashboard. */
export interface PrimaryMetric {
  key: "CLTV" | "LTV" | "LTC" | "ARV-LTV";
  label: string;
  value: number | null;
}

/**
 * When a scenario fits conventional / agency financing better than private
 * capital, we don't dead-end the borrower — we route them to a licensed loan
 * officer at the conventional channel (West Coast Capital Mortgage).
 */
export interface ConventionalReferral {
  recommended: boolean;
  reasons: string[];
  headline: string;
  message: string;
}

/** Deterministic outputs — produced only by lib/deal-calculator.ts. */
export interface CalculatedScenario {
  estimatedLTV: number | null; // new-money LTV
  estimatedCLTV: number | null; // (currentDebt + new money) / value
  estimatedLTC: number | null; // loan-to-cost (purchase + rehab)
  estimatedARVLTV: number | null; // loan-to-ARV / as-complete
  seniorPositionAmount: number | null; // debt/basis ahead of the new money
  totalDebtAfterLoan: number | null;
  equityRemaining: number | null;
  primaryMetric: PrimaryMetric;
  possibleCapitalPath: string;
  capitalPathDescription: string;
  scenarioStrength: ScenarioStrength;
  riskNotes: string[];
  conventionalReferral: ConventionalReferral;
}

/** Flags surfaced for compliance handling and GRCRM routing. */
export interface ComplianceFlags {
  ownerOccupiedFlag: boolean;
  businessPurposeFlag: boolean;
  complianceFlags: string[];
}

/** Criteria GRCRM uses to match a scenario to a capital source's box. */
export interface LenderMatchCriteria {
  maxLTVNeeded: number | null;
  maxCLTVNeeded: number | null;
  requestedLienPosition: string | null;
  propertyType: string | null;
  location: string | null;
  loanAmount: number | null;
  constructionNeeded: boolean;
  ownerOccupied: boolean | null;
  businessPurpose: boolean | null;
  speedNeeded: string | null;
  exitStrategy: string | null;
}

export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface UserContact {
  name?: string;
  email?: string;
  phone?: string;
  role?: string; // Borrower | Broker | Investor
}

/** Response from POST /api/analyze-deal (single-shot). */
export interface AnalyzeDealResponse {
  rawUserInput: string;
  extracted: ExtractedScenario;
  calculated: CalculatedScenario;
  missingInformation: string[];
  nextBestQuestion: string;
  restructureOptions: string[];
  complianceNote: string;
}

/** Response from POST /api/chat-deal (multi-turn). */
export interface ChatDealResponse {
  assistantMessage: string;
  scenarioPatch: Partial<ExtractedScenario>;
  mergedScenario: ExtractedScenario;
  calculated: CalculatedScenario;
  missingInformation: string[];
  nextBestQuestion: string;
  quickReplies: string[];
  restructureOptions: string[];
  compliance: ComplianceFlags;
  recommendedCapitalPath: string;
  lenderMatchCriteria: LenderMatchCriteria;
  canSubmit: boolean;
  complianceNote: string;
}

/** The structured scenario payload sent to GRCRM. */
export interface GRCRMScenarioPayload {
  sourceDomain: "CADeed.com";
  scenarioId: string;
  rawConversation: ChatTurn[];
  rawUserInput: string;
  extractedScenario: ExtractedScenario;
  calculatedScenario: CalculatedScenario;
  missingInformation: string[];
  nextBestQuestion: string;
  consentGiven: boolean;
  consentText: string;
  timestamp: string;
  userContact: UserContact;
  routingStatus: "new";
  complianceFlags: string[];
  ownerOccupiedFlag: boolean;
  businessPurposeFlag: boolean;
  recommendedCapitalPath: string;
  lenderMatchCriteria: LenderMatchCriteria;
}

/** A capital source's lending box, sent to GRCRM as capitalSourceProfile. */
export interface CapitalSourceProfile {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  states: string[];
  counties: string;
  lienPositions: string; // "1st" | "2nd" | "Both"
  maxLTV: number | null;
  maxCLTV: number | null;
  minLoanAmount: number | null;
  maxLoanAmount: number | null;
  propertyTypes: string[];
  programs: string[]; // bridge / cash-out / fix-flip / construction / 2nd deed
  ownerOccupiedAllowed: boolean | null;
  businessPurposeOnly: boolean | null;
  expectedResponseTime: string | null;
  notes: string;
}

export interface CapitalSourcePayload {
  sourceDomain: "CADeed.com";
  type: "capitalSourceProfile";
  profileId: string;
  capitalSourceProfile: CapitalSourceProfile;
  timestamp: string;
  routingStatus: "new";
}

export const COMPLIANCE_NOTE =
  "This is not a loan approval or commitment to lend. All scenarios require " +
  "review by a licensed mortgage professional and/or private capital source. " +
  "Terms, availability, and eligibility depend on property, borrower, " +
  "collateral, documentation, occupancy, purpose, and applicable law.";

/** A fully-empty scenario, used as the merge base. */
export const EMPTY_SCENARIO: ExtractedScenario = {
  propertyLocation: null,
  propertyState: null,
  estimatedValue: null,
  currentDebt: null,
  requestedLoanAmount: null,
  requestedCashOut: null,
  purchasePrice: null,
  rehabBudget: null,
  constructionBudget: null,
  arv: null,
  propertyType: null,
  loanPurpose: null,
  lienPosition: null,
  occupancy: null,
  businessPurpose: null,
  closingTimeline: null,
  exitStrategy: null,
  projectStatus: null,
  borrowerRole: null,
};
