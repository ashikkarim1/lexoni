/**
 * Billing data layer — sits on top of `invoices`, `time_entries`, `expenses`,
 * `payments`, `subscriptions`, `plans` and `usage_meters`.
 *
 *   • listInvoices()        — all invoices for the firm
 *   • createInvoiceFromUnbilledWip(caseId) — rolls every confirmed, unbilled
 *                              time_entry on a case into a new invoice +
 *                              writes the totals + marks the entries billed
 *   • recordPayment()       — receives a payment, updates invoice status
 *   • getSubscription()     — the firm's active subscription
 *   • setSubscriptionPlan() — change plan, audit-trailed
 *   • billingCounters()     — KPI strip for /billing
 *
 * All reads tenant-scoped via `tenantScope()`. Every mutation audits.
 *
 * VAT: UAE 5%, KSA 15%. We apply by region of the tenant. ZATCA-compatible
 * invoice numbering is left to a hardening sprint; this layer keeps the
 * shape compatible.
 */
import { and, asc, desc, eq, gte, inArray, isNull, lt, sql, type SQL } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import { sendEmail, appUrl } from "@/lib/email/resend";
import { invoiceIssuedEmail } from "@/lib/email/templates";

const VAT_RATE: Record<string, number> = { UAE: 0.05, KSA: 0.15, QAT: 0, BHR: 0.10, KWT: 0, OMN: 0.05, GLOBAL: 0 };

export type InvoiceRow = {
  id: string;
  number: string;
  caseId: string | null;
  matterNumber: string | null;
  matterTitle: string | null;
  toTenantName: string | null;
  currency: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  paidCents: number;
  outstandingCents: number;
  status: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
};

export async function listInvoices(session: Session): Promise<InvoiceRow[]> {
  if (!dbReady) return [];

  const rows = await db
    .select({
      id: s.invoices.id,
      number: s.invoices.number,
      caseId: s.invoices.caseId,
      matterNumber: s.cases.matterNumber,
      matterTitle: s.cases.title,
      toTenantName: s.tenants.name,
      currency: s.invoices.currency,
      subtotalCents: s.invoices.subtotalCents,
      vatCents: s.invoices.vatCents,
      totalCents: s.invoices.totalCents,
      status: s.invoices.status,
      issuedAt: s.invoices.issuedAt,
      dueAt: s.invoices.dueAt,
      paidAt: s.invoices.paidAt,
    })
    .from(s.invoices)
    .leftJoin(s.cases, eq(s.cases.id, s.invoices.caseId))
    .leftJoin(s.tenants, eq(s.tenants.id, s.invoices.toTenantId))
    .where(tenantScope(session, s.invoices))
    .orderBy(desc(s.invoices.issuedAt));

  const invoiceIds = rows.map((r) => r.id);
  const payments = invoiceIds.length === 0
    ? []
    : await db
        .select({ invoiceId: s.payments.invoiceId, amount: s.payments.amountCents })
        .from(s.payments)
        .where(inArray(s.payments.invoiceId, invoiceIds));
  const paidByInvoice = new Map<string, number>();
  for (const p of payments) {
    paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.amount);
  }

  return rows.map((r) => {
    const paidCents = paidByInvoice.get(r.id) ?? 0;
    return {
      ...r,
      paidCents,
      outstandingCents: Math.max(0, r.totalCents - paidCents),
    };
  });
}

export type CaseWipRow = {
  caseId: string;
  matterNumber: string;
  title: string;
  client: string;
  unbilledMinutes: number;
  unbilledCents: number;
};

/** Confirmed, unbilled time_entries grouped by case — for "Create invoice from WIP". */
export async function listUnbilledWipByCase(session: Session): Promise<CaseWipRow[]> {
  if (!dbReady) return [];

  const rows = await db
    .select({
      caseId: s.cases.id,
      matterNumber: s.cases.matterNumber,
      title: s.cases.title,
      description: s.cases.description,
      minutes: sql<number>`sum(${s.timeEntries.minutes})::int`,
      cents:   sql<number>`sum((${s.timeEntries.minutes} * ${s.timeEntries.rateCents}) / 60)::int`,
    })
    .from(s.timeEntries)
    .innerJoin(s.cases, eq(s.cases.id, s.timeEntries.caseId))
    .where(
      and(
        tenantScope(session, s.timeEntries),
        eq(s.timeEntries.billable, true),
        isNull(s.timeEntries.invoiceId),
      ),
    )
    .groupBy(s.cases.id, s.cases.matterNumber, s.cases.title, s.cases.description);

  return rows.map((r) => ({
    caseId: r.caseId,
    matterNumber: r.matterNumber,
    title: r.title,
    client: (r.description ?? "").split(" · ")[0] ?? "",
    unbilledMinutes: r.minutes ?? 0,
    unbilledCents: r.cents ?? 0,
  }));
}

/** Roll every confirmed, unbilled time_entry on a case into a new invoice. */
export async function createInvoiceFromUnbilledWip(
  session: Session,
  args: { caseId: string; dueInDays?: number; toTenantId?: string },
): Promise<{ id: string; number: string } | { error: string }> {
  if (!dbReady) return { id: "stub", number: "STUB-0001" };

  const [caseRow] = await db
    .select({ id: s.cases.id, region: s.cases.region })
    .from(s.cases)
    .where(and(tenantScope(session, s.cases), eq(s.cases.id, args.caseId)))
    .limit(1);
  if (!caseRow) return { error: "case_not_found" };

  const entries = await db
    .select()
    .from(s.timeEntries)
    .where(
      and(
        tenantScope(session, s.timeEntries),
        eq(s.timeEntries.caseId, args.caseId),
        eq(s.timeEntries.billable, true),
        isNull(s.timeEntries.invoiceId),
      ),
    );
  if (entries.length === 0) return { error: "no_unbilled_wip" };

  const subtotal = entries.reduce((acc, e) => acc + Math.round((e.minutes * e.rateCents) / 60), 0);
  const vatRate = VAT_RATE[caseRow.region as string] ?? 0;
  const vat = Math.round(subtotal * vatRate);
  const total = subtotal + vat;

  // Invoice number — `LXN-YYYY-NNNN`. Counts existing invoices this year to
  // produce a stable sequence per tenant. Fine for demo; ZATCA-compliant
  // numbering is a separate hardening item.
  const year = new Date().getFullYear();
  const [count] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(s.invoices)
    .where(
      and(
        tenantScope(session, s.invoices),
        gte(s.invoices.issuedAt, new Date(`${year}-01-01T00:00:00Z`)),
        lt(s.invoices.issuedAt, new Date(`${year + 1}-01-01T00:00:00Z`)),
      ),
    );
  const seq = String((count?.c ?? 0) + 1).padStart(4, "0");
  const number = `LXN-${year}-${seq}`;

  const now = new Date();
  const due = new Date(now.getTime() + (args.dueInDays ?? 30) * 24 * 60 * 60 * 1000);
  const currency = caseRow.region === "KSA" ? "SAR" : "AED";

  const [invoice] = await db.insert(s.invoices).values({
    tenantId: session.tenantId,
    caseId: args.caseId,
    number,
    toTenantId: args.toTenantId,
    currency,
    subtotalCents: subtotal,
    vatCents: vat,
    totalCents: total,
    status: "issued",
    issuedAt: now,
    dueAt: due,
  }).returning({ id: s.invoices.id });

  // Mark every entry as billed.
  await db
    .update(s.timeEntries)
    .set({ invoiceId: invoice.id })
    .where(
      and(
        tenantScope(session, s.timeEntries),
        eq(s.timeEntries.caseId, args.caseId),
        eq(s.timeEntries.billable, true),
        isNull(s.timeEntries.invoiceId),
      ),
    );

  await writeAudit(session, {
    action: "invoice_created",
    entityKind: "invoice",
    entityId: invoice.id,
    afterJson: { number, caseId: args.caseId, subtotalCents: subtotal, vatCents: vat, totalCents: total, currency, entries: entries.length },
  });

  // Notify the client tenant if one is linked + has a primary contact email.
  if (args.toTenantId) {
    const [contact] = await db
      .select({ email: s.clientContacts.email, name: s.clientContacts.fullName })
      .from(s.clientContacts)
      .where(and(eq(s.clientContacts.tenantId, args.toTenantId), eq(s.clientContacts.isPrimary, true)))
      .limit(1);
    const [matter] = await db
      .select({ title: s.cases.title })
      .from(s.cases)
      .where(eq(s.cases.id, args.caseId))
      .limit(1);
    if (contact?.email && matter?.title) {
      const inviteeLocale: "en" | "ar" = session.locale === "ar" ? "ar" : "en";
      const amount = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(total / 100);
      const tpl = invoiceIssuedEmail({
        locale: inviteeLocale,
        clientName: contact.name,
        firmName: session.tenantName,
        number,
        amount,
        dueOn: due.toISOString().slice(0, 10),
        matterTitle: matter.title,
        payUrl: `${appUrl()}/billing`,
      });
      const sent = await sendEmail({
        to: contact.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [{ name: "kind", value: "invoice_issued" }],
      });
      await writeAudit(session, {
        action: "invoice_email_attempted",
        entityKind: "invoice",
        entityId: invoice.id,
        afterJson: { to: contact.email, sent: "ok" in sent && sent.ok, skipped: "skipped" in sent },
      });
    }
  }

  return { id: invoice.id, number };
}

export async function recordPayment(
  session: Session,
  args: { invoiceId: string; amountCents: number; method: string; reference?: string; receivedAt?: Date },
): Promise<{ ok: true } | { error: string }> {
  if (!dbReady) return { ok: true };

  const [invoice] = await db
    .select()
    .from(s.invoices)
    .where(and(tenantScope(session, s.invoices), eq(s.invoices.id, args.invoiceId)))
    .limit(1);
  if (!invoice) return { error: "invoice_not_found" };

  const received = args.receivedAt ?? new Date();
  await db.insert(s.payments).values({
    invoiceId: args.invoiceId,
    receivedAt: received,
    amountCents: args.amountCents,
    method: args.method,
    reference: args.reference,
  });

  const paymentsAll = await db.select().from(s.payments).where(eq(s.payments.invoiceId, args.invoiceId));
  const totalPaid = paymentsAll.reduce((a, p) => a + p.amountCents, 0);

  let nextStatus: string = invoice.status;
  let paidAt: Date | null = invoice.paidAt;
  if (totalPaid >= invoice.totalCents) { nextStatus = "paid";    paidAt = received; }
  else if (totalPaid > 0)              { nextStatus = "partial"; }

  await db
    .update(s.invoices)
    .set({ status: nextStatus as never, paidAt: paidAt ?? undefined })
    .where(and(tenantScope(session, s.invoices), eq(s.invoices.id, args.invoiceId)));

  await writeAudit(session, {
    action: "invoice_payment_recorded",
    entityKind: "invoice",
    entityId: args.invoiceId,
    afterJson: { amountCents: args.amountCents, method: args.method, reference: args.reference, totalPaid, status: nextStatus },
  });
  return { ok: true };
}

export async function getSubscription(session: Session) {
  if (!dbReady) return null;
  const [row] = await db
    .select({
      subscriptionId: s.subscriptions.id,
      status: s.subscriptions.status,
      trialEndsAt: s.subscriptions.trialEndsAt,
      currentPeriodEndsAt: s.subscriptions.currentPeriodEndsAt,
      seatsInUse: s.subscriptions.seatsInUse,
      planId: s.plans.id,
      planName: s.plans.name,
      planTier: s.plans.tier,
      priceUsd: s.plans.monthlyPriceUsd,
      seatsIncluded: s.plans.seats,
    })
    .from(s.subscriptions)
    .innerJoin(s.plans, eq(s.plans.id, s.subscriptions.planId))
    .where(tenantScope(session, s.subscriptions))
    .limit(1);
  return row ?? null;
}

export async function listPlans() {
  if (!dbReady) return [];
  return db.select().from(s.plans).orderBy(asc(s.plans.monthlyPriceUsd));
}

export async function setSubscriptionPlan(session: Session, planId: string): Promise<void> {
  if (!dbReady) return;
  const [before] = await db
    .select()
    .from(s.subscriptions)
    .where(tenantScope(session, s.subscriptions))
    .limit(1);
  if (!before) return;
  await db
    .update(s.subscriptions)
    .set({ planId })
    .where(and(tenantScope(session, s.subscriptions), eq(s.subscriptions.id, before.id)));
  await writeAudit(session, {
    action: "subscription_plan_changed",
    entityKind: "subscription",
    entityId: before.id,
    beforeJson: { planId: before.planId },
    afterJson: { planId },
  });
}

export async function listUsage(session: Session, sinceDays = 30) {
  if (!dbReady) return [] as Array<{ kind: string; amountCents: number; occurredAt: Date }>;
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  return db
    .select({ kind: s.usageMeters.kind, amountCents: s.usageMeters.amountCents, occurredAt: s.usageMeters.occurredAt })
    .from(s.usageMeters)
    .where(and(tenantScope(session, s.usageMeters), gte(s.usageMeters.occurredAt, since)))
    .orderBy(desc(s.usageMeters.occurredAt));
}

export async function billingCounters(session: Session): Promise<{
  outstandingUsd: number; overdueUsd: number; paidThisMonthUsd: number; unbilledWipUsd: number;
}> {
  if (!dbReady) return { outstandingUsd: 0, overdueUsd: 0, paidThisMonthUsd: 0, unbilledWipUsd: 0 };

  const invoices = await listInvoices(session);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const outstanding = invoices.reduce((a, i) => a + i.outstandingCents, 0);
  const overdue = invoices
    .filter((i) => i.dueAt && i.dueAt < now && i.status !== "paid")
    .reduce((a, i) => a + i.outstandingCents, 0);
  const paidThisMonth = invoices
    .filter((i) => i.paidAt && i.paidAt >= monthStart)
    .reduce((a, i) => a + (i.totalCents - i.outstandingCents), 0);

  const wip = await listUnbilledWipByCase(session);
  const unbilled = wip.reduce((a, c) => a + c.unbilledCents, 0);

  return {
    outstandingUsd: Math.round(outstanding / 100),
    overdueUsd: Math.round(overdue / 100),
    paidThisMonthUsd: Math.round(paidThisMonth / 100),
    unbilledWipUsd: Math.round(unbilled / 100),
  };
}

// silence linter on imported helpers we may use in later steps
void asc;
void lt;
type _Unused = SQL;
type __ = _Unused;
