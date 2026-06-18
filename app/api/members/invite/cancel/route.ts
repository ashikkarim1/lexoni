import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { cancelInvite } from "@/lib/data/members";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const session = await getSession();
  await cancelInvite(session, body.id);
  return NextResponse.json({ ok: true });
}
