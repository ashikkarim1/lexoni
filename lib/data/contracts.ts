/**
 * Contracts + obligations + renewals + risk read layer. All tenant-scoped.
 */
import { desc, eq, gt, lt, and } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type ContractRow = {
  id: string;
  title: string;
  kind: string;
  counterparty: string | null;
  status: string;
  region: string;
  governingLaw: string | null;
  effectiveDate: Date | null;
  expiryDate: Date | null;
  riskScore: number | null;
};

export async function listContracts(session: Session): Promise<ContractRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.contracts.id,
      title: s.contracts.title,
      kind: s.contracts.kind,
      counterparty: s.contracts.counterparty,
      status: s.contracts.status,
      region: s.contracts.region,
      governingLaw: s.contracts.governingLaw,
      effectiveDate: s.contracts.effectiveDate,
      expiryDate: s.contracts.expiryDate,
      riskScore: s.contracts.riskScore,
    })
    .from(s.contracts)
    .where(tenantScope(session, s.contracts))
    .orderBy(desc(s.contracts.createdAt));
}

export async function listExpiringContracts(session: Session, withinDays = 365): Promise<ContractRow[]> {
  if (!dbReady) return [];
  const cutoff = new Date(Date.now() + withinDays * 86400_000);
  return db
    .select({
      id: s.contracts.id,
      title: s.contracts.title,
      kind: s.contracts.kind,
      counterparty: s.contracts.counterparty,
      status: s.contracts.status,
      region: s.contracts.region,
      governingLaw: s.contracts.governingLaw,
      effectiveDate: s.contracts.effectiveDate,
      expiryDate: s.contracts.expiryDate,
      riskScore: s.contracts.riskScore,
    })
    .from(s.contracts)
    .where(
      and(
        tenantScope(session, s.contracts),
        gt(s.contracts.expiryDate, new Date()),
        lt(s.contracts.expiryDate, cutoff),
      ),
    )
    .orderBy(s.contracts.expiryDate);
}

void eq;
