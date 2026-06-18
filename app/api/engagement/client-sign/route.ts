/**
 * Public - no session required. Client clicks accept on the magic-link page.
 * Body: {
 *   token, signerName?, decline?, reason?,
 *   challengeToken, honeypotFieldName, honeypotValue, turnstileToken?
 * }
 * Gated by the HumanCheck primitive: Turnstile (if configured) + signed
 * honeypot + IP rate-limit.
 */
import { NextRequest, NextResponse } from "next/server";
import { publicClientSign, publicClientDecline } from "@/lib/data/engagement";
import { ensureHuman } from "@/lib/security/human";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    token?: string; signerName?: string; reason?: string; decline?: boolean;
    challengeToken?: string; honeypotFieldName?: string; honeypotValue?: string; turnstileToken?: string;
  } | null;
  if (!body?.token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const check = await ensureHuman({
    req,
    rateNamespace: "public_sign_ip",
    identifier: body.token,
    challenge: { token: body.challengeToken, honeypotFieldName: body.honeypotFieldName, honeypotValue: body.honeypotValue },
    turnstileToken: body.turnstileToken,
  });
  if (!check.ok) {
    const headers = check.retryAfter ? { "Retry-After": String(check.retryAfter) } : undefined;
    return NextResponse.json(
      { error: check.reason.startsWith("rate_") ? "rate_limited" : "rejected_human_check" },
      { status: check.status, headers },
    );
  }

  const ipAddress = check.ip;
  const userAgent = req.headers.get("user-agent") ?? null;
  if (body.decline) {
    const r = await publicClientDecline(body.token, { reason: body.reason ?? "", ipAddress, userAgent });
    if ("error" in r) return NextResponse.json(r, { status: 400 });
    return NextResponse.json(r);
  }
  if (!body.signerName?.trim()) return NextResponse.json({ error: "signerName required" }, { status: 400 });
  const r = await publicClientSign(body.token, { signerName: body.signerName.trim(), ipAddress, userAgent });
  if ("error" in r) return NextResponse.json(r, { status: 400 });
  return NextResponse.json(r);
}
