// Publication-permission logic for collected county records (Section 3).
// Pure + unit-testable. The ONE rule that gates auto-publishing.

import type { PublicationPermission } from "@/lib/providers/types";

/**
 * Only official public records and explicitly contract-authorized feeds may be
 * automatically published. Everything else (review_required / restricted /
 * unknown) is imported but held as draft — never shown in public search.
 */
export function publicDisplayAllowed(p: PublicationPermission): boolean {
  return p === "public_official" || p === "contract_authorized";
}

/** Map a raw source-authority + license situation to a permission state. */
export function permissionFor(opts: {
  official: boolean; // is this an official government source?
  licensed?: boolean; // is there a confirmed redistribution/public-display license?
  reviewRequired?: boolean; // flagged for human review before display?
  restricted?: boolean; // internal-use-only license?
}): PublicationPermission {
  if (opts.restricted) return "restricted";
  if (opts.reviewRequired) return "review_required";
  if (opts.official) return "public_official";
  if (opts.licensed) return "contract_authorized";
  return "unknown";
}
