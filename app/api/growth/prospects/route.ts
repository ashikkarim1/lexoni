import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { addProspect, updateProspectStatus, computeLookalike, spawnFromRegulatoryImpact } from "@/lib/data/prospects";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  const body = await req.json();
  try {
    if (body?.spawnFromAssessmentId) {
      const out = await spawnFromRegulatoryImpact(session, body.spawnFromAssessmentId);
      return NextResponse.json(out);
    }
    if (!body?.legalName) return NextResponse.json({ error: "legalName required" }, { status: 400 });
    const lookalike = await computeLookalike(session, { region: body.region ?? "UAE", industry: body.industry, jurisdiction: body.jurisdiction, targetKind: body.targetKind });
    const out = await addProspect(session, { ...body, lookalikeScore: lookalike.score });
    return NextResponse.json({ ...out, lookalike });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id + status required" }, { status: 400 });
  try {
    await updateProspectStatus(session, id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
