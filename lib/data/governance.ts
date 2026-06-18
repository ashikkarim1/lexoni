/**
 * Governance read layer — board meetings + resolutions across the managed
 * companies. Tenant-scoped via the companies join.
 */
import { desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type BoardMeetingRow = {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  kind: string;
  scheduledAt: Date;
  quorum: number;
  status: string;
};

export async function listBoardMeetings(session: Session): Promise<BoardMeetingRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.boardMeetings.id,
      companyId: s.boardMeetings.companyId,
      companyName: s.companies.legalName,
      title: s.boardMeetings.title,
      kind: s.boardMeetings.kind,
      scheduledAt: s.boardMeetings.scheduledAt,
      quorum: s.boardMeetings.quorum,
      status: s.boardMeetings.status,
    })
    .from(s.boardMeetings)
    .innerJoin(s.companies, eq(s.companies.id, s.boardMeetings.companyId))
    .where(tenantScope(session, s.companies))
    .orderBy(desc(s.boardMeetings.scheduledAt));
}

export type ResolutionRow = {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  version: number;
  isCurrent: boolean;
  status: string;
  signedAt: Date | null;
};

export async function listResolutions(session: Session): Promise<ResolutionRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.resolutions.id,
      companyId: s.resolutions.companyId,
      companyName: s.companies.legalName,
      title: s.resolutions.title,
      version: s.resolutions.version,
      isCurrent: s.resolutions.isCurrent,
      status: s.resolutions.status,
      signedAt: s.resolutions.signedAt,
    })
    .from(s.resolutions)
    .innerJoin(s.companies, eq(s.companies.id, s.resolutions.companyId))
    .where(tenantScope(session, s.companies))
    .orderBy(desc(s.resolutions.signedAt));
}
