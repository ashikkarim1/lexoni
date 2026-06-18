/**
 * AI smart-prompt context assembly.
 *
 * Wall-aware: only returns clauses the requesting user is permitted to see.
 * Default-deny — if the matter sits inside any active wall_group, the caller
 * MUST be in `wall_memberships` for that group (or for the matter directly),
 * otherwise we return `denied: true` and the route refuses to draft.
 *
 * Clauses are tenant-scoped via `tenantScope()` and filtered by the matter's
 * region (UAE/KSA + the GLOBAL library) and language. Returns at most
 * `MAX_CLAUSES` snippets — enough for grounding, small enough to keep prompts
 * cheap.
 */
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

const MAX_CLAUSES = 6;

export type DraftContextEntry = { id: string; title: string; body: string };

export type DraftContext =
  | { allowed: true; matterId: string; caseId: string; region: string; language: string; jurisdiction: string; entries: DraftContextEntry[] }
  | { allowed: false; reason: "matter_not_found" | "wall_denied" };

export async function assembleDraftContext(
  session: Session,
  args: { matterId: string; language?: "en" | "ar" },
): Promise<DraftContext> {
  if (!dbReady) {
    // Mock mode: still pass the wall check (no DB to enforce), return no clauses.
    return {
      allowed: true,
      matterId: args.matterId,
      caseId: args.matterId,
      region: "UAE",
      language: args.language ?? "en",
      jurisdiction: "DIFC",
      entries: [],
    };
  }

  // 1. Resolve the matter and verify it exists in this tenant.
  const [matter] = await db
    .select({
      caseId: s.cases.id,
      region: s.cases.region,
      jurisdiction: s.cases.jurisdiction,
      procLanguage: s.processes.language,
    })
    .from(s.cases)
    .innerJoin(s.matterProcesses, eq(s.matterProcesses.caseId, s.cases.id))
    .innerJoin(s.processes, eq(s.processes.id, s.matterProcesses.processId))
    .where(and(tenantScope(session, s.cases), eq(s.cases.id, args.matterId)))
    .limit(1);

  if (!matter) return { allowed: false, reason: "matter_not_found" };

  // 2. Wall check: if this matter sits inside any OPEN wall_group, require
  //    membership (either the user directly, or the matter being walled with
  //    membership for the user via another channel).
  const wallRows = await db
    .select({ wallId: s.wallMemberships.wallGroupId })
    .from(s.wallMemberships)
    .innerJoin(s.wallGroups, eq(s.wallGroups.id, s.wallMemberships.wallGroupId))
    .where(
      and(
        tenantScope(session, s.wallGroups),
        eq(s.wallMemberships.caseId, args.matterId),
        isNull(s.wallGroups.closedAt),
        isNull(s.wallMemberships.removedAt),
      ),
    );

  if (wallRows.length > 0) {
    const wallIds = wallRows.map((r) => r.wallId);
    const memberships = await db
      .select({ id: s.wallMemberships.id })
      .from(s.wallMemberships)
      .where(
        and(
          inArray(s.wallMemberships.wallGroupId, wallIds),
          eq(s.wallMemberships.userId, session.userId),
          isNull(s.wallMemberships.removedAt),
        ),
      );
    if (memberships.length === 0) return { allowed: false, reason: "wall_denied" };
  }

  // 3. Pull clauses scoped to the matter's region (+ GLOBAL) and language.
  const language = args.language ?? matter.procLanguage ?? "en";
  const regionFilter = matter.region === "KSA"
    ? or(eq(s.clauses.region, "KSA" as const), eq(s.clauses.region, "GLOBAL" as const))
    : or(eq(s.clauses.region, "UAE" as const), eq(s.clauses.region, "GLOBAL" as const));

  const clauseRows = await db
    .select({ id: s.clauses.id, title: s.clauses.title, bodyMd: s.clauses.bodyMd })
    .from(s.clauses)
    .where(and(tenantScope(session, s.clauses), regionFilter!, eq(s.clauses.language, language)))
    .limit(MAX_CLAUSES);

  return {
    allowed: true,
    matterId: args.matterId,
    caseId: matter.caseId,
    region: matter.region,
    jurisdiction: matter.jurisdiction ?? "",
    language,
    entries: clauseRows.map((c) => ({ id: c.id, title: c.title, body: c.bodyMd })),
  };
}
