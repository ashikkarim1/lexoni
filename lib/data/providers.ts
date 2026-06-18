import { desc, eq, and } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import type { Session } from "@/lib/auth/session";

export type ProviderRow = {
  id: string;
  kind: string;
  name: string;
  region: string;
  expertise: string[] | null;
  industries: string[] | null;
  ratingAvg: string | null;
  pricingFrom: number | null;
  verified: boolean;
};

export async function listProviders(_session: Session, kind?: string): Promise<ProviderRow[]> {
  if (!dbReady) return [];
  const where = kind ? eq(s.providers.kind, kind) : undefined;
  return db
    .select({
      id: s.providers.id,
      kind: s.providers.kind,
      name: s.providers.name,
      region: s.providers.region,
      expertise: s.providers.expertise,
      industries: s.providers.industries,
      ratingAvg: s.providers.ratingAvg,
      pricingFrom: s.providers.pricingFrom,
      verified: s.providers.verified,
    })
    .from(s.providers)
    .where(where)
    .orderBy(desc(s.providers.ratingAvg));
}

void and;
