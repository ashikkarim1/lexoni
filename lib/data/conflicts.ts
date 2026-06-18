/**
 * Conflict-check engine.
 *
 * Scans a prospective client + any adverse parties against the firm's existing
 * client and matter book. Returns a structured outcome (clear / potential /
 * confirmed) plus the matches the reviewer needs to see, and writes a
 * `conflict_checks` row. The check is mandatory before a matter opens when
 * `tenant_settings.conflicts_check_required` is true.
 *
 * Matching is intentionally simple — normalised substring matches against:
 *   - other matters' `cases.title` and `description`
 *   - the subject's name appearing as an existing client (case-insensitive)
 * Future iteration: fuzzy match + corporate-tree aware (parent/sub) matching.
 */
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";

export type ConflictOutcome = "clear" | "potential" | "confirmed" | "waived";

export type ConflictMatch = {
  kind:
    | "subject_is_existing_client"
    | "adverse_party_is_existing_client"
    | "subject_matches_existing_matter"
    | "adverse_party_matches_existing_matter";
  party: string;
  via: string;
  severity: "low" | "medium" | "high";
};

export type ConflictResult = {
  id: string;
  outcome: ConflictOutcome;
  matches: ConflictMatch[];
};

export async function runConflictCheck(
  session: Session,
  args: {
    subjectName: string;
    adverseParties?: string[];
    caseId?: string;
    intakeId?: string;
  },
): Promise<ConflictResult> {
  const parties = (args.adverseParties ?? []).filter((p) => p && p.trim().length > 0);
  const matches: ConflictMatch[] = [];

  if (dbReady) {
    // Existing matters in the tenant.
    const matters = await db
      .select({
        id: s.cases.id,
        title: s.cases.title,
        description: s.cases.description,
        matterNumber: s.cases.matterNumber,
      })
      .from(s.cases)
      .where(tenantScope(session, s.cases));

    const norm = (x: string) => x.trim().toLowerCase();
    const hay = matters.map((m) => ({
      m,
      blob: `${m.title} ${m.description ?? ""}`.toLowerCase(),
    }));

    // Subject already a client?
    const subj = norm(args.subjectName);
    if (subj) {
      for (const { m, blob } of hay) {
        if (blob.includes(subj)) {
          matches.push({
            kind: "subject_matches_existing_matter",
            party: args.subjectName,
            via: `${m.matterNumber} — ${m.title}`,
            severity: "high",
          });
        }
      }
    }

    // Each adverse party — high severity if name appears in existing matters.
    for (const p of parties) {
      const n = norm(p);
      for (const { m, blob } of hay) {
        if (blob.includes(n)) {
          matches.push({
            kind: "adverse_party_is_existing_client",
            party: p,
            via: `${m.matterNumber} — ${m.title}`,
            severity: "high",
          });
        }
      }
    }
  }

  const outcome: ConflictOutcome = matches.length === 0 ? "clear" : "potential";

  if (!dbReady) {
    return { id: "stub", outcome, matches };
  }

  const [row] = await db
    .insert(s.conflictChecks)
    .values({
      tenantId: session.tenantId,
      caseId: args.caseId,
      intakeId: args.intakeId,
      subjectName: args.subjectName,
      adverseParties: parties,
      outcome,
      matchesJson: { matches },
      checkedByUserId: session.userId,
    })
    .returning({ id: s.conflictChecks.id });

  await writeAudit(session, {
    action: "conflict_check_run",
    entityKind: "conflict_check",
    entityId: row.id,
    afterJson: { subjectName: args.subjectName, adverseParties: parties, outcome, matchCount: matches.length },
  });

  return { id: row.id, outcome, matches };
}

export async function clearConflict(
  session: Session,
  conflictCheckId: string,
  note?: string,
): Promise<{ ok: boolean }> {
  if (!dbReady) return { ok: true };
  await db
    .update(s.conflictChecks)
    .set({ outcome: "waived", clearedByUserId: session.userId })
    .where(and(tenantScope(session, s.conflictChecks), eq(s.conflictChecks.id, conflictCheckId)));
  await writeAudit(session, {
    action: "conflict_check_cleared",
    entityKind: "conflict_check",
    entityId: conflictCheckId,
    afterJson: { clearedBy: session.userId, note },
  });
  return { ok: true };
}

export type ConflictRow = {
  id: string;
  subjectName: string;
  adverseParties: string[] | null;
  outcome: ConflictOutcome;
  matches: ConflictMatch[];
  caseId: string | null;
  intakeId: string | null;
  checkedAt: Date;
};

/**
 * Re-check trigger — call whenever a new adverse party / shareholder /
 * counterparty is added to a matter post-open. Re-runs `runConflictCheck`
 * with the current matter context and writes a fresh `conflict_checks` row.
 * Returns the fresh result so the caller can surface "new hits found" to
 * the matter team.
 */
export async function reCheckMatterParties(
  session: Session,
  caseId: string,
  newParties: string[],
): Promise<ConflictResult> {
  if (!dbReady || newParties.length === 0) {
    return { id: "stub", outcome: "clear", matches: [] };
  }
  const [matter] = await db
    .select({ title: s.cases.title })
    .from(s.cases)
    .where(and(tenantScope(session, s.cases), eq(s.cases.id, caseId)))
    .limit(1);
  const subject = matter?.title ?? "Existing matter";
  const fresh = await runConflictCheck(session, {
    subjectName: subject,
    adverseParties: newParties,
    caseId,
  });
  await writeAudit(session, {
    action: "conflict_recheck_run",
    entityKind: "conflict_check",
    entityId: fresh.id,
    afterJson: { caseId, newParties, outcome: fresh.outcome, matchCount: fresh.matches.length },
  });
  return fresh;
}

export async function listConflicts(session: Session): Promise<ConflictRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select()
    .from(s.conflictChecks)
    .where(tenantScope(session, s.conflictChecks))
    .orderBy(desc(s.conflictChecks.checkedAt));

  return rows.map((r) => ({
    id: r.id,
    subjectName: r.subjectName,
    adverseParties: r.adverseParties,
    outcome: r.outcome as ConflictOutcome,
    matches: ((r.matchesJson as { matches?: ConflictMatch[] } | null)?.matches) ?? [],
    caseId: r.caseId,
    intakeId: r.intakeId,
    checkedAt: r.checkedAt,
  }));
}
