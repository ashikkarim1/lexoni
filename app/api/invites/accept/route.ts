import { NextRequest, NextResponse } from "next/server";
import { acceptInvite } from "@/lib/data/invites";
import { ensureHuman } from "@/lib/security/human";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    token?: string; fullName?: string;
    challengeToken?: string; honeypotFieldName?: string; honeypotValue?: string; turnstileToken?: string;
  } | null;
  if (!body?.token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const check = await ensureHuman({
    req,
    rateNamespace: "invite_accept_ip",
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

  const r = await acceptInvite(body.token, { fullName: body.fullName });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json({ ok: true });
}
