/**
 * Ethical wall reads + helpers.
 *
 * Default-deny model: a matter inside any OPEN `wall_groups` is invisible to
 * a user who isn't in `wall_memberships` for that wall (either as a member
 * directly, or because they have an approved `wall_access_requests` row that
 * hasn't expired). Enforced in `lib/data/matters.ts` (list / get) and
 * `lib/ai/draft.ts` (context assembly). The UI surfaces a wall the user IS
 * in via `describeMatterWall()` — non-members never even learn it exists.
 */
import { and, desc, eq, inArray, isNull, or, gt } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

/** Case IDs the user is NOT permitted to see (walled and they aren't in). */
export async function deniedCaseIdsForUser(session: Session): Promise<Set<string>> {
  if (!dbReady) return new Set();

  // 1. All matters that are inside an open wall.
  const walled = await db
    .select({ caseId: s.wallMemberships.caseId, wallId: s.wallMemberships.wallGroupId })
    .from(s.wallMemberships)
    .innerJoin(s.wallGroups, eq(s.wallGroups.id, s.wallMemberships.wallGroupId))
    .where(
      and(
        tenantScope(session, s.wallGroups),
        isNull(s.wallGroups.closedAt),
        isNull(s.wallMemberships.removedAt),
      ),
    );

  if (walled.length === 0) return new Set();

  const wallByCase = new Map<string, Set<string>>();
  for (const row of walled) {
    if (!row.caseId) continue;
    const arr = wallByCase.get(row.caseId) ?? new Set();
    arr.add(row.wallId);
    wallByCase.set(row.caseId, arr);
  }
  if (wallByCase.size === 0) return new Set();

  // 2. The user's wall memberships + active approved access requests.
  const wallIds = Array.from(new Set(walled.map((r) => r.wallId)));
  const now = new Date();
  const [memberships, approvals] = await Promise.all([
    db
      .select({ wallId: s.wallMemberships.wallGroupId })
      .from(s.wallMemberships)
      .where(
        and(
          inArray(s.wallMemberships.wallGroupId, wallIds),
          eq(s.wallMemberships.userId, session.userId),
          isNull(s.wallMemberships.removedAt),
        ),
      ),
    db
      .select({ wallId: s.wallAccessRequests.wallGroupId })
      .from(s.wallAccessRequests)
      .where(
        and(
          tenantScope(session, s.wallAccessRequests),
          inArray(s.wallAccessRequests.wallGroupId, wallIds),
          eq(s.wallAccessRequests.requestedByUserId, session.userId),
          eq(s.wallAccessRequests.status, "approved"),
          or(isNull(s.wallAccessRequests.expiresAt), gt(s.wallAccessRequests.expiresAt, now)),
        ),
      ),
  ]);

  const userInWall = new Set<string>([
    ...memberships.map((m) => m.wallId),
    ...approvals.map((a) => a.wallId),
  ]);

  const denied = new Set<string>();
  for (const [caseId, walls] of wallByCase) {
    const anyAllowed = Array.from(walls).some((w) => userInWall.has(w));
    if (!anyAllowed) denied.add(caseId);
  }
  return denied;
}

export type WallDescription = {
  id: string;
  name: string;
  reason: string | null;
  members: Array<{ userId: string; fullName: string; email: string }>;
  pendingRequests: number;
};

/** Describe the wall (if any) around a matter — only for users in the wall. */
export async function describeMatterWall(session: Session, caseId: string): Promise<WallDescription | null> {
  if (!dbReady) return null;

  const walls = await db
    .select({
      wallId: s.wallGroups.id,
      name: s.wallGroups.name,
      reason: s.wallGroups.reason,
    })
    .from(s.wallMemberships)
    .innerJoin(s.wallGroups, eq(s.wallGroups.id, s.wallMemberships.wallGroupId))
    .where(
      and(
        tenantScope(session, s.wallGroups),
        eq(s.wallMemberships.caseId, caseId),
        isNull(s.wallGroups.closedAt),
        isNull(s.wallMemberships.removedAt),
      ),
    );

  if (walls.length === 0) return null;
  const wall = walls[0]; // matters typically sit in at most one wall

  // Verify caller is in this wall (otherwise return null — default-deny).
  const [self] = await db
    .select({ id: s.wallMemberships.id })
    .from(s.wallMemberships)
    .where(
      and(
        eq(s.wallMemberships.wallGroupId, wall.wallId),
        eq(s.wallMemberships.userId, session.userId),
        isNull(s.wallMemberships.removedAt),
      ),
    )
    .limit(1);
  if (!self) return null;

  const members = await db
    .select({
      userId: s.wallMemberships.userId,
      fullName: s.users.fullName,
      email: s.users.email,
    })
    .from(s.wallMemberships)
    .innerJoin(s.users, eq(s.users.id, s.wallMemberships.userId))
    .where(
      and(
        eq(s.wallMemberships.wallGroupId, wall.wallId),
        isNull(s.wallMemberships.removedAt),
      ),
    );

  const [{ count }] = await db
    .select({ count: s.wallAccessRequests.id })
    .from(s.wallAccessRequests)
    .where(
      and(
        tenantScope(session, s.wallAccessRequests),
        eq(s.wallAccessRequests.wallGroupId, wall.wallId),
        eq(s.wallAccessRequests.status, "requested"),
      ),
    )
    .limit(1)
    .then((rows) => (rows.length ? [{ count: rows.length }] : [{ count: 0 }]));

  return {
    id: wall.wallId,
    name: wall.name,
    reason: wall.reason,
    members: members.map((m) => ({
      userId: m.userId!,
      fullName: m.fullName,
      email: m.email,
    })),
    pendingRequests: count,
  };
}

export type WallSummary = {
  id: string;
  name: string;
  reason: string | null;
  createdAt: Date;
  closedAt: Date | null;
  members: number;
  matters: number;
  pendingRequests: number;
};

export async function listWalls(session: Session): Promise<WallSummary[]> {
  if (!dbReady) return [];
  const walls = await db
    .select()
    .from(s.wallGroups)
    .where(tenantScope(session, s.wallGroups))
    .orderBy(desc(s.wallGroups.createdAt));

  const summaries: WallSummary[] = [];
  for (const w of walls) {
    const memberships = await db
      .select({ userId: s.wallMemberships.userId, caseId: s.wallMemberships.caseId })
      .from(s.wallMemberships)
      .where(and(eq(s.wallMemberships.wallGroupId, w.id), isNull(s.wallMemberships.removedAt)));
    const pendingRows = await db
      .select({ id: s.wallAccessRequests.id })
      .from(s.wallAccessRequests)
      .where(
        and(
          tenantScope(session, s.wallAccessRequests),
          eq(s.wallAccessRequests.wallGroupId, w.id),
          eq(s.wallAccessRequests.status, "requested"),
        ),
      );
    summaries.push({
      id: w.id,
      name: w.name,
      reason: w.reason,
      createdAt: w.createdAt,
      closedAt: w.closedAt,
      members: memberships.filter((m) => m.userId).length,
      matters: memberships.filter((m) => m.caseId).length,
      pendingRequests: pendingRows.length,
    });
  }
  return summaries;
}

export type AccessRequestRow = {
  id: string;
  wallId: string;
  wallName: string;
  requestedBy: string;
  reason: string;
  status: string;
  createdAt: Date;
};

export async function listAccessRequests(session: Session): Promise<AccessRequestRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      id: s.wallAccessRequests.id,
      wallId: s.wallAccessRequests.wallGroupId,
      wallName: s.wallGroups.name,
      requesterFullName: s.users.fullName,
      reason: s.wallAccessRequests.reason,
      status: s.wallAccessRequests.status,
      createdAt: s.wallAccessRequests.createdAt,
    })
    .from(s.wallAccessRequests)
    .innerJoin(s.wallGroups, eq(s.wallGroups.id, s.wallAccessRequests.wallGroupId))
    .innerJoin(s.users, eq(s.users.id, s.wallAccessRequests.requestedByUserId))
    .where(tenantScope(session, s.wallAccessRequests))
    .orderBy(desc(s.wallAccessRequests.createdAt));

  return rows.map((r) => ({
    id: r.id,
    wallId: r.wallId,
    wallName: r.wallName,
    requestedBy: r.requesterFullName,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export async function decideAccessRequest(
  session: Session,
  requestId: string,
  decision: "approved" | "denied",
): Promise<{ ok: boolean }> {
  if (!dbReady) return { ok: true };
  const { writeAudit } = await import("@/lib/data/audit");
  await db
    .update(s.wallAccessRequests)
    .set({ status: decision, decidedByUserId: session.userId, decidedAt: new Date() })
    .where(and(tenantScope(session, s.wallAccessRequests), eq(s.wallAccessRequests.id, requestId)));
  await writeAudit(session, {
    action: `wall_request_${decision}`,
    entityKind: "wall_access_request",
    entityId: requestId,
  });
  return { ok: true };
}
