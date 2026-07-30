// Server-side validation helpers. Every public POST route validates here before
// touching the database or GRCRM — never trust the client.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Honeypot: a hidden field ("company") that real users never fill. If it has any
// value, the submission is almost certainly a bot. Callers should silently accept
// (return ok) without processing, so bots get no signal.
export function isBotSubmission(body: Record<string, unknown>): boolean {
  const hp = body.company;
  return typeof hp === "string" && hp.trim().length > 0;
}

export function cleanStr(v: unknown, max = 2000): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

export function optNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export interface ValidationResult<T> {
  ok: boolean;
  errors: string[];
  value: T;
}

export interface ContactCore {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function validateContact(body: Record<string, unknown>): ValidationResult<ContactCore> {
  const value: ContactCore = {
    firstName: cleanStr(body.firstName ?? body.first_name, 120),
    lastName: cleanStr(body.lastName ?? body.last_name, 120),
    email: cleanStr(body.email, 200).toLowerCase(),
    phone: cleanStr(body.phone, 40),
  };
  const errors: string[] = [];
  if (!value.firstName && !value.lastName) errors.push("Name is required.");
  if (!EMAIL_RE.test(value.email)) errors.push("A valid email is required.");
  return { ok: errors.length === 0, errors, value };
}

export interface FinancingInput extends ContactCore {
  financingType: string;
  propertyId: string;
  propertyAddress: string;
  state: string;
  purchasePrice: number | null;
  requestedAmount: number | null;
  estimatedRepairs: number | null;
  propertyType: string;
  closingOrAuctionDate: string;
  investorExperience: string;
  notes: string;
}

const FINANCING_VALUES = new Set([
  "auction_acquisition",
  "bridge",
  "fix_and_flip",
  "rehabilitation",
  "dscr_takeout",
  "private_capital",
]);

export function validateFinancing(body: Record<string, unknown>): ValidationResult<FinancingInput> {
  const contact = validateContact(body);
  const financingType = cleanStr(body.financingType, 40);
  const value: FinancingInput = {
    ...contact.value,
    financingType,
    propertyId: cleanStr(body.propertyId, 64),
    propertyAddress: cleanStr(body.propertyAddress, 300),
    state: cleanStr(body.state, 2).toUpperCase(),
    purchasePrice: optNum(body.purchasePrice),
    requestedAmount: optNum(body.requestedAmount),
    estimatedRepairs: optNum(body.estimatedRepairs),
    propertyType: cleanStr(body.propertyType, 40),
    closingOrAuctionDate: cleanStr(body.closingOrAuctionDate, 40),
    investorExperience: cleanStr(body.investorExperience, 40),
    notes: cleanStr(body.notes, 4000),
  };
  const errors = [...contact.errors];
  if (!FINANCING_VALUES.has(financingType)) errors.push("Select a financing type.");
  if (!cleanStr(body.phone)) errors.push("A phone number is required for financing review.");
  return { ok: errors.length === 0, errors, value };
}

export interface WatchlistInput extends ContactCore {
  state: string;
  counties: string[];
  propertyTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  auctionHorizon: string;
  financingType: string;
  investorExperience: string;
  consent: boolean;
}

export function validateWatchlist(body: Record<string, unknown>): ValidationResult<WatchlistInput> {
  const contact = validateContact(body);
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((s) => cleanStr(s, 80)).filter(Boolean) : [];
  const value: WatchlistInput = {
    ...contact.value,
    state: cleanStr(body.state, 2).toUpperCase(),
    counties: arr(body.counties),
    propertyTypes: arr(body.propertyTypes),
    minPrice: optNum(body.minPrice),
    maxPrice: optNum(body.maxPrice),
    auctionHorizon: cleanStr(body.auctionHorizon, 10),
    financingType: cleanStr(body.financingType, 40),
    investorExperience: cleanStr(body.investorExperience, 40),
    consent: body.consent === true || body.consent === "true",
  };
  const errors = [...contact.errors];
  // Explicit opt-in is required before any watchlist is created / sent.
  if (!value.consent) errors.push("Please consent to receive the weekly watchlist.");
  return { ok: errors.length === 0, errors, value };
}
