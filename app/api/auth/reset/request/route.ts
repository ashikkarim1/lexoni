/**
 * POST /api/auth/reset/request   { email, challenge bundle }
 *
 * Always returns 200 to avoid leaking which emails exist. When the
 * email matches a known account, persist a hashed reset token and
 * send the reset email via Resend.
 */
import { NextRequest, NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { ensureHuman } from "@/lib/security/human";
import { issueToken, PASSWORD_RESET_TTL_S } from "@/lib/auth/tokens";
import { sendEmail, appUrl } from "@/lib/email/resend";
import { passwordResetEmail } from "@/lib/email/auth-templates";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { writeAudit } from "@/lib/data/audit";
import { STUB_SESSION } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { email?: string; challengeToken?: string; honeypotFieldName?: string; honeypotValue?: string; turnstileToken?: string } | null;
  if (!body?.email) return NextResponse.json({ ok: true });

  const check = await ensureHuman({
    req, rateNamespace: "signin_ip", identifier: body.email,
    challenge: body.challengeToken
      ? { token: body.challengeToken, honeypotFieldName: body.honeypotFieldName, honeypotValue: body.honeypotValue }
      : { token: "", honeypotFieldName: "", honeypotValue: "" },
    turnstileToken: body.turnstileToken,
  });
  if (!check.ok) {
    if (check.reason.startsWith("rate_")) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: check.retryAfter ? { "Retry-After": String(check.retryAfter) } : undefined });
    }
    // Honeypot soft-fail tolerated; always answer 200.
    return NextResponse.json({ ok: true });
  }

  const email = body.email.trim().toLowerCase();
  const exists = DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === email);
  if (!exists) return NextResponse.json({ ok: true });

  const token = await issueToken(PASSWORD_RESET_TTL_S);
  if (dbReady) {
    await db.insert(s.passwordResetTokens).values({
      email,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      ipAddress: check.ip,
    });
  }
  const url = `${appUrl()}/reset-password/${token.token}`;
  const tpl = passwordResetEmail({ url, ttlMinutes: 60 });
  await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: [{ name: "kind", value: "password_reset" }] });

  await writeAudit(STUB_SESSION, {
    action: "password_reset_requested",
    entityKind: "user",
    afterJson: { email, ip: check.ip },
  });
  return NextResponse.json({ ok: true });
}
