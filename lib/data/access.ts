/**
 * Access log read + write.
 *
 * `recordAccess()` is the canonical way to log a view / download / export /
 * print on a tenant-scoped entity. `listAccess()` powers the "who saw what"
 * viewer with filters.
 */
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type AccessAction = "view" | "download" | "export" | "print";

export async function recordAccess(
  session: Session,
  args: {
    action: AccessAction;
    entityKind: string;
    entityId?: string;
    caseId?: string;
    exportReason?: string;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<void> {
  if (!dbReady) return;
  await db.insert(s.accessLog).values({
    tenantId: session.tenantId,
    userId: session.userId,
    caseId: args.caseId,
    entityKind: args.entityKind,
    entityId: args.entityId,
    action: args.action,
    exportReason: args.exportReason,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });
}

export type AccessFilter = {
  userId?: string;
  caseId?: string;
  action?: AccessAction;
  from?: Date;
  to?: Date;
  limit?: number;
};

export type AccessRow = {
  id: string;
  occurredAt: Date;
  userId: string;
  userName: string;
  caseId: string | null;
  matterNumber: string | null;
  matterTitle: string | null;
  entityKind: string;
  action: string;
  exportReason: string | null;
  ipAddress: string | null;
};

export async function listAccess(session: Session, filter: AccessFilter = {}): Promise<AccessRow[]> {
  if (!dbReady) return [];
  const limit = filter.limit ?? 200;
  const filters = [tenantScope(session, s.accessLog)];
  if (filter.userId) filters.push(eq(s.accessLog.userId, filter.userId));
  if (filter.caseId) filters.push(eq(s.accessLog.caseId, filter.caseId));
  if (filter.action) filters.push(eq(s.accessLog.action, filter.action));
  if (filter.from) filters.push(gte(s.accessLog.occurredAt, filter.from));
  if (filter.to) filters.push(lte(s.accessLog.occurredAt, filter.to));

  const rows = await db
    .select({
      id: s.accessLog.id,
      occurredAt: s.accessLog.occurredAt,
      userId: s.accessLog.userId,
      userName: s.users.fullName,
      caseId: s.accessLog.caseId,
      matterNumber: s.cases.matterNumber,
      matterTitle: s.cases.title,
      entityKind: s.accessLog.entityKind,
      action: s.accessLog.action,
      exportReason: s.accessLog.exportReason,
      ipAddress: s.accessLog.ipAddress,
    })
    .from(s.accessLog)
    .innerJoin(s.users, eq(s.users.id, s.accessLog.userId))
    .leftJoin(s.cases, eq(s.cases.id, s.accessLog.caseId))
    .where(and(...filters))
    .orderBy(desc(s.accessLog.occurredAt))
    .limit(limit);

  return rows;
}

/** Distinct users + matters + actions present in this firm's log — feeds the filter dropdowns. */
export async function accessFilterFacets(session: Session): Promise<{
  users: Array<{ id: string; name: string }>;
  matters: Array<{ id: string; matterNumber: string; title: string }>;
  actions: string[];
}> {
  if (!dbReady) return { users: [], matters: [], actions: ["view", "download", "export", "print"] };
  const [users, matters, actions] = await Promise.all([
    db
      .select({ id: s.users.id, name: s.users.fullName })
      .from(s.accessLog)
      .innerJoin(s.users, eq(s.users.id, s.accessLog.userId))
      .where(tenantScope(session, s.accessLog))
      .groupBy(s.users.id, s.users.fullName),
    db
      .select({ id: s.cases.id, matterNumber: s.cases.matterNumber, title: s.cases.title })
      .from(s.accessLog)
      .innerJoin(s.cases, eq(s.cases.id, s.accessLog.caseId))
      .where(tenantScope(session, s.accessLog))
      .groupBy(s.cases.id, s.cases.matterNumber, s.cases.title),
    db
      .select({ action: s.accessLog.action })
      .from(s.accessLog)
      .where(tenantScope(session, s.accessLog))
      .groupBy(s.accessLog.action),
  ]);
  return {
    users,
    matters,
    actions: actions.map((a) => a.action),
  };
}

export async function getExportPolicy(session: Session): Promise<{ requireReason: boolean }> {
  if (!dbReady) return { requireReason: true };
  const [row] = await db
    .select({ flag: s.tenantSettings.requireExportReason })
    .from(s.tenantSettings)
    .where(eq(s.tenantSettings.tenantId, session.tenantId))
    .limit(1);
  return { requireReason: row?.flag ?? true };
}

// Suppress unused import — kept for future fuzzy filter additions.
void sql;
