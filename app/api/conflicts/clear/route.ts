/**
 * POST /api/conflicts/clear
 * Body: { id: string, note?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { clearConflict } from "@/lib/data/conflicts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: string; note?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const session = await getSession();
  const r = await clearConflict(session, body.id, body.note);
  return NextResponse.json(r);
}
