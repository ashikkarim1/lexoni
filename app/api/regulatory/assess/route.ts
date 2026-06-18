import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { assessUpdate } from "@/lib/regulatory/impact";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await getSession();
  const { updateId } = (await req.json()) as { updateId: string };
  if (!updateId) return NextResponse.json({ error: "updateId required" }, { status: 400 });
  try {
    const out = await assessUpdate(session, updateId);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
