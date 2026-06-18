import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { setMembershipActive } from "@/lib/data/members";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { membershipId?: string; active?: boolean } | null;
  if (!body?.membershipId || typeof body.active !== "boolean") return NextResponse.json({ error: "membershipId + active required" }, { status: 400 });
  const session = await getSession();
  await setMembershipActive(session, body.membershipId, body.active);
  return NextResponse.json({ ok: true });
}
