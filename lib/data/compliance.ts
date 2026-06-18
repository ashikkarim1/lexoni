/**
 * Compliance calendar data layer.
 *
 *   • listFilings()       — every compliance_task for the tenant
 *   • upcomingExceptions  — overdue + due-this-week + due-this-month buckets
 *   • markFiled()         — audited state transition
 *   • createFiling()      — partner adds an ad-hoc filing
 *
 * Multi-jurisdictional: each filing carries a regulator (ADGM, DIFC, DMCC,
 * MISA, ZATCA, Qiwa, …) and a region. KPI strip splits UAE vs KSA.
 */
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";

export type FilingRow = {
  id: string;
  title: string;
  description: string | null;
  regulator: string;
  region: string;
  severity: string;
  status: string;
  dueAt: Date;
  completedAt: Date | null;
  assigneeName: string | null;
  companyName: string | null;
};

export async function listFilings(session: Session, opts: { status?: string } = {}): Promise<FilingRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      id: s.complianceTasks.id,
      title: s.complianceTasks.title,
      description: s.complianceTasks.description,
      regulator: s.complianceTasks.regulator,
      region: s.complianceTasks.region,
      severity: s.complianceTasks.severity,
      status: s.complianceTasks.status,
      dueAt: s.complianceTasks.dueAt,
      completedAt: s.complianceTasks.completedAt,
      assigneeName: s.users.fullName,
      companyName: s.companies.legalName,
    })
    .from(s.complianceTasks)
    .leftJoin(s.users, eq(s.users.id, s.complianceTasks.assigneeUserId))
    .leftJoin(s.companies, eq(s.companies.id, s.complianceTasks.companyId))
    .where(
      opts.status
        ? and(tenantScope(session, s.complianceTasks), eq(s.complianceTasks.status, opts.status))
        : tenantScope(session, s.complianceTasks),
    )
    .orderBy(s.complianceTasks.dueAt);
  return rows.map((r) => ({
    ...r,
    region: r.region as string,
  }));
}

export async function complianceCounters(session: Session): Promise<{
  open: number; overdue: number; dueThisWeek: number; uaeOpen: number; ksaOpen: number;
}> {
  if (!dbReady) return { open: 0, overdue: 0, dueThisWeek: 0, uaeOpen: 0, ksaOpen: 0 };
  const rows = await db.select().from(s.complianceTasks).where(tenantScope(session, s.complianceTasks));
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const open = rows.filter((r) => r.status !== "filed" && r.status !== "waived");
  return {
    open: open.length,
    overdue: open.filter((r) => r.dueAt < now || r.status === "overdue").length,
    dueThisWeek: open.filter((r) => r.dueAt >= now && r.dueAt < weekFromNow).length,
    uaeOpen: open.filter((r) => r.region === "UAE").length,
    ksaOpen: open.filter((r) => r.region === "KSA").length,
  };
}

export async function markFiled(session: Session, id: string, evidenceUrl?: string): Promise<void> {
  if (!dbReady) return;
  await db
    .update(s.complianceTasks)
    .set({ status: "filed", completedAt: new Date(), evidenceUrl })
    .where(and(tenantScope(session, s.complianceTasks), eq(s.complianceTasks.id, id)));
  await writeAudit(session, {
    action: "compliance_task_filed",
    entityKind: "compliance_task",
    entityId: id,
    afterJson: { evidenceUrl },
  });
}

/** Mark stale-open tasks as overdue. Idempotent — safe to call from any
 *  server component that wants accurate state. */
export async function reconcileOverdue(session: Session): Promise<number> {
  if (!dbReady) return 0;
  const result = await db
    .update(s.complianceTasks)
    .set({ status: "overdue" })
    .where(
      and(
        tenantScope(session, s.complianceTasks),
        eq(s.complianceTasks.status, "open"),
        lt(s.complianceTasks.dueAt, new Date()),
      ),
    );
  return result.count ?? 0;
}

void gte;
void sql;
void desc;
