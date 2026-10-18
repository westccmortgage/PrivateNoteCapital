// Provider registry + public source labels. SERVER ONLY (constructs providers
// that read server env). The labels map is safe to import anywhere.

import { PalmBeachForeclosureProvider } from "@/lib/providers/palm-beach";
import type { CountyProvider } from "@/lib/providers/types";

export function allProviders(): CountyProvider[] {
  return [new PalmBeachForeclosureProvider()];
}

export function getProvider(id: string): CountyProvider | undefined {
  return allProviders().find((p) => p.id === id);
}

/** Only Florida foreclosure event sources are enabled for this product. */
export const PROVIDER_SOURCE_LABELS: Record<string, string> = {
  palm_beach_county: "Official Palm Beach County records",
};
