// Single source of truth for company / licensing / contact details.
// Update here and it propagates across the site (footer, company, legal, CTAs).

export const COMPANY = {
  legalName: "West Coast Capital Mortgage Inc.",
  shortName: "West Coast Capital Mortgage",
  nmls: "2817729",
  phoneOffice: "310-654-1577", // Office / loan-officer questions
  phoneDirect: "310-686-5053", // Anatoliy direct
  email: "westccmortgage@gmail.com",
  mailingAddress: "150 E Olive Ave, Unit 112, Burbank, CA 91502",
} as const;

/** "310-654-1577" -> "tel:+13106541577" */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `tel:+1${digits}`;
}
