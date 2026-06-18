/**
 * Sprint 18.2 — Profitability dashboards.
 *
 *   Per-matter   realisation = paid_revenue / billable_hours_value
 *   Per-lawyer   effective rate = paid_revenue_attributed / hours_logged
 *   Per-client   lifetime value = sum(paid_invoices)
 *
 * Inputs: time_entries (billable_minutes × user rate), invoices, payments,
 *         memberships (user rate).
 * Outputs: row-shaped views the firm-dashboard widget + the /billing/
 *          profitability page render directly.
 */
import { eq, inArray } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type MatterProfitability = {
  caseId: string;
  matterTitle: string;
  billableMinutes: number;
  billableValueCents: number;
  invoicedCents: number;
  paidCents: number;
  realisationPct: number;
};

export type LawyerProfitability = {
  userId: string;
  fullName: string;
  billableHours: number;
  hourlyRateCents: number;
  billableValueCents: number;
  attributedRevenueCents: number;
  effectiveRateCents: number;
};

export type ClientProfitability = {
  clientTenantId: string;
  clientName: string;
  paidCents: number;
  outstandingCents: number;
  invoiceCount: number;
};

export type ProfitabilitySnapshot = {
  matters: MatterProfitability[];
  lawyers: LawyerProfitability[];
  clients: ClientProfitability[];
  firmTotals: {
    billableMinutes: number;
    billableValueCents: number;
    invoicedCents: number;
    paidCents: number;
    realisationPct: number;
  };
};

export async function snapshot(session: Session): Promise<ProfitabilitySnapshot> {
  const empty: ProfitabilitySnapshot = {
    matters: [], lawyers: [], clients: [],
    firmTotals: { billableMinutes: 0, billableValueCents: 0, invoicedCents: 0, paidCents: 0, realisationPct: 0 },
  };
  if (!dbReady) return empty;

  // Pull tenant-scoped time entries.
  const times = await db
    .select({
      id: s.timeEntries.id,
      userId: s.timeEntries.userId,
      caseId: s.timeEntries.caseId,
      minutes: s.timeEntries.minutes,
      rateCents: s.timeEntries.rateCents,
      billable: s.timeEntries.billable,
    })
    .from(s.timeEntries)
    .where(tenantScope(session, s.timeEntries));

  const invoices = await db
    .select({
      id: s.invoices.id,
      caseId: s.invoices.caseId,
      toTenantId: s.invoices.toTenantId,
      totalCents: s.invoices.totalCents,
      status: s.invoices.status,
    })
    .from(s.invoices)
    .where(tenantScope(session, s.invoices));

  const invoiceIds = invoices.map((i) => i.id);
  const pays = invoiceIds.length === 0 ? []
    : await db.select({ invoiceId: s.payments.invoiceId, amountCents: s.payments.amountCents }).from(s.payments).where(inArray(s.payments.invoiceId, invoiceIds));
  const paidByInvoice = new Map<string, number>();
  for (const p of pays) paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.amountCents);

  // Index matters + lawyers.
  const caseIds = Array.from(new Set([
    ...times.map((t) => t.caseId).filter((x): x is string => !!x),
    ...invoices.map((i) => i.caseId).filter((x): x is string => !!x),
  ]));
  const cases = caseIds.length === 0 ? []
    : await db.select({ id: s.cases.id, title: s.cases.title, clientTenantId: s.cases.clientTenantId }).from(s.cases).where(inArray(s.cases.id, caseIds));
  const caseById = new Map(cases.map((c) => [c.id, c]));

  const userIds = Array.from(new Set(times.map((t) => t.userId)));
  const userRows = userIds.length === 0 ? []
    : await db.select({ id: s.users.id, fullName: s.users.fullName }).from(s.users).where(inArray(s.users.id, userIds));
  const userById = new Map(userRows.map((u) => [u.id, u]));

  const clientIds = Array.from(new Set([
    ...invoices.map((i) => i.toTenantId).filter((x): x is string => !!x),
    ...cases.map((c) => c.clientTenantId).filter((x): x is string => !!x),
  ]));
  const tenantRows = clientIds.length === 0 ? []
    : await db.select({ id: s.tenants.id, name: s.tenants.name }).from(s.tenants).where(inArray(s.tenants.id, clientIds));
  const tenantById = new Map(tenantRows.map((t) => [t.id, t]));

  // Aggregations.
  const matterAgg = new Map<string, MatterProfitability>();
  for (const t of times) {
    if (!t.caseId || !t.billable) continue;
    const c = caseById.get(t.caseId);
    if (!c) continue;
    const row = matterAgg.get(t.caseId) ?? {
      caseId: t.caseId,
      matterTitle: c.title,
      billableMinutes: 0,
      billableValueCents: 0,
      invoicedCents: 0,
      paidCents: 0,
      realisationPct: 0,
    };
    row.billableMinutes += t.minutes;
    row.billableValueCents += Math.round((t.minutes / 60) * t.rateCents);
    matterAgg.set(t.caseId, row);
  }
  for (const i of invoices) {
    if (!i.caseId) continue;
    const row = matterAgg.get(i.caseId);
    if (!row) continue;
    row.invoicedCents += i.totalCents;
    row.paidCents += paidByInvoice.get(i.id) ?? 0;
  }
  for (const row of matterAgg.values()) {
    row.realisationPct = row.billableValueCents > 0 ? Math.round((row.paidCents / row.billableValueCents) * 1000) / 10 : 0;
  }

  const lawyerAgg = new Map<string, LawyerProfitability>();
  for (const t of times) {
    if (!t.billable) continue;
    const u = userById.get(t.userId);
    if (!u) continue;
    const row = lawyerAgg.get(t.userId) ?? {
      userId: t.userId,
      fullName: u.fullName,
      billableHours: 0,
      hourlyRateCents: t.rateCents,
      billableValueCents: 0,
      attributedRevenueCents: 0,
      effectiveRateCents: 0,
    };
    row.billableHours += t.minutes / 60;
    row.billableValueCents += Math.round((t.minutes / 60) * t.rateCents);
    lawyerAgg.set(t.userId, row);
  }
  // Attribute revenue by share of billable value per matter.
  for (const matter of matterAgg.values()) {
    if (matter.billableValueCents === 0 || matter.paidCents === 0) continue;
    const matterTimes = times.filter((t) => t.caseId === matter.caseId && t.billable);
    const matterTotalValue = matterTimes.reduce((a, t) => a + Math.round((t.minutes / 60) * t.rateCents), 0);
    if (matterTotalValue === 0) continue;
    for (const t of matterTimes) {
      const row = lawyerAgg.get(t.userId);
      if (!row) continue;
      const share = Math.round((t.minutes / 60) * t.rateCents) / matterTotalValue;
      row.attributedRevenueCents += Math.round(matter.paidCents * share);
    }
  }
  for (const row of lawyerAgg.values()) {
    row.effectiveRateCents = row.billableHours > 0 ? Math.round(row.attributedRevenueCents / row.billableHours) : 0;
  }

  const clientAgg = new Map<string, ClientProfitability>();
  for (const i of invoices) {
    const clientId = i.toTenantId ?? (i.caseId ? caseById.get(i.caseId)?.clientTenantId ?? null : null);
    if (!clientId) continue;
    const t = tenantById.get(clientId);
    if (!t) continue;
    const row = clientAgg.get(clientId) ?? {
      clientTenantId: clientId,
      clientName: t.name,
      paidCents: 0,
      outstandingCents: 0,
      invoiceCount: 0,
    };
    const paid = paidByInvoice.get(i.id) ?? 0;
    row.paidCents += paid;
    row.outstandingCents += Math.max(0, i.totalCents - paid);
    row.invoiceCount += 1;
    clientAgg.set(clientId, row);
  }

  const firmTotals = {
    billableMinutes: [...matterAgg.values()].reduce((a, n) => a + n.billableMinutes, 0),
    billableValueCents: [...matterAgg.values()].reduce((a, n) => a + n.billableValueCents, 0),
    invoicedCents: [...matterAgg.values()].reduce((a, n) => a + n.invoicedCents, 0),
    paidCents: [...matterAgg.values()].reduce((a, n) => a + n.paidCents, 0),
    realisationPct: 0,
  };
  firmTotals.realisationPct = firmTotals.billableValueCents > 0
    ? Math.round((firmTotals.paidCents / firmTotals.billableValueCents) * 1000) / 10
    : 0;

  return {
    matters: [...matterAgg.values()].sort((a, b) => b.paidCents - a.paidCents),
    lawyers: [...lawyerAgg.values()].sort((a, b) => b.attributedRevenueCents - a.attributedRevenueCents),
    clients: [...clientAgg.values()].sort((a, b) => b.paidCents - a.paidCents),
    firmTotals,
  };
}

void eq;
