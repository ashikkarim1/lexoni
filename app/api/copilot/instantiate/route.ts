import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { instantiatePlan } from "@/lib/data/copilot";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await getSession();
  const body = (await req.json()) as { id: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const out = await instantiatePlan(session, body.id);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
