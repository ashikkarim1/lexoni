/**
 * POST /api/auth/signin
 * Body: { email: string }
 * Sends a magic-link sign-in email via Resend. Returns { ok: true } regardless
 * of whether the email exists - the email-existence side-channel is closed
 * (only the auth_log records the attempt server-side).
 */
import { NextRequest, NextResponse } from "next/server";
import { createSignInToken, reapExpiredTokens } from "@/lib/auth/magic-link";
import { sendEmail, appUrl } from "@/lib/email/resend";
import { signInLinkEmail } from "@/lib/email/templates";
import { ensureHuman } from "@/lib/security/human";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    challengeToken?: string;
    honeypotFieldName?: string;
    honeypotValue?: string;
    turnstileToken?: string;
  } | null;
  if (!body?.email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const check = await ensureHuman({
    req,
    rateNamespace: "signin_ip",
    identifier: body.email,
    challenge: {
      token: body.challengeToken,
      honeypotFieldName: body.honeypotFieldName,
      honeypotValue: body.honeypotValue,
    },
    turnstileToken: body.turnstileToken,
  });
  if (!check.ok) {
    const headers = check.retryAfter ? { "Retry-After": String(check.retryAfter) } : undefined;
    return NextResponse.json(
      { error: check.reason.startsWith("rate_") ? "rate_limited" : "rejected_human_check" },
      { status: check.status, headers },
    );
  }

  await reapExpiredTokens();
  const ip = check.ip;
  const result = await createSignInToken(body.email, ip);
  if (!result.ok) {
    if (result.reason === "bad_email") return NextResponse.json({ error: "bad_email" }, { status: 400 });
    // db_unavailable in dev is fine - still pretend we sent so the UX is consistent.
    return NextResponse.json({ ok: true });
  }

  const url = `${appUrl()}/api/auth/verify?token=${result.token}`;
  const tpl = signInLinkEmail({ locale: "en", url, ttlMinutes: 15 });
  await sendEmail({
    to: body.email.trim().toLowerCase(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [{ name: "kind", value: "signin_link" }],
  });
  return NextResponse.json({ ok: true });
}
