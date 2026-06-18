/**
 * Outreach send + tracking. Uses the Resend transactional layer the rest
 * of the app already uses. Bounces / opens / replies hook in via Resend's
 * webhook (POST /api/email/webhook — added later); for the first ship we
 * track manual status moves through the UI.
 */
import { and, desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import { sendEmail } from "@/lib/email/resend";

export type OutreachRow = {
  id: string;
  prospectId: string;
  prospectName: string;
  channel: typeof s.bdOutreachChannelEnum.enumValues[number];
  subject: string | null;
  status: typeof s.bdOutreachStatusEnum.enumValues[number];
  sentAt: Date | null;
  openedAt: Date | null;
  repliedAt: Date | null;
  convertedAt: Date | null;
  ownerName: string | null;
  createdAt: Date;
};

export async function listOutreach(session: Session, opts: { status?: OutreachRow["status"] } = {}): Promise<OutreachRow[]> {
  if (!dbReady) return [];
  const filters = [tenantScope(session, s.bdOutreach)];
  if (opts.status) filters.push(eq(s.bdOutreach.status, opts.status));
  const rows = await db
    .select({
      id: s.bdOutreach.id,
      prospectId: s.bdOutreach.prospectId,
      prospectName: s.bdProspects.legalName,
      channel: s.bdOutreach.channel,
      subject: s.bdOutreach.subject,
      status: s.bdOutreach.status,
      sentAt: s.bdOutreach.sentAt,
      openedAt: s.bdOutreach.openedAt,
      repliedAt: s.bdOutreach.repliedAt,
      convertedAt: s.bdOutreach.convertedAt,
      ownerName: s.users.fullName,
      createdAt: s.bdOutreach.createdAt,
    })
    .from(s.bdOutreach)
    .innerJoin(s.bdProspects, eq(s.bdProspects.id, s.bdOutreach.prospectId))
    .leftJoin(s.users, eq(s.users.id, s.bdOutreach.sentByUserId))
    .where(filters.length === 1 ? filters[0] : and(...filters))
    .orderBy(desc(s.bdOutreach.createdAt));
  return rows as OutreachRow[];
}

export type DraftOutreachInput = {
  prospectId: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  groundingJson?: unknown;
};

export async function draftOutreach(session: Session, input: DraftOutreachInput): Promise<{ id: string }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const [row] = await db.insert(s.bdOutreach).values({
    tenantId: session.tenantId,
    prospectId: input.prospectId,
    channel: "email",
    subject: input.subject,
    bodyText: input.bodyText,
    bodyHtml: input.bodyHtml ?? null,
    groundingJson: (input.groundingJson ?? null) as never,
    sentByUserId: session.userId,
    status: "drafted",
  } as never).returning({ id: s.bdOutreach.id });
  await writeAudit(session, {
    action: "bd_outreach_drafted",
    entityKind: "bd_outreach",
    entityId: row.id,
    afterJson: { prospectId: input.prospectId, subject: input.subject },
  });
  return row;
}

export async function sendOutreach(session: Session, id: string): Promise<{ skipped?: boolean }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const [row] = await db
    .select({
      id: s.bdOutreach.id,
      subject: s.bdOutreach.subject,
      bodyText: s.bdOutreach.bodyText,
      bodyHtml: s.bdOutreach.bodyHtml,
      prospectEmail: s.bdProspects.contactEmail,
      prospectName: s.bdProspects.legalName,
      prospectId: s.bdOutreach.prospectId,
    })
    .from(s.bdOutreach)
    .innerJoin(s.bdProspects, eq(s.bdProspects.id, s.bdOutreach.prospectId))
    .where(and(tenantScope(session, s.bdOutreach), eq(s.bdOutreach.id, id)))
    .limit(1);
  if (!row) throw new Error("outreach not found");
  if (!row.prospectEmail) {
    await writeAudit(session, { action: "bd_outreach_skipped_no_email", entityKind: "bd_outreach", entityId: id });
    return { skipped: true };
  }
  const text = row.bodyText ?? "";
  const html = row.bodyHtml ?? `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
  const result = await sendEmail({
    to: row.prospectEmail,
    subject: row.subject ?? "Quick note",
    text,
    html,
    tags: [{ name: "kind", value: "bd_outreach" }],
  });
  const messageId = "messageId" in result ? (result.messageId as string | null) : null;
  await db
    .update(s.bdOutreach)
    .set({ status: "sent", sentAt: new Date(), providerMessageId: messageId ?? undefined })
    .where(eq(s.bdOutreach.id, id));
  await db
    .update(s.bdProspects)
    .set({ status: "contacted", updatedAt: new Date() })
    .where(eq(s.bdProspects.id, row.prospectId));
  await writeAudit(session, {
    action: "bd_outreach_sent",
    entityKind: "bd_outreach",
    entityId: id,
    afterJson: { prospectId: row.prospectId, messageId },
  });
  return {};
}

export async function markOutreach(session: Session, id: string, status: OutreachRow["status"]): Promise<void> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const setters: Record<string, unknown> = { status };
  const now = new Date();
  if (status === "opened" && !setters.openedAt) setters.openedAt = now;
  if (status === "replied" && !setters.repliedAt) setters.repliedAt = now;
  if (status === "converted" && !setters.convertedAt) setters.convertedAt = now;
  await db
    .update(s.bdOutreach)
    .set(setters as never)
    .where(and(tenantScope(session, s.bdOutreach), eq(s.bdOutreach.id, id)));
  await writeAudit(session, { action: "bd_outreach_marked", entityKind: "bd_outreach", entityId: id, afterJson: { status } });
}

/** Funnel summary for the dashboard. */
export async function outreachFunnel(session: Session): Promise<{
  drafted: number; sent: number; opened: number; replied: number; converted: number;
}> {
  if (!dbReady) return { drafted: 0, sent: 0, opened: 0, replied: 0, converted: 0 };
  const rows = await db.select({ status: s.bdOutreach.status }).from(s.bdOutreach).where(tenantScope(session, s.bdOutreach));
  const counts = { drafted: 0, sent: 0, opened: 0, replied: 0, converted: 0 };
  for (const r of rows) {
    if (r.status === "drafted") counts.drafted += 1;
    else if (r.status === "sent") counts.sent += 1;
    else if (r.status === "opened") counts.opened += 1;
    else if (r.status === "replied") counts.replied += 1;
    else if (r.status === "converted") counts.converted += 1;
  }
  return counts;
}
