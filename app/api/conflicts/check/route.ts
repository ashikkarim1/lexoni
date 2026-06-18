/**
 * POST /api/conflicts/check
 * Body: { subjectName: string, adverseParties?: string[], caseId?, intakeId? }
 * Returns: { id, outcome, matches }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { runConflictCheck } from "@/lib/data/conflicts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    subjectName?: string;
    adverseParties?: string[];
    caseId?: string;
    intakeId?: string;
  } | null;
  if (!body?.subjectName?.trim()) {
    return NextResponse.json({ error: "subjectName is required" }, { status: 400 });
  }
  const session = await getSession();
  const result = await runConflictCheck(session, {
    subjectName: body.subjectName.trim(),
    adverseParties: body.adverseParties,
    caseId: body.caseId,
    intakeId: body.intakeId,
  });
  return NextResponse.json(result);
}
