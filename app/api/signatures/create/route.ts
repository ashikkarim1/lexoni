import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { createWorkflow, type CreateWorkflowInput } from "@/lib/data/signatures";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as CreateWorkflowInput | null;
  if (!body) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const session = await getSession();
  const r = await createWorkflow(session, body);
  if ("error" in r) return NextResponse.json(r, { status: 400 });
  return NextResponse.json(r);
}
