/**
 * POST /api/gdpr/dsr/advance
 * Body: { id: string, to: DsrStatus }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { advanceDsr, type DsrStatus } from "@/lib/data/gdpr";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: string; to?: string } | null;
  const valid: DsrStatus[] = ["received", "verifying", "in_progress", "completed", "rejected"];
  if (!body?.id || !valid.includes(body.to as DsrStatus)) {
    return NextResponse.json({ error: "id + to (valid status) required" }, { status: 400 });
  }
  const session = await getSession();
  await advanceDsr(session, body.id, body.to as DsrStatus);
  return NextResponse.json({ ok: true });
}
