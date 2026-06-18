/**
 * Growth Intelligence — Sprint 21.
 *
 * Turns the firm's history into hunting intelligence:
 *
 *   practiceMomentum() — deal count + value over last 12 months, by kind
 *   depthRadar()       — where the firm has true competence (count, avg
 *                        duration, on-time %, realisation %)
 *   clientLens()       — LTV distribution, cross-sell potential, lapsed
 *                        clients, top 10
 *   winRate()          — intake → engaged conversion by kind / region
 *   firmDepthByKind()  — per-process-kind depth used by the predictor +
 *                        prospect lookalike scorer
 *
 * Everything is computed from cases × time_entries × invoices ×
 * intake_requests × matter_processes × processes. Tenant-scoped; reads only.
 */
import { and, desc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

const MONTHS_BACK = 12;

// ──────────────────────────────────────────────────────────────────────
// Practice momentum — count + value by kind, by month
// ──────────────────────────────────────────────────────────────────────

export type MomentumPoint = {
  yyyymm: string;             // "2026-06"
  kind: string;               // process kind ("ma_buyside" etc.)
  count: number;
  valueCents: number;         // invoice total in that month for matters of that kind
};

export type PracticeMomentum = {
  series: MomentumPoint[];
  byKind: Array<{ kind: string; count: number; valueCents: number; growthPct: number }>;
  byRegion: Array<{ region: string; count: number; valueCents: number }>;
};

export async function practiceMomentum(session: Session): Promise<PracticeMomentum> {
  if (!dbReady) return { series: [], byKind: [], byRegion: [] };

  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - MONTHS_BACK);

  // Pull matter × process kind + opened/closed dates.
  const matters = await db
    .select({
      caseId: s.cases.id,
      openedAt: s.cases.openedAt,
      region: s.cases.region,
      processKind: s.processes.kind,
    })
    .from(s.cases)
    .leftJoin(s.matterProcesses, eq(s.matterProcesses.caseId, s.cases.id))
    .leftJoin(s.processes, eq(s.processes.id, s.matterProcesses.processId))
    .where(and(tenantScope(session, s.cases), gte(s.cases.openedAt, cutoff)));

  // Invoice totals per matter.
  const invoiceRows = await db
    .select({ caseId: s.invoices.caseId, totalCents: s.invoices.totalCents })
    .from(s.invoices)
    .where(and(tenantScope(session, s.invoices), isNotNull(s.invoices.caseId)));
  const valueByCase = new Map<string, number>();
  for (const r of invoiceRows) if (r.caseId) valueByCase.set(r.caseId, (valueByCase.get(r.caseId) ?? 0) + r.totalCents);

  // Roll into (yyyymm, kind) buckets.
  const seriesMap = new Map<string, MomentumPoint>();
  const kindAgg = new Map<string, { count: number; valueCents: number; recentValue: number; priorValue: number }>();
  const regionAgg = new Map<string, { count: number; valueCents: number }>();
  const sixMoCut = new Date(); sixMoCut.setMonth(sixMoCut.getMonth() - 6);

  for (const m of matters) {
    const kind = m.processKind ?? "other";
    const yyyymm = m.openedAt.toISOString().slice(0, 7);
    const seriesKey = `${yyyymm}|${kind}`;
    const p = seriesMap.get(seriesKey) ?? { yyyymm, kind, count: 0, valueCents: 0 };
    p.count += 1;
    const v = valueByCase.get(m.caseId) ?? 0;
    p.valueCents += v;
    seriesMap.set(seriesKey, p);

    const k = kindAgg.get(kind) ?? { count: 0, valueCents: 0, recentValue: 0, priorValue: 0 };
    k.count += 1;
    k.valueCents += v;
    if (m.openedAt >= sixMoCut) k.recentValue += v;
    else k.priorValue += v;
    kindAgg.set(kind, k);

    const r = regionAgg.get(m.region) ?? { count: 0, valueCents: 0 };
    r.count += 1; r.valueCents += v;
    regionAgg.set(m.region, r);
  }

  const byKind = [...kindAgg.entries()].map(([kind, k]) => ({
    kind,
    count: k.count,
    valueCents: k.valueCents,
    growthPct: k.priorValue > 0 ? Math.round(((k.recentValue - k.priorValue) / k.priorValue) * 1000) / 10 : (k.recentValue > 0 ? 100 : 0),
  })).sort((a, b) => b.valueCents - a.valueCents);

  const byRegion = [...regionAgg.entries()].map(([region, r]) => ({ region, ...r }));

  return {
    series: [...seriesMap.values()].sort((a, b) => a.yyyymm.localeCompare(b.yyyymm)),
    byKind,
    byRegion,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Depth radar — per practice-area competence signal
// ──────────────────────────────────────────────────────────────────────

export type DepthRow = {
  kind: string;
  matters: number;
  closed: number;
  avgDurationDays: number;
  onTimePct: number;
  totalValueCents: number;
};

export async function depthRadar(session: Session): Promise<DepthRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      caseId: s.cases.id,
      openedAt: s.cases.openedAt,
      closedAt: s.cases.closedAt,
      kind: s.processes.kind,
      expectedDays: s.processes.expectedDurationDays,
    })
    .from(s.cases)
    .innerJoin(s.matterProcesses, eq(s.matterProcesses.caseId, s.cases.id))
    .innerJoin(s.processes, eq(s.processes.id, s.matterProcesses.processId))
    .where(tenantScope(session, s.cases));

  const ids = rows.map((r) => r.caseId);
  const inv = ids.length === 0 ? [] : await db
    .select({ caseId: s.invoices.caseId, totalCents: s.invoices.totalCents })
    .from(s.invoices)
    .where(and(tenantScope(session, s.invoices), inArray(s.invoices.caseId, ids)));
  const valueByCase = new Map<string, number>();
  for (const r of inv) if (r.caseId) valueByCase.set(r.caseId, (valueByCase.get(r.caseId) ?? 0) + r.totalCents);

  const agg = new Map<string, { matters: number; closed: number; durations: number[]; onTimeHits: number; value: number }>();
  for (const r of rows) {
    const k = r.kind;
    const v = agg.get(k) ?? { matters: 0, closed: 0, durations: [], onTimeHits: 0, value: 0 };
    v.matters += 1;
    v.value += valueByCase.get(r.caseId) ?? 0;
    if (r.closedAt) {
      const d = Math.round((r.closedAt.getTime() - r.openedAt.getTime()) / 86400_000);
      v.closed += 1;
      v.durations.push(d);
      const expected = r.expectedDays ?? d;
      if (d <= expected * 1.1) v.onTimeHits += 1;
    }
    agg.set(k, v);
  }
  return [...agg.entries()].map(([kind, v]) => ({
    kind,
    matters: v.matters,
    closed: v.closed,
    avgDurationDays: v.durations.length ? Math.round(v.durations.reduce((a, n) => a + n, 0) / v.durations.length) : 0,
    onTimePct: v.closed > 0 ? Math.round((v.onTimeHits / v.closed) * 1000) / 10 : 0,
    totalValueCents: v.value,
  })).sort((a, b) => b.matters - a.matters);
}

// ──────────────────────────────────────────────────────────────────────
// Client lens — LTV, cross-sell, lapsed
// ──────────────────────────────────────────────────────────────────────

export type ClientRow = {
  clientTenantId: string;
  clientName: string;
  matters: number;
  paidCents: number;
  outstandingCents: number;
  uniqueKinds: number;        // cross-sell signal
  lastMatterAt: Date | null;
  daysSinceLastMatter: number | null;
};

export async function clientLens(session: Session): Promise<{
  rows: ClientRow[];
  totals: { clients: number; ltvCents: number; lapsedCount: number };
}> {
  if (!dbReady) return { rows: [], totals: { clients: 0, ltvCents: 0, lapsedCount: 0 } };

  const cases = await db
    .select({
      id: s.cases.id,
      clientTenantId: s.cases.clientTenantId,
      openedAt: s.cases.openedAt,
      processKind: s.processes.kind,
    })
    .from(s.cases)
    .leftJoin(s.matterProcesses, eq(s.matterProcesses.caseId, s.cases.id))
    .leftJoin(s.processes, eq(s.processes.id, s.matterProcesses.processId))
    .where(tenantScope(session, s.cases));

  const ids = cases.map((c) => c.id);
  const inv = ids.length === 0 ? [] : await db
    .select({ caseId: s.invoices.caseId, totalCents: s.invoices.totalCents, id: s.invoices.id })
    .from(s.invoices)
    .where(and(tenantScope(session, s.invoices), inArray(s.invoices.caseId, ids)));
  const invoiceIds = inv.map((i) => i.id);
  const pays = invoiceIds.length === 0 ? [] : await db
    .select({ invoiceId: s.payments.invoiceId, amountCents: s.payments.amountCents })
    .from(s.payments)
    .where(inArray(s.payments.invoiceId, invoiceIds));
  const paidByInvoice = new Map<string, number>();
  for (const p of pays) paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.amountCents);

  const tenantIds = Array.from(new Set(cases.map((c) => c.clientTenantId).filter((x): x is string => !!x)));
  const tenantRows = tenantIds.length === 0 ? []
    : await db.select({ id: s.tenants.id, name: s.tenants.name }).from(s.tenants).where(inArray(s.tenants.id, tenantIds));
  const tenantById = new Map(tenantRows.map((t) => [t.id, t]));

  const agg = new Map<string, ClientRow>();
  for (const c of cases) {
    const cid = c.clientTenantId;
    if (!cid) continue;
    const t = tenantById.get(cid);
    if (!t) continue;
    const row = agg.get(cid) ?? {
      clientTenantId: cid,
      clientName: t.name,
      matters: 0,
      paidCents: 0,
      outstandingCents: 0,
      uniqueKinds: 0,
      lastMatterAt: null,
      daysSinceLastMatter: null,
    };
    row.matters += 1;
    if (!row.lastMatterAt || c.openedAt > row.lastMatterAt) row.lastMatterAt = c.openedAt;
    // we'll accumulate kinds in a side set; store on the row via a workaround
    (row as unknown as { _kinds?: Set<string> })._kinds ??= new Set<string>();
    if (c.processKind) (row as unknown as { _kinds: Set<string> })._kinds.add(c.processKind);
    agg.set(cid, row);
  }
  for (const i of inv) {
    if (!i.caseId) continue;
    const c = cases.find((x) => x.id === i.caseId);
    if (!c?.clientTenantId) continue;
    const row = agg.get(c.clientTenantId);
    if (!row) continue;
    const paid = paidByInvoice.get(i.id) ?? 0;
    row.paidCents += paid;
    row.outstandingCents += Math.max(0, i.totalCents - paid);
  }

  const now = Date.now();
  for (const row of agg.values()) {
    row.uniqueKinds = (row as unknown as { _kinds?: Set<string> })._kinds?.size ?? 0;
    delete (row as unknown as { _kinds?: Set<string> })._kinds;
    row.daysSinceLastMatter = row.lastMatterAt ? Math.floor((now - row.lastMatterAt.getTime()) / 86400_000) : null;
  }
  const rows = [...agg.values()].sort((a, b) => b.paidCents - a.paidCents);
  return {
    rows,
    totals: {
      clients: rows.length,
      ltvCents: rows.reduce((a, n) => a + n.paidCents, 0),
      lapsedCount: rows.filter((r) => (r.daysSinceLastMatter ?? 0) > 365).length,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────
// Win rate — intake → engaged conversion
// ──────────────────────────────────────────────────────────────────────

export type WinRateRow = { bucket: string; intakes: number; engaged: number; pct: number };

export async function winRate(session: Session): Promise<{ byKind: WinRateRow[]; byRegion: WinRateRow[]; overallPct: number }> {
  if (!dbReady) return { byKind: [], byRegion: [], overallPct: 0 };

  const rows = await db
    .select({
      status: s.intakeRequests.status,
      region: s.intakeRequests.region,
      func: s.intakeRequests.legalFunction,
    })
    .from(s.intakeRequests)
    .where(tenantScope(session, s.intakeRequests));

  const kindAgg = new Map<string, { intakes: number; engaged: number }>();
  const regionAgg = new Map<string, { intakes: number; engaged: number }>();
  for (const r of rows) {
    const k = (r.func ?? "other").toString();
    const kk = kindAgg.get(k) ?? { intakes: 0, engaged: 0 };
    kk.intakes += 1; if (r.status === "engaged") kk.engaged += 1; kindAgg.set(k, kk);
    const rr = regionAgg.get(r.region) ?? { intakes: 0, engaged: 0 };
    rr.intakes += 1; if (r.status === "engaged") rr.engaged += 1; regionAgg.set(r.region, rr);
  }
  const pack = (m: Map<string, { intakes: number; engaged: number }>): WinRateRow[] =>
    [...m.entries()].map(([bucket, v]) => ({ bucket, intakes: v.intakes, engaged: v.engaged, pct: v.intakes > 0 ? Math.round((v.engaged / v.intakes) * 1000) / 10 : 0 }));

  const overall = rows.length === 0 ? 0 : Math.round((rows.filter((r) => r.status === "engaged").length / rows.length) * 1000) / 10;
  return { byKind: pack(kindAgg), byRegion: pack(regionAgg), overallPct: overall };
}

// ──────────────────────────────────────────────────────────────────────
// Composite — one call for the dashboard
// ──────────────────────────────────────────────────────────────────────

export async function growthSnapshot(session: Session) {
  const [momentum, depth, clients, win] = await Promise.all([
    practiceMomentum(session),
    depthRadar(session),
    clientLens(session),
    winRate(session),
  ]);
  return { momentum, depth, clients, win };
}

void desc;
