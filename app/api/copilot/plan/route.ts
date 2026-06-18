import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { createPlan, approvePlan, rejectPlan } from "@/lib/data/copilot";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getSession();
  const body = (await req.json()) as { outcome: string; region?: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL"; jurisdiction?: string | null };
  if (!body.outcome?.trim()) {
    return NextResponse.json({ error: "outcome required" }, { status: 400 });
  }
  try {
    const out = await createPlan(session, body);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const body = (await req.json()) as { id: string; decision: "approve" | "reject"; reason?: string };
  if (!body.id || !body.decision) {
    return NextResponse.json({ error: "id + decision required" }, { status: 400 });
  }
  try {
    if (body.decision === "approve") await approvePlan(session, body.id);
    else await rejectPlan(session, body.id, body.reason ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
