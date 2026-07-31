// Provider registry + public source labels. SERVER ONLY (constructs providers
// that read server env). The labels map is safe to import anywhere.

import { PalmBeachForeclosureProvider } from "@/lib/providers/palm-beach";
import { LAEventFeedProvider } from "@/lib/providers/los-angeles";
import type { CountyProvider } from "@/lib/providers/types";

export function allProviders(): CountyProvider[] {
  return [new PalmBeachForeclosureProvider(), new LAEventFeedProvider()];
}

export function getProvider(id: string): CountyProvider | undefined {
  return allProviders().find((p) => p.id === id);
}

/** Human-friendly public source labels for the two collectors (Section 16). */
export const PROVIDER_SOURCE_LABELS: Record<string, string> = {
  palm_beach_county: "Official Palm Beach County records",
  la_county_recorder: "Los Angeles County recorded-document feed",
};
