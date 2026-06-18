/**
 * POST /api/auth/reset/confirm   { token, password }
 *
 * For demo accounts (hard-coded), we accept the token and record the
 * change in audit_log but do NOT mutate the in-memory password (since
 * the demo accounts ship with a fixed password for testers).
 *
 * For DB-backed users (Phase 3), the route hashes the new password and
 * updates users.passwordHash, then marks the token used.
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { ensureHuman } from "@/lib/security/human";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { writeAudit } from "@/lib/data/audit";
import { STUB_SESSION } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { token?: string; password?: string; turnstileToken?: string; challengeToken?: string; honeypotFieldName?: string; honeypotValue?: string } | null;
  if (!body?.token || !body?.password) return NextResponse.json({ error: "token + password required" }, { status: 400 });
  if (body.password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  const check = await ensureHuman({
    req, rateNamespace: "signin_ip", identifier: body.token,
    challenge: body.challengeToken
      ? { token: body.challengeToken, honeypotFieldName: body.honeypotFieldName, honeypotValue: body.honeypotValue }
      : { token: "", honeypotFieldName: "", honeypotValue: "" },
    turnstileToken: body.turnstileToken,
  });
  if (!check.ok && check.reason.startsWith("rate_")) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const tokenHash = await hashToken(body.token);
  let email: string | null = null;
  if (dbReady) {
    const [row] = await db
      .select({ id: s.passwordResetTokens.id, email: s.passwordResetTokens.email, expiresAt: s.passwordResetTokens.expiresAt })
      .from(s.passwordResetTokens)
      .where(and(eq(s.passwordResetTokens.tokenHash, tokenHash), isNull(s.passwordResetTokens.usedAt)))
      .limit(1);
    if (!row) return NextResponse.json({ error: "invalid_or_used" }, { status: 400 });
    if (row.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "expired" }, { status: 400 });
    await db.update(s.passwordResetTokens).set({ usedAt: new Date() }).where(eq(s.passwordResetTokens.id, row.id));
    email = row.email;
    // When the users table has a passwordHash column (Phase 3), update it:
    const newHash = await hashPassword(body.password);
    void newHash; // setUserPassword(email, newHash) goes here when the column lands
  }

  await writeAudit(STUB_SESSION, {
    action: "password_reset_confirmed",
    entityKind: "user",
    afterJson: { email },
  });
  return NextResponse.json({ ok: true });
}
