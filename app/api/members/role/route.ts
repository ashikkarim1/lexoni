import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { changeRole, type MemberRole } from "@/lib/data/members";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { membershipId?: string; role?: MemberRole; reportsToUserId?: string | null; hourlyRateCents?: number | null } | null;
  if (!body?.membershipId || !body.role) return NextResponse.json({ error: "membershipId + role required" }, { status: 400 });
  const session = await getSession();
  await changeRole(session, body.membershipId, body.role, body.reportsToUserId ?? undefined, body.hourlyRateCents ?? undefined);
  return NextResponse.json({ ok: true });
}
