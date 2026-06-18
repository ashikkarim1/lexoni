/**
 * Firm-branding read layer. Stable import path for pages so they don't
 * reach into `@/lib/mock`. The mock is the canonical demo default; once
 * `firm_branding` rows exist, swap to a Drizzle query resolved by host.
 */
import { firmBranding as mockBranding } from "@/lib/mock";

export type FirmBrand = typeof mockBranding;

export async function getFirmBrandingByHost(_host?: string | null): Promise<FirmBrand> {
  return mockBranding;
}
