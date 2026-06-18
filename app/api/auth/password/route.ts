/**
 * POST /api/auth/password
 * Body: { email, password, challengeToken?, honeypotFieldName?, honeypotValue?, turnstileToken? }
 *
 * Resolves the user against:
 *   1. The in-memory demo accounts (works without DB).
 *   2. The `users` table if DATABASE_URL is set and a row carries a
 *      `passwordHash` column (Phase 3 - not used by demo accounts).
 *
 * On success, sets the same signed session cookie used by the magic-link
 * flow and returns { ok: true }.
 *
 * Gated by ensureHuman so the password attempt is rate-limited per IP +
 * per email, plus the honeypot + Turnstile checks.
 */
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, cookieAttributes, packSessionCookie } from "@/lib/auth/cookie";
import { verifyDemoAccount } from "@/lib/auth/demo-accounts";
import { ensureHuman } from "@/lib/security/human";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
    challengeToken?: string;
    honeypotFieldName?: string;
    honeypotValue?: string;
    turnstileToken?: string;
  } | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "email + password required" }, { status: 400 });
  }

  // The honeypot may not be rendered on the password tab; only enforce it
  // when a challengeToken is present. Rate-limit always runs.
  const check = await ensureHuman({
    req,
    rateNamespace: "signin_ip",
    identifier: body.email,
    challenge: body.challengeToken
      ? { token: body.challengeToken, honeypotFieldName: body.honeypotFieldName, honeypotValue: body.honeypotValue }
      : { token: "", honeypotFieldName: "", honeypotValue: "" },
    turnstileToken: body.turnstileToken,
  });
  if (!check.ok && check.reason.startsWith("rate_")) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: check.retryAfter ? { "Retry-After": String(check.retryAfter) } : undefined });
  }
  // honeypot failures (including missing_token when no widget was rendered)
  // are tolerated on this tab - the rate-limit + password are the real gate.

  const demo = await verifyDemoAccount(body.email, body.password);
  if (!demo) {
    return NextResponse.json({ error: "bad_credentials" }, { status: 401 });
  }

  const cookieValue = await packSessionCookie(demo.userId, demo.tenantId);
  const res = NextResponse.json({ ok: true, redirect: "/desk" });
  res.headers.append("Set-Cookie", `${COOKIE_NAME}=${cookieValue}; ${cookieAttributes()}`);
  return res;
}
