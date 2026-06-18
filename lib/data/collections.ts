/**
 * Sprint 18.1 — Collections.
 *
 * Aging buckets:  0–30d · 31–60d · 61–90d · 90+d  (from invoice dueAt).
 * Status filter:  issued | partial | overdue
 *
 * Dunning send walks the firm-configured cadence; for now we expose a
 * single "send polite reminder" API that emails the billed-to contact
 * via Resend and stamps an audit-log entry. Cadence automation slots
 * in later via lib/automations/dunning.ts (Sprint 18.1 follow-up).
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import { sendEmail } from "@/lib/email/resend";

export type AgingBucket = "0-30" | "31-60" | "61-90" | "90+";

export type CollectionsRow = {
  id: string;
  invoiceNumber: string;
  caseTitle: string | null;
  clientName: string | null;
  clientEmail: string | null;
  currency: string;
  totalCents: number;
  paidCents: number;
  outstandingCents: number;
  status: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  daysOverdue: number;
  bucket: AgingBucket;
  remindersSent: number;
  lastReminderAt: Date | null;
};

export type AgingSummary = {
  rows: CollectionsRow[];
  buckets: Record<AgingBucket, { count: number; cents: number }>;
  totalOutstandingCents: number;
};

function bucketFor(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 30) return "0-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

export async function getAgingSummary(session: Session): Promise<AgingSummary> {
  const empty: AgingSummary = {
    rows: [],
    buckets: { "0-30": { count: 0, cents: 0 }, "31-60": { count: 0, cents: 0 }, "61-90": { count: 0, cents: 0 }, "90+": { count: 0, cents: 0 } },
    totalOutstandingCents: 0,
  };
  if (!dbReady) return empty;

  // Pull all open invoices (issued/partial/overdue). Drizzle does not have
  // a built-in NOT IN for enums via the helper, so we read everything and
  // filter in JS — the volumes here are dashboard-sized.
  const invs = await db
    .select({
      id: s.invoices.id,
      caseId: s.invoices.caseId,
      number: s.invoices.number,
      currency: s.invoices.currency,
      totalCents: s.invoices.totalCents,
      status: s.invoices.status,
      issuedAt: s.invoices.issuedAt,
      dueAt: s.invoices.dueAt,
      toTenantId: s.invoices.toTenantId,
    })
    .from(s.invoices)
    .where(tenantScope(session, s.invoices))
    .orderBy(desc(s.invoices.issuedAt));
  const open = invs.filter((i) => i.status === "issued" || i.status === "partial" || i.status === "overdue");
  if (open.length === 0) return empty;

  // Payments per invoice.
  const ids = open.map((i) => i.id);
  const payRows = await db
    .select({ invoiceId: s.payments.invoiceId, amountCents: s.payments.amountCents })
    .from(s.payments)
    .where(inArray(s.payments.invoiceId, ids));
  const paidById = new Map<string, number>();
  for (const p of payRows) paidById.set(p.invoiceId, (paidById.get(p.invoiceId) ?? 0) + p.amountCents);

  // Case + client lookups (best-effort, may be null).
  const caseIds = Array.from(new Set(open.map((i) => i.caseId).filter((x): x is string => !!x)));
  const cases = caseIds.length === 0 ? []
    : await db
        .select({ id: s.cases.id, title: s.cases.title, clientTenantId: s.cases.clientTenantId })
        .from(s.cases)
        .where(and(tenantScope(session, s.cases), inArray(s.cases.id, caseIds)));
  const caseById = new Map(cases.map((c) => [c.id, c]));
  const clientIds = Array.from(new Set([
    ...open.map((i) => i.toTenantId).filter((x): x is string => !!x),
    ...cases.map((c) => c.clientTenantId).filter((x): x is string => !!x),
  ]));
  const tenantRows = clientIds.length === 0 ? []
    : await db
        .select({ id: s.tenants.id, name: s.tenants.name, contactEmail: s.tenants.dpoEmail })
        .from(s.tenants)
        .where(inArray(s.tenants.id, clientIds));
  const tenantById = new Map(tenantRows.map((t) => [t.id, t]));

  // Reminders sent — count audit_log rows of action `invoice_reminder_sent`.
  const reminderRows = await db
    .select({ entityId: s.auditLog.entityId, at: s.auditLog.occurredAt })
    .from(s.auditLog)
    .where(and(
      tenantScope(session, s.auditLog),
      eq(s.auditLog.action, "invoice_reminder_sent"),
    ));
  const remindersById = new Map<string, { count: number; last: Date | null }>();
  for (const r of reminderRows) {
    if (!r.entityId) continue;
    const cur = remindersById.get(r.entityId) ?? { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || (r.at && r.at > cur.last)) cur.last = r.at ?? null;
    remindersById.set(r.entityId, cur);
  }

  const now = Date.now();
  const rows: CollectionsRow[] = open.map((i) => {
    const paid = paidById.get(i.id) ?? 0;
    const outstanding = Math.max(0, i.totalCents - paid);
    const due = i.dueAt?.getTime() ?? null;
    const daysOverdue = due ? Math.max(0, Math.floor((now - due) / 86400_000)) : 0;
    const c = i.caseId ? caseById.get(i.caseId) : null;
    const client = c?.clientTenantId ? tenantById.get(c.clientTenantId) : (i.toTenantId ? tenantById.get(i.toTenantId) : null);
    const reminders = remindersById.get(i.id) ?? { count: 0, last: null };
    return {
      id: i.id,
      invoiceNumber: i.number,
      caseTitle: c?.title ?? null,
      clientName: client?.name ?? null,
      clientEmail: client?.contactEmail ?? null,
      currency: i.currency,
      totalCents: i.totalCents,
      paidCents: paid,
      outstandingCents: outstanding,
      status: i.status,
      issuedAt: i.issuedAt,
      dueAt: i.dueAt,
      daysOverdue,
      bucket: bucketFor(daysOverdue),
      remindersSent: reminders.count,
      lastReminderAt: reminders.last,
    };
  });

  const buckets = empty.buckets;
  for (const r of rows) {
    buckets[r.bucket].count += 1;
    buckets[r.bucket].cents += r.outstandingCents;
  }
  const totalOutstandingCents = rows.reduce((a, n) => a + n.outstandingCents, 0);

  // Mark issued + overdue (status flip) — best-effort, non-blocking.
  const newlyOverdueIds = rows.filter((r) => r.bucket !== "0-30" && r.status === "issued").map((r) => r.id);
  if (newlyOverdueIds.length > 0) {
    await db.update(s.invoices).set({ status: "overdue" }).where(inArray(s.invoices.id, newlyOverdueIds));
  }

  return { rows, buckets, totalOutstandingCents };
}

export async function sendReminder(session: Session, invoiceId: string): Promise<{ skipped?: boolean }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const [inv] = await db
    .select({
      id: s.invoices.id,
      number: s.invoices.number,
      totalCents: s.invoices.totalCents,
      currency: s.invoices.currency,
      dueAt: s.invoices.dueAt,
      caseId: s.invoices.caseId,
      toTenantId: s.invoices.toTenantId,
    })
    .from(s.invoices)
    .where(and(tenantScope(session, s.invoices), eq(s.invoices.id, invoiceId)))
    .limit(1);
  if (!inv) throw new Error("Invoice not found");

  let email: string | null = null, clientName: string | null = null;
  if (inv.toTenantId) {
    const [t] = await db.select({ name: s.tenants.name, contactEmail: s.tenants.dpoEmail }).from(s.tenants).where(eq(s.tenants.id, inv.toTenantId)).limit(1);
    email = t?.contactEmail ?? null; clientName = t?.name ?? null;
  }
  if (!email && inv.caseId) {
    const [c] = await db.select({ clientTenantId: s.cases.clientTenantId }).from(s.cases).where(eq(s.cases.id, inv.caseId)).limit(1);
    if (c?.clientTenantId) {
      const [t] = await db.select({ name: s.tenants.name, contactEmail: s.tenants.dpoEmail }).from(s.tenants).where(eq(s.tenants.id, c.clientTenantId)).limit(1);
      email = t?.contactEmail ?? null; clientName = t?.name ?? null;
    }
  }
  if (!email) {
    await writeAudit(session, {
      action: "invoice_reminder_skipped_no_email",
      entityKind: "invoice",
      entityId: invoiceId,
    });
    return { skipped: true };
  }

  const due = inv.dueAt ? inv.dueAt.toISOString().slice(0, 10) : "(no due date)";
  const amt = `${inv.currency} ${(inv.totalCents / 100).toLocaleString()}`;
  const text = [
    `Dear ${clientName ?? "team"},`, "",
    `This is a friendly reminder that invoice ${inv.number} for ${amt} was due on ${due}.`,
    `If you have any questions or have already paid, please disregard this note and a confirmation will follow.`,
    "", `Kind regards,`, `The team`,
  ].join("\n");
  const html = `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;

  const result = await sendEmail({
    to: email,
    subject: `Payment reminder · Invoice ${inv.number}`,
    text, html,
    tags: [{ name: "kind", value: "invoice_reminder" }],
  });

  await writeAudit(session, {
    action: "invoice_reminder_sent",
    entityKind: "invoice",
    entityId: invoiceId,
    afterJson: { email, currency: inv.currency, totalCents: inv.totalCents, messageId: ("messageId" in result) ? result.messageId : null },
  });
  return {};
}
