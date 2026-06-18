/**
 * POST /api/walls/decide
 * Body: { requestId: string, decision: "approved" | "denied" }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { decideAccessRequest } from "@/lib/data/walls";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    requestId?: string;
    decision?: "approved" | "denied";
  } | null;
  if (!body?.requestId || (body.decision !== "approved" && body.decision !== "denied")) {
    return NextResponse.json({ error: "requestId + decision (approved|denied) required" }, { status: 400 });
  }
  const session = await getSession();
  const r = await decideAccessRequest(session, body.requestId, body.decision);
  return NextResponse.json(r);
}
