/**
 * Sign-in magic links. The lawyer types their email at /signin, we create a
 * single-use 15-minute token, email it via Resend. Clicking the link verifies
 * the token, looks up the user + membership, sets a signed session cookie.
 */
import { randomBytes } from "node:crypto";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export type MagicLinkResult =
  | { ok: true; token: string }
  | { ok: false; reason: "db_unavailable" | "bad_email" };

export async function createSignInToken(email: string, ipAddress: string | null): Promise<MagicLinkResult> {
  const clean = email.trim().toLowerCase();
  if (!clean.includes("@")) return { ok: false, reason: "bad_email" };
  if (!dbReady) return { ok: false, reason: "db_unavailable" };

  const token = randomBytes(24).toString("base64url");
  await db.insert(s.signInTokens).values({
    email: clean,
    token,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    ipAddress: ipAddress ?? undefined,
  });
  return { ok: true, token };
}

export type VerifyResult =
  | { ok: true; userId: string; tenantId: string }
  | { ok: false; reason: "not_found" | "expired" | "used" | "no_membership" | "db_unavailable" };

/** Verifies the token + resolves the user → returns the first active
 *  membership (tenant) for that user. For multi-tenant users we'd later
 *  surface a tenant picker; for now we pick the first. */
export async function verifySignInToken(token: string): Promise<VerifyResult> {
  if (!dbReady) return { ok: false, reason: "db_unavailable" };

  const [row] = await db
    .select()
    .from(s.signInTokens)
    .where(eq(s.signInTokens.token, token))
    .limit(1);
  if (!row) return { ok: false, reason: "not_found" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };

  const [user] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, row.email)).limit(1);
  if (!user) return { ok: false, reason: "no_membership" };

  const [m] = await db
    .select({ tenantId: s.memberships.tenantId })
    .from(s.memberships)
    .where(and(eq(s.memberships.userId, user.id), eq(s.memberships.active, true)))
    .limit(1);
  if (!m) return { ok: false, reason: "no_membership" };

  await db.update(s.signInTokens).set({ usedAt: new Date() }).where(eq(s.signInTokens.id, row.id));
  await db.insert(s.auditLog).values({
    tenantId: m.tenantId,
    userId: user.id,
    action: "signin_magic_link_used",
    entityKind: "sign_in_token",
    entityId: row.id,
  });
  return { ok: true, userId: user.id, tenantId: m.tenantId };
}

/** Reaper — best-effort. Called from /api/auth/signin so the table doesn't
 *  grow unboundedly without a cron job. */
export async function reapExpiredTokens(): Promise<void> {
  if (!dbReady) return;
  await db.delete(s.signInTokens).where(and(isNull(s.signInTokens.usedAt), lt(s.signInTokens.expiresAt, new Date())));
}
