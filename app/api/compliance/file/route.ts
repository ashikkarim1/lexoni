import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { markFiled } from "@/lib/data/compliance";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: string; evidenceUrl?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const session = await getSession();
  await markFiled(session, body.id, body.evidenceUrl);
  return NextResponse.json({ ok: true });
}
