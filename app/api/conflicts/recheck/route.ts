/**
 * POST /api/conflicts/recheck
 * Body: { caseId: string, newParties: string[] }
 * Returns: ConflictResult - the new conflict_checks row.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { reCheckMatterParties } from "@/lib/data/conflicts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { caseId?: string; newParties?: string[] } | null;
  if (!body?.caseId || !Array.isArray(body.newParties) || body.newParties.length === 0) {
    return NextResponse.json({ error: "caseId + newParties[] required" }, { status: 400 });
  }
  const session = await getSession();
  const result = await reCheckMatterParties(
    session,
    body.caseId,
    body.newParties.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((p) => p.trim()),
  );
  return NextResponse.json(result);
}
