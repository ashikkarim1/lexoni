/**
 * Passive time — drafts, the confirm-sweep, and WIP.
 *
 *   activity_events           (captured automatically)
 *        │
 *        ▼
 *   time_entry_drafts         (surfaced on Desk → "Time to confirm")
 *        │  Confirm
 *        ▼
 *   time_entries              (source='passive', confirmedAt=now)  →  WIP
 *
 * In mock mode (`dbReady === false`) every function falls back to lib/mock
 * so the demo UI still has content.
 */
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import { timeToConfirm, type TimeToConfirm, lawyers, leakage } from "@/lib/mock";

const FALLBACK_RATE_CENTS = 65000; // $650/h — partner rate from the seed.

export type DraftRow = {
  id: string;
  matter: string;
  matterNumber: string;
  activity: string;
  source: string;
  minutes: number;
  rateUsd: number;
};

export async function listDraftsForSession(session: Session): Promise<DraftRow[]> {
  if (!dbReady) return timeToConfirm.map(mapMockDraft);

  // Drafts authored by this user that haven't been confirmed yet.
  const drafts = await db
    .select({
      draftId: s.timeEntryDrafts.id,
      minutes: s.timeEntryDrafts.minutes,
      description: s.timeEntryDrafts.description,
      source: s.timeEntryDrafts.source,
      caseId: s.timeEntryDrafts.caseId,
    })
    .from(s.timeEntryDrafts)
    .where(
      and(
        tenantScope(session, s.timeEntryDrafts),
        eq(s.timeEntryDrafts.userId, session.userId),
        isNull(s.timeEntryDrafts.confirmedAt),
      ),
    )
    .orderBy(desc(s.timeEntryDrafts.workedOn));

  if (drafts.length === 0) return [];

  const caseIds = Array.from(new Set(drafts.map((d) => d.caseId).filter((x): x is string => !!x)));
  const cases = caseIds.length
    ? await db
        .select({ id: s.cases.id, title: s.cases.title, matterNumber: s.cases.matterNumber })
        .from(s.cases)
        .where(and(tenantScope(session, s.cases), inArray(s.cases.id, caseIds)))
    : [];
  const caseById = new Map(cases.map((c) => [c.id, c]));

  const [rateRow] = await db
    .select({ rate: s.memberships.hourlyRateCents })
    .from(s.memberships)
    .where(and(tenantScope(session, s.memberships), eq(s.memberships.userId, session.userId)))
    .limit(1);
  const rateUsd = (rateRow?.rate ?? FALLBACK_RATE_CENTS) / 100;

  return drafts.map((d) => {
    const c = d.caseId ? caseById.get(d.caseId) : undefined;
    return {
      id: d.draftId,
      matter: c?.title ?? "—",
      matterNumber: c?.matterNumber ?? "—",
      activity: d.description ?? "",
      source: d.source,
      minutes: d.minutes,
      rateUsd,
    };
  });
}

/**
 * Confirm `draftIds` for `session.userId`. Each draft becomes a `time_entries`
 * row with `source='passive'` + `confirmedAt=now`, and the draft is marked
 * reconciled. Returns the inserted entry IDs and totals so the caller can
 * recompute WIP / show a toast.
 */
export async function confirmDrafts(
  session: Session,
  draftIds: string[],
): Promise<{ confirmed: number; minutes: number; cents: number; entryIds: string[] }> {
  if (!dbReady || draftIds.length === 0) {
    return { confirmed: 0, minutes: 0, cents: 0, entryIds: [] };
  }

  const drafts = await db
    .select()
    .from(s.timeEntryDrafts)
    .where(
      and(
        tenantScope(session, s.timeEntryDrafts),
        inArray(s.timeEntryDrafts.id, draftIds),
        eq(s.timeEntryDrafts.userId, session.userId),
        isNull(s.timeEntryDrafts.confirmedAt),
      ),
    );

  if (drafts.length === 0) return { confirmed: 0, minutes: 0, cents: 0, entryIds: [] };

  const [rateRow] = await db
    .select({ rate: s.memberships.hourlyRateCents })
    .from(s.memberships)
    .where(and(tenantScope(session, s.memberships), eq(s.memberships.userId, session.userId)))
    .limit(1);
  const rateCents = rateRow?.rate ?? FALLBACK_RATE_CENTS;

  const now = new Date();
  const entryIds: string[] = [];
  let totalMinutes = 0;
  let totalCents = 0;

  for (const d of drafts) {
    const [entry] = await db
      .insert(s.timeEntries)
      .values({
        tenantId: session.tenantId,
        caseId: d.caseId,
        userId: session.userId,
        workedOn: d.workedOn,
        minutes: d.minutes,
        description: d.description ?? "",
        rateCents,
        billable: d.billable,
        source: "passive",
        confirmedAt: now,
      })
      .returning({ id: s.timeEntries.id });
    entryIds.push(entry.id);
    totalMinutes += d.minutes;
    totalCents += Math.round((d.minutes / 60) * rateCents);

    await db
      .update(s.timeEntryDrafts)
      .set({ confirmedAt: now, confirmedTimeEntryId: entry.id })
      .where(eq(s.timeEntryDrafts.id, d.id));

    await writeAudit(session, {
      action: "time_draft_confirmed",
      entityKind: "time_entry_draft",
      entityId: d.id,
      beforeJson: { confirmedAt: null },
      afterJson: { confirmedAt: now.toISOString(), timeEntryId: entry.id, minutes: d.minutes, rateCents },
    });
  }

  return { confirmed: drafts.length, minutes: totalMinutes, cents: totalCents, entryIds };
}

/**
 * Firm-wide WIP — unbilled, billable time_entries valued at their stored rate.
 * Returns total + aged (>45 days) so Firm Pulse can render both.
 */
export async function computeFirmWip(session: Session): Promise<{ totalUsd: number; agedUsd: number; entries: number }> {
  if (!dbReady) {
    // Mock: use the static numbers from lib/mock so the demo still has content.
    const { firmVitality } = await import("@/lib/mock");
    return {
      totalUsd: firmVitality.wipTotalUsd,
      agedUsd: firmVitality.wipAgedUsd,
      entries: 0,
    };
  }

  const rows = await db
    .select({
      minutes: s.timeEntries.minutes,
      rateCents: s.timeEntries.rateCents,
      workedOn: s.timeEntries.workedOn,
    })
    .from(s.timeEntries)
    .where(
      and(
        tenantScope(session, s.timeEntries),
        eq(s.timeEntries.billable, true),
        isNull(s.timeEntries.invoiceId),
      ),
    );

  const now = Date.now();
  let totalCents = 0;
  let agedCents = 0;
  for (const r of rows) {
    const value = Math.round((r.minutes / 60) * r.rateCents);
    totalCents += value;
    const ageDays = (now - r.workedOn.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 45) agedCents += value;
  }
  return { totalUsd: Math.round(totalCents / 100), agedUsd: Math.round(agedCents / 100), entries: rows.length };
}

/** This session's recoverable amount (drafts × rate) — surfaced on Desk. */
export async function computeRecoverable(session: Session): Promise<{ minutes: number; usd: number }> {
  const drafts = await listDraftsForSession(session);
  const minutes = drafts.reduce((a, d) => a + d.minutes, 0);
  const usd = drafts.reduce((a, d) => a + (d.minutes / 60) * d.rateUsd, 0);
  return { minutes, usd: Math.round(usd) };
}

/** Firm-wide open leakage — surfaced on Firm Pulse. */
export async function computeFirmLeakage(session: Session): Promise<{ totalUsd: number; count: number }> {
  if (!dbReady) {
    const total = leakage.reduce((a, l) => a + l.amountUsd, 0);
    return { totalUsd: total, count: leakage.length };
  }
  const rows = await db
    .select({ amount: s.leakageAlerts.amountAtRiskCents })
    .from(s.leakageAlerts)
    .where(and(tenantScope(session, s.leakageAlerts), isNull(s.leakageAlerts.resolvedAt)));
  const totalCents = rows.reduce((a, r) => a + (r.amount ?? 0), 0);
  return { totalUsd: Math.round(totalCents / 100), count: rows.length };
}

function mapMockDraft(t: TimeToConfirm): DraftRow {
  return {
    id: t.id,
    matter: t.matter,
    matterNumber: t.matterNumber,
    activity: t.activity,
    source: t.source,
    minutes: t.minutes,
    rateUsd: t.rateUsd,
  };
}

// Re-export the lawyers helper so existing callers can still import from one place.
export { lawyers };
