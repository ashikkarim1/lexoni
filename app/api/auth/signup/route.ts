/**
 * POST /api/auth/signup    { email, fullName, password, challenge bundle }
 *
 * Creates an unverified user record and sends an activation email. The
 * account cannot be used to sign in until the activation link is opened.
 *
 * Demo accounts in lib/auth/demo-accounts.ts bypass this flow and sign
 * in directly. Real production users (Phase 3) go through here.
 */
import { NextRequest, NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { ensureHuman } from "@/lib/security/human";
import { issueToken, ACTIVATION_TTL_S } from "@/lib/auth/tokens";
import { sendEmail, appUrl } from "@/lib/email/resend";
import { activationEmail } from "@/lib/email/auth-templates";
import { writeAudit } from "@/lib/data/audit";
import { STUB_SESSION } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { email?: string; fullName?: string; password?: string; challengeToken?: string; honeypotFieldName?: string; honeypotValue?: string; turnstileToken?: string } | null;
  if (!body?.email?.includes("@") || !body?.fullName?.trim() || !body?.password) {
    return NextResponse.json({ error: "email, fullName, password required" }, { status: 400 });
  }
  if (body.password.length < 8) return NextResponse.json({ error: "password_too_short" }, { status: 400 });

  const check = await ensureHuman({
    req, rateNamespace: "signin_ip", identifier: body.email,
    challenge: body.challengeToken
      ? { token: body.challengeToken, honeypotFieldName: body.honeypotFieldName, honeypotValue: body.honeypotValue }
      : { token: "", honeypotFieldName: "", honeypotValue: "" },
    turnstileToken: body.turnstileToken,
  });
  if (!check.ok && check.reason.startsWith("rate_")) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const email = body.email.trim().toLowerCase();
  const token = await issueToken(ACTIVATION_TTL_S);
  if (dbReady) {
    await db.insert(s.accountActivations).values({
      email,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      status: "pending",
    });
  }

  const url = `${appUrl()}/verify-email/${token.token}`;
  const tpl = activationEmail({ name: body.fullName.trim(), url, ttlHours: 24 });
  await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: [{ name: "kind", value: "activation" }] });

  await writeAudit(STUB_SESSION, {
    action: "user_signup_requested",
    entityKind: "user",
    afterJson: { email, fullName: body.fullName.trim() },
  });

  return NextResponse.json({ ok: true, message: "Check your email to activate your account before signing in." });
}
