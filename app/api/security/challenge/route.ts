/**
 * Issue a fresh honeypot challenge for client-rendered forms.
 *
 *   GET /api/security/challenge   →  { token, honeypotFieldName, turnstileSiteKey? }
 *
 * Used by client components that mount HumanCheck after page render
 * (e.g. SignInForm). For server-rendered forms (/apply), the page server
 * component calls generateChallenge() directly and inlines the values.
 */
import { NextResponse } from "next/server";
import { generateChallenge } from "@/lib/security/honeypot";
import { turnstileSiteKey } from "@/lib/security/turnstile";
import { ipFromRequest, rateLimitCheck } from "@/lib/security/ratelimit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ip = ipFromRequest(req);
  const check = rateLimitCheck("challenge_ip", ip);
  if (!check.ok) {
    return NextResponse.json({ error: "rate_limited", retryAfter: check.retryAfterSeconds }, { status: 429 });
  }
  const c = await generateChallenge();
  return NextResponse.json({
    token: c.token,
    honeypotFieldName: c.honeypotFieldName,
    turnstileSiteKey: turnstileSiteKey(),
  }, { headers: { "cache-control": "no-store" } });
}
