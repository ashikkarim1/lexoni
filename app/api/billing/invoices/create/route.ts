import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { createInvoiceFromUnbilledWip } from "@/lib/data/billing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { caseId?: string; dueInDays?: number } | null;
  if (!body?.caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });
  const session = await getSession();
  const result = await createInvoiceFromUnbilledWip(session, { caseId: body.caseId, dueInDays: body.dueInDays });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
