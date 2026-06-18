/**
 * POST /api/gdpr/dsr/create
 * Body: { type: DsrType, subjectName: string, subjectEmail: string, notes?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { createDsr, type DsrType } from "@/lib/data/gdpr";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { type?: string; subjectName?: string; subjectEmail?: string; notes?: string } | null;
  const valid: DsrType[] = ["access", "rectification", "erasure", "restriction", "portability", "objection"];
  if (!body || !valid.includes(body.type as DsrType) || !body.subjectName || !body.subjectEmail) {
    return NextResponse.json({ error: "type/subjectName/subjectEmail required" }, { status: 400 });
  }
  const session = await getSession();
  const id = await createDsr(session, {
    type: body.type as DsrType,
    subjectName: body.subjectName,
    subjectEmail: body.subjectEmail,
    notes: body.notes,
  });
  return NextResponse.json({ id });
}
