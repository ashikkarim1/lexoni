/**
 * GET /api/cron/compliance-reconcile
 * Vercel cron. Marks filings with passed dueAt as overdue, emits one
 * audit row per change, fans out reminder emails (later).
 */
import { NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { isAuthorisedCron } from "@/lib/security/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAuthorisedCron(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!dbReady) return NextResponse.json({ ok: true, skipped: "no_db" });

  const now = new Date();
  const stale = await db
    .update(s.complianceTasks)
    .set({ status: "overdue" })
    .where(and(eq(s.complianceTasks.status, "pending"), lt(s.complianceTasks.dueAt, now)))
    .returning({ id: s.complianceTasks.id, tenantId: s.complianceTasks.tenantId });

  if (stale.length > 0) {
    await db.insert(s.auditLog).values(stale.map((r) => ({
      tenantId: r.tenantId,
      action: "compliance_overdue_auto",
      entityKind: "compliance_task",
      entityId: r.id,
      afterJson: { reason: "due date passed", at: now.toISOString() } as never,
    })));
  }

  return NextResponse.json({ ok: true, transitioned: stale.length, at: now.toISOString() });
}
