/**
 * Invite acceptance flow.
 *
 * Resolves a pending_invites token → creates the user (if new) → writes a
 * memberships row → marks the invite accepted. Audited end-to-end. Without
 * NextAuth, this is the closest we get to a real "user joined the firm"
 * lifecycle event — when auth lands, the auth provider will call into the
 * same flow after verifying the token.
 */
import { and, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export type InviteLookup =
  | { ok: true; id: string; tenantName: string; email: string; role: string; fullName: string | null; inviterName: string | null; expiresAt: Date }
  | { ok: false; reason: "not_found" | "expired" | "cancelled" | "accepted" };

export async function lookupInvite(token: string): Promise<InviteLookup> {
  if (!dbReady) return { ok: false, reason: "not_found" };
  const [row] = await db
    .select({
      id: s.pendingInvites.id,
      email: s.pendingInvites.email,
      role: s.pendingInvites.role,
      fullName: s.pendingInvites.fullName,
      status: s.pendingInvites.status,
      expiresAt: s.pendingInvites.expiresAt,
      tenantName: s.tenants.name,
      inviterName: s.users.fullName,
    })
    .from(s.pendingInvites)
    .innerJoin(s.tenants, eq(s.tenants.id, s.pendingInvites.tenantId))
    .leftJoin(s.users, eq(s.users.id, s.pendingInvites.invitedByUserId))
    .where(eq(s.pendingInvites.token, token))
    .limit(1);
  if (!row) return { ok: false, reason: "not_found" };
  if (row.status === "cancelled") return { ok: false, reason: "cancelled" };
  if (row.status === "accepted")  return { ok: false, reason: "accepted" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };
  return {
    ok: true,
    id: row.id,
    tenantName: row.tenantName,
    email: row.email,
    role: row.role,
    fullName: row.fullName,
    inviterName: row.inviterName,
    expiresAt: row.expiresAt,
  };
}

export async function acceptInvite(token: string, args: { fullName?: string }): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!dbReady) return { ok: false, reason: "not_found" };

  const [invite] = await db
    .select()
    .from(s.pendingInvites)
    .where(eq(s.pendingInvites.token, token))
    .limit(1);
  if (!invite) return { ok: false, reason: "not_found" };
  if (invite.status !== "pending") return { ok: false, reason: invite.status };
  if (invite.expiresAt < new Date()) {
    await db.update(s.pendingInvites).set({ status: "expired" }).where(eq(s.pendingInvites.id, invite.id));
    return { ok: false, reason: "expired" };
  }

  // Resolve or create the user. Email is the canonical identity.
  const [existing] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, invite.email)).limit(1);
  let userId = existing?.id;
  if (!userId) {
    const [u] = await db.insert(s.users).values({
      email: invite.email,
      fullName: args.fullName?.trim() || invite.fullName || invite.email.split("@")[0],
      locale: "en",
    }).returning({ id: s.users.id });
    userId = u.id;
  }

  // Membership row — wired with the role + supervision + rate from the invite.
  const [alreadyMember] = await db
    .select({ id: s.memberships.id })
    .from(s.memberships)
    .where(and(eq(s.memberships.userId, userId), eq(s.memberships.tenantId, invite.tenantId)))
    .limit(1);
  if (!alreadyMember) {
    await db.insert(s.memberships).values({
      userId,
      tenantId: invite.tenantId,
      role: invite.role as never,
      reportsToUserId: invite.reportsToUserId,
      hourlyRateCents: invite.hourlyRateCents,
      active: true,
    });
  }

  await db.update(s.pendingInvites).set({ status: "accepted", acceptedAt: new Date() }).where(eq(s.pendingInvites.id, invite.id));

  // Audit row (no session — write directly).
  await db.insert(s.auditLog).values({
    tenantId: invite.tenantId,
    userId,
    action: "member_invite_accepted",
    entityKind: "pending_invite",
    entityId: invite.id,
    afterJson: { userId, role: invite.role } as never,
  });

  return { ok: true };
}
