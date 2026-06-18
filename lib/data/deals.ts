import { desc, eq, and } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type DealRow = {
  id: string;
  codeName: string;
  side: string;
  status: string;
  valueCents: string | null;
  region: string;
};

export async function listDeals(session: Session, side?: "buy" | "sell"): Promise<DealRow[]> {
  if (!dbReady) return [];
  const where = side
    ? and(tenantScope(session, s.deals), eq(s.deals.side, side))
    : tenantScope(session, s.deals);
  return db
    .select({
      id: s.deals.id,
      codeName: s.deals.codeName,
      side: s.deals.side,
      status: s.deals.status,
      valueCents: s.deals.valueCents,
      region: s.deals.region,
    })
    .from(s.deals)
    .where(where)
    .orderBy(desc(s.deals.codeName));
}

export type DealDocRow = {
  id: string;
  dealId: string;
  title: string;
  folder: string;
  version: number;
  isCurrent: boolean;
};

export async function listDealDocs(session: Session): Promise<DealDocRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.dealRoomDocs.id,
      dealId: s.dealRoomDocs.dealId,
      title: s.dealRoomDocs.title,
      folder: s.dealRoomDocs.folder,
      version: s.dealRoomDocs.version,
      isCurrent: s.dealRoomDocs.isCurrent,
    })
    .from(s.dealRoomDocs)
    .innerJoin(s.deals, eq(s.deals.id, s.dealRoomDocs.dealId))
    .where(tenantScope(session, s.deals))
    .orderBy(desc(s.dealRoomDocs.title));
}
