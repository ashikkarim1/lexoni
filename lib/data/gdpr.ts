/**
 * GDPR / UAE-PDPL / KSA-PDPL data layer.
 *
 *   • Data-subject requests (DSR) — listed, advanced through states, due
 *     30 days from receipt under all three regimes.
 *   • Record of Processing Activities (RoPA, GDPR Art. 30) — what data we
 *     process, why, lawful basis, recipients, retention.
 *   • Consent records — per-subject consent ledger.
 *   • Retention policy — derived from RoPA rows (cap visible to the firm DPO).
 *
 * All reads tenant-scoped. Writes are audited.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import { sendEmail } from "@/lib/email/resend";
import { dsrAckEmail } from "@/lib/email/templates";

export type DsrType = "access" | "rectification" | "erasure" | "restriction" | "portability" | "objection";
export type DsrStatus = "received" | "verifying" | "in_progress" | "completed" | "rejected";

export type DsrRow = {
  id: string;
  type: DsrType;
  status: DsrStatus;
  subjectName: string;
  subjectEmail: string;
  receivedAt: Date;
  dueAt: Date;
  completedAt: Date | null;
  notes: string | null;
};

export async function listDsr(session: Session): Promise<DsrRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select()
    .from(s.dataSubjectRequests)
    .where(tenantScope(session, s.dataSubjectRequests))
    .orderBy(desc(s.dataSubjectRequests.receivedAt));
  return rows.map((r) => ({
    id: r.id,
    type: r.type as DsrType,
    status: r.status as DsrStatus,
    subjectName: r.subjectName,
    subjectEmail: r.subjectEmail,
    receivedAt: r.receivedAt,
    dueAt: r.dueAt,
    completedAt: r.completedAt,
    notes: r.notes,
  }));
}

export async function advanceDsr(session: Session, id: string, to: DsrStatus): Promise<void> {
  if (!dbReady) return;
  await db
    .update(s.dataSubjectRequests)
    .set({
      status: to,
      completedAt: to === "completed" ? new Date() : null,
    })
    .where(and(tenantScope(session, s.dataSubjectRequests), eq(s.dataSubjectRequests.id, id)));
  await writeAudit(session, {
    action: "dsr_advanced",
    entityKind: "dsr",
    entityId: id,
    afterJson: { status: to },
  });
}

export async function createDsr(
  session: Session,
  args: { type: DsrType; subjectName: string; subjectEmail: string; notes?: string },
): Promise<string> {
  if (!dbReady) return "stub";
  const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [row] = await db.insert(s.dataSubjectRequests).values({
    tenantId: session.tenantId,
    type: args.type,
    status: "received",
    subjectName: args.subjectName,
    subjectEmail: args.subjectEmail,
    dueAt: due,
    notes: args.notes,
  }).returning({ id: s.dataSubjectRequests.id });
  await writeAudit(session, {
    action: "dsr_received",
    entityKind: "dsr",
    entityId: row.id,
    afterJson: { type: args.type, subjectEmail: args.subjectEmail },
  });

  // Statutory acknowledgement to the data subject — best-effort.
  const inviteeLocale: "en" | "ar" = session.locale === "ar" ? "ar" : "en";
  const tpl = dsrAckEmail({
    locale: inviteeLocale,
    subjectName: args.subjectName,
    firmName: session.tenantName,
    type: args.type,
    dueOn: due.toISOString().slice(0, 10),
  });
  const sent = await sendEmail({
    to: args.subjectEmail,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [{ name: "kind", value: "dsr_ack" }],
  });
  await writeAudit(session, {
    action: "dsr_ack_email_attempted",
    entityKind: "dsr",
    entityId: row.id,
    afterJson: { to: args.subjectEmail, sent: "ok" in sent && sent.ok, skipped: "skipped" in sent },
  });

  return row.id;
}

export type RopaRow = {
  id: string;
  name: string;
  purpose: string;
  lawfulBasis: string;
  dataCategories: string[];
  recipients: string[] | null;
  thirdCountryTransfers: string[] | null;
  retentionMonths: number;
  securityMeasures: string | null;
  reviewedAt: Date | null;
};

export async function listRopa(session: Session): Promise<RopaRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select()
    .from(s.dataProcessingActivities)
    .where(tenantScope(session, s.dataProcessingActivities))
    .orderBy(s.dataProcessingActivities.name);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    purpose: r.purpose,
    lawfulBasis: r.lawfulBasis as string,
    dataCategories: r.dataCategories,
    recipients: r.recipients,
    thirdCountryTransfers: r.thirdCountryTransfers,
    retentionMonths: r.retentionMonths,
    securityMeasures: r.securityMeasures,
    reviewedAt: r.reviewedAt,
  }));
}

export type ConsentRow = {
  id: string;
  subjectEmail: string;
  purpose: string;
  basis: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt: Date | null;
  evidence: string | null;
};

export async function listConsent(session: Session): Promise<ConsentRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select()
    .from(s.consentRecords)
    .where(tenantScope(session, s.consentRecords))
    .orderBy(desc(s.consentRecords.grantedAt));
  return rows.map((r) => ({
    id: r.id,
    subjectEmail: r.subjectEmail,
    purpose: r.purpose,
    basis: r.basis as string,
    granted: r.granted,
    grantedAt: r.grantedAt,
    revokedAt: r.revokedAt,
    evidence: r.evidence,
  }));
}

export async function gdprCounters(session: Session): Promise<{
  dsrOpen: number; dsrOverdue: number; ropaCount: number; consentActive: number;
}> {
  if (!dbReady) return { dsrOpen: 0, dsrOverdue: 0, ropaCount: 0, consentActive: 0 };
  const now = new Date();
  const dsrRows = await db.select().from(s.dataSubjectRequests).where(tenantScope(session, s.dataSubjectRequests));
  const dsrOpen = dsrRows.filter((r) => r.status !== "completed" && r.status !== "rejected").length;
  const dsrOverdue = dsrRows.filter((r) => r.status !== "completed" && r.status !== "rejected" && r.dueAt < now).length;
  const ropaRows = await db.select({ c: sql<number>`count(*)::int` }).from(s.dataProcessingActivities).where(tenantScope(session, s.dataProcessingActivities));
  const consentRows = await db.select().from(s.consentRecords).where(tenantScope(session, s.consentRecords));
  return {
    dsrOpen,
    dsrOverdue,
    ropaCount: ropaRows[0]?.c ?? 0,
    consentActive: consentRows.filter((r) => r.granted && !r.revokedAt).length,
  };
}
