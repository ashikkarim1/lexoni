/**
 * Account management — members of a firm tenant.
 *
 *   • Active members live in `memberships` (one row per user × tenant), with
 *     role + supervision edges + hourly rate. listMembers() joins to users.
 *   • Pending invites live in `pending_invites`. The accept flow is wired
 *     when an auth provider lands (today: a magic-link token row is written;
 *     no email is sent).
 *
 * Every mutation (invite, change role, deactivate) writes an audit_log row.
 */
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import { sendEmail, appUrl } from "@/lib/email/resend";
import { inviteEmail } from "@/lib/email/templates";

export type MemberRole =
  | "firm_admin"
  | "lawyer"
  | "lawyer_helper"
  | "client_admin"
  | "client_member"
  | "client_viewer"
  | "platform_admin";

export type MemberRow = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  role: MemberRole;
  reportsToUserId: string | null;
  reportsToName: string | null;
  hourlyRateCents: number | null;
  active: boolean;
  createdAt: Date;
  mfaEnabled: boolean;
  emailVerifiedAt: Date | null;
};

export async function listMembers(session: Session): Promise<MemberRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      mId:    s.memberships.id,
      role:   s.memberships.role,
      reports: s.memberships.reportsToUserId,
      rate:   s.memberships.hourlyRateCents,
      active: s.memberships.active,
      created: s.memberships.createdAt,
      uId:    s.users.id,
      email:  s.users.email,
      fullName: s.users.fullName,
      mfa:    s.users.mfaEnabled,
      emailVerifiedAt: s.users.emailVerifiedAt,
    })
    .from(s.memberships)
    .innerJoin(s.users, eq(s.users.id, s.memberships.userId))
    .where(tenantScope(session, s.memberships))
    .orderBy(s.users.fullName);

  const reportIds = Array.from(new Set(rows.map((r) => r.reports).filter((x): x is string => !!x)));
  const reportNames = new Map<string, string>();
  if (reportIds.length > 0) {
    const rNames = await db
      .select({ id: s.users.id, fullName: s.users.fullName })
      .from(s.users)
      .where(inArray(s.users.id, reportIds));
    for (const u of rNames) reportNames.set(u.id, u.fullName);
  }

  return rows.map((r) => ({
    membershipId: r.mId,
    userId: r.uId,
    email: r.email,
    fullName: r.fullName,
    role: r.role as MemberRole,
    reportsToUserId: r.reports,
    reportsToName: r.reports ? reportNames.get(r.reports) ?? null : null,
    hourlyRateCents: r.rate,
    active: r.active,
    createdAt: r.created,
    mfaEnabled: r.mfa,
    emailVerifiedAt: r.emailVerifiedAt,
  }));
}

export type InviteRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: MemberRole;
  reportsToUserId: string | null;
  reportsToName: string | null;
  invitedByName: string | null;
  status: string;
  createdAt: Date;
  expiresAt: Date;
};

export async function listInvites(session: Session): Promise<InviteRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select()
    .from(s.pendingInvites)
    .where(tenantScope(session, s.pendingInvites))
    .orderBy(desc(s.pendingInvites.createdAt));

  const userIds = Array.from(new Set([
    ...rows.map((r) => r.reportsToUserId).filter((x): x is string => !!x),
    ...rows.map((r) => r.invitedByUserId).filter((x): x is string => !!x),
  ]));
  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const u = await db.select({ id: s.users.id, fullName: s.users.fullName }).from(s.users).where(inArray(s.users.id, userIds));
    for (const r of u) names.set(r.id, r.fullName);
  }

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.fullName,
    role: r.role as MemberRole,
    reportsToUserId: r.reportsToUserId,
    reportsToName: r.reportsToUserId ? names.get(r.reportsToUserId) ?? null : null,
    invitedByName: r.invitedByUserId ? names.get(r.invitedByUserId) ?? null : null,
    status: r.status,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
  }));
}

export async function inviteMember(
  session: Session,
  args: {
    email: string;
    fullName?: string;
    role: MemberRole;
    reportsToUserId?: string;
    hourlyRateCents?: number;
  },
): Promise<{ id: string; token: string } | { error: string }> {
  if (!dbReady) return { id: "stub", token: "stub-token" };
  const cleanEmail = args.email.trim().toLowerCase();
  if (!cleanEmail.includes("@")) return { error: "bad_email" };

  // Refuse if a membership already exists for that email in this tenant.
  const [existing] = await db
    .select({ id: s.users.id })
    .from(s.users)
    .innerJoin(s.memberships, eq(s.memberships.userId, s.users.id))
    .where(and(eq(s.users.email, cleanEmail), tenantScope(session, s.memberships)))
    .limit(1);
  if (existing) return { error: "already_member" };

  const token = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const [row] = await db.insert(s.pendingInvites).values({
      tenantId: session.tenantId,
      email: cleanEmail,
      fullName: args.fullName,
      role: args.role,
      reportsToUserId: args.reportsToUserId,
      hourlyRateCents: args.hourlyRateCents,
      invitedByUserId: session.userId,
      token,
      expiresAt: expires,
      status: "pending",
    }).returning({ id: s.pendingInvites.id });

    await writeAudit(session, {
      action: "member_invited",
      entityKind: "pending_invite",
      entityId: row.id,
      afterJson: { email: cleanEmail, role: args.role, reportsToUserId: args.reportsToUserId },
    });

    // Best-effort transactional email. Failures don't roll back the invite —
    // it remains visible in /settings/members and can be resent later.
    const roleLabel: Record<string, { en: string; ar: string }> = {
      firm_admin:    { en: "Partner / firm admin",  ar: "شريك / مدير مكتب" },
      lawyer:        { en: "Lawyer",                ar: "محامٍ" },
      lawyer_helper: { en: "Paralegal / helper",    ar: "معاون / مساعد" },
      client_admin:  { en: "Client admin",          ar: "مدير عميل" },
      client_member: { en: "Client member",         ar: "عضو عميل" },
      client_viewer: { en: "Client viewer",         ar: "مشاهد عميل" },
    };
    const inviteeLocale: "en" | "ar" = session.locale === "ar" ? "ar" : "en";
    const tpl = inviteEmail({
      locale: inviteeLocale,
      inviteeName: args.fullName ?? null,
      inviterName: session.fullName,
      firmName: session.tenantName,
      roleLabel: (roleLabel[args.role] ?? roleLabel.lawyer)[inviteeLocale],
      acceptUrl: `${appUrl()}/accept-invite?token=${token}`,
      expiresOn: expires.toISOString().slice(0, 10),
    });
    const sent = await sendEmail({
      to: cleanEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "kind", value: "member_invite" }],
    });
    await writeAudit(session, {
      action: "member_invite_email_attempted",
      entityKind: "pending_invite",
      entityId: row.id,
      afterJson: { to: cleanEmail, sent: "ok" in sent && sent.ok, skipped: "skipped" in sent, error: "error" in sent ? sent.error : undefined },
    });

    return { id: row.id, token };
  } catch {
    return { error: "duplicate_invite" };
  }
}

export async function cancelInvite(session: Session, id: string): Promise<void> {
  if (!dbReady) return;
  await db
    .update(s.pendingInvites)
    .set({ status: "cancelled" })
    .where(and(tenantScope(session, s.pendingInvites), eq(s.pendingInvites.id, id)));
  await writeAudit(session, {
    action: "member_invite_cancelled",
    entityKind: "pending_invite",
    entityId: id,
  });
}

export async function changeRole(
  session: Session,
  membershipId: string,
  newRole: MemberRole,
  reportsToUserId?: string | null,
  hourlyRateCents?: number | null,
): Promise<void> {
  if (!dbReady) return;
  const [before] = await db
    .select()
    .from(s.memberships)
    .where(and(tenantScope(session, s.memberships), eq(s.memberships.id, membershipId)))
    .limit(1);
  if (!before) return;
  await db
    .update(s.memberships)
    .set({
      role: newRole,
      reportsToUserId: reportsToUserId === undefined ? before.reportsToUserId : reportsToUserId,
      hourlyRateCents: hourlyRateCents === undefined ? before.hourlyRateCents : hourlyRateCents,
    })
    .where(and(tenantScope(session, s.memberships), eq(s.memberships.id, membershipId)));
  await writeAudit(session, {
    action: "member_role_changed",
    entityKind: "membership",
    entityId: membershipId,
    beforeJson: { role: before.role, reportsToUserId: before.reportsToUserId, hourlyRateCents: before.hourlyRateCents },
    afterJson: { role: newRole, reportsToUserId, hourlyRateCents },
  });
}

export async function setMembershipActive(session: Session, membershipId: string, active: boolean): Promise<void> {
  if (!dbReady) return;
  await db
    .update(s.memberships)
    .set({ active })
    .where(and(tenantScope(session, s.memberships), eq(s.memberships.id, membershipId)));
  await writeAudit(session, {
    action: active ? "member_reactivated" : "member_deactivated",
    entityKind: "membership",
    entityId: membershipId,
    afterJson: { active },
  });
}

export async function memberCounters(session: Session): Promise<{
  total: number; partners: number; lawyers: number; helpers: number; inactive: number; pendingInvites: number;
}> {
  if (!dbReady) return { total: 0, partners: 0, lawyers: 0, helpers: 0, inactive: 0, pendingInvites: 0 };
  const rows = await db.select().from(s.memberships).where(tenantScope(session, s.memberships));
  const [{ p }] = await db.select({ p: sql<number>`count(*)::int` }).from(s.pendingInvites).where(and(tenantScope(session, s.pendingInvites), eq(s.pendingInvites.status, "pending")));
  return {
    total: rows.length,
    partners: rows.filter((r) => r.role === "firm_admin").length,
    lawyers: rows.filter((r) => r.role === "lawyer").length,
    helpers: rows.filter((r) => r.role === "lawyer_helper").length,
    inactive: rows.filter((r) => !r.active).length,
    pendingInvites: p ?? 0,
  };
}
