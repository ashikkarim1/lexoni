/**
 * Matter timeline — Sprint 11.3.
 *
 * Projects multiple sources into one chronological feed: documents, emails,
 * slot transitions, signature events, key audit log entries. Used by
 * /matters/[id]'s Timeline tab and (later) by the AI for "what happened on
 * this matter" recall.
 *
 * Wall-aware: the caller has already passed a wall check at the matter
 * level (page-level recordAccess); this helper only filters within the
 * matter and trusts that gate.
 */
import { and, desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type TimelineEntry = {
  id: string;
  at: Date;
  kind: "document" | "email" | "slot" | "signature" | "audit";
  title: string;
  subtitle: string | null;
  actor: string | null;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

export async function listMatterTimeline(session: Session, caseId: string, limit = 100): Promise<TimelineEntry[]> {
  if (!dbReady) return [];

  const entries: TimelineEntry[] = [];

  // Documents.
  const docs = await db
    .select({
      id: s.matterDocuments.id,
      uploadedAt: s.matterDocuments.uploadedAt,
      filename: s.matterDocuments.filename,
      version: s.matterDocuments.version,
      isCurrent: s.matterDocuments.isCurrent,
      mime: s.matterDocuments.mime,
      actorName: s.users.fullName,
    })
    .from(s.matterDocuments)
    .leftJoin(s.users, eq(s.users.id, s.matterDocuments.uploadedByUserId))
    .where(and(tenantScope(session, s.matterDocuments), eq(s.matterDocuments.caseId, caseId)))
    .orderBy(desc(s.matterDocuments.uploadedAt))
    .limit(limit);
  for (const d of docs) {
    entries.push({
      id: `doc:${d.id}`,
      at: d.uploadedAt,
      kind: "document",
      title: d.filename,
      subtitle: `${d.version}${d.isCurrent ? " · current" : ""} · ${d.mime.split("/").pop()}`,
      actor: d.actorName,
      tone: d.isCurrent ? "info" : "neutral",
    });
  }

  // Emails.
  const emails = await db
    .select({
      id: s.matterEmails.id,
      at: s.matterEmails.receivedAt,
      subject: s.matterEmails.subject,
      from: s.matterEmails.fromAddress,
      direction: s.matterEmails.direction,
    })
    .from(s.matterEmails)
    .where(and(tenantScope(session, s.matterEmails), eq(s.matterEmails.caseId, caseId)))
    .orderBy(desc(s.matterEmails.receivedAt))
    .limit(limit);
  for (const e of emails) {
    entries.push({
      id: `email:${e.id}`,
      at: e.at,
      kind: "email",
      title: e.subject || "(no subject)",
      subtitle: `${e.direction === "inbound" ? "from" : "to"} ${e.from}`,
      actor: null,
      tone: "neutral",
    });
  }

  // Slot transitions (uses audit log).
  const slotLog = await db
    .select({
      id: s.auditLog.id,
      at: s.auditLog.occurredAt,
      action: s.auditLog.action,
      after: s.auditLog.afterJson,
      actor: s.users.fullName,
    })
    .from(s.auditLog)
    .leftJoin(s.users, eq(s.users.id, s.auditLog.userId))
    .where(and(
      tenantScope(session, s.auditLog),
      eq(s.auditLog.entityKind, "matter_document_slot"),
    ))
    .orderBy(desc(s.auditLog.occurredAt))
    .limit(limit);
  for (const a of slotLog) {
    const after = a.after as Record<string, unknown> | null;
    if (!after || (after.caseId && after.caseId !== caseId)) continue;
    entries.push({
      id: `slot:${a.id}`,
      at: a.at,
      kind: "slot",
      title: `Slot · ${a.action.replace(/_/g, " ")}`,
      subtitle: typeof after.slotTitle === "string" ? after.slotTitle : null,
      actor: a.actor,
      tone: "info",
    });
  }

  // Signature events from audit log.
  const sigActions = ["signature_workflow_sent", "signature_workflow_signed", "signature_workflow_complete",
                      "engagement_letter_sent", "engagement_letter_client_signed", "engagement_letter_executed"];
  const sigs = await db
    .select({
      id: s.auditLog.id,
      at: s.auditLog.occurredAt,
      action: s.auditLog.action,
      after: s.auditLog.afterJson,
      actor: s.users.fullName,
    })
    .from(s.auditLog)
    .leftJoin(s.users, eq(s.users.id, s.auditLog.userId))
    .where(tenantScope(session, s.auditLog))
    .orderBy(desc(s.auditLog.occurredAt))
    .limit(limit * 2);
  for (const a of sigs) {
    if (!sigActions.includes(a.action)) continue;
    const after = a.after as Record<string, unknown> | null;
    const matches = !after || !after.caseId || after.caseId === caseId;
    if (!matches) continue;
    entries.push({
      id: `sig:${a.id}`,
      at: a.at,
      kind: "signature",
      title: a.action.replace(/_/g, " "),
      subtitle: typeof after?.title === "string" ? after.title : null,
      actor: a.actor,
      tone: /complete|signed|executed/.test(a.action) ? "success" : "info",
    });
  }

  // Sort + cap.
  entries.sort((a, b) => b.at.getTime() - a.at.getTime());
  return entries.slice(0, limit);
}
