/**
 * Engagement-letter & Copilot use this endpoint to fetch the predicted
 * cost / duration / risk band before quoting the client.
 *
 *   POST /api/predict { matterKind, region }
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { predictForMatter } from "@/lib/ai/predict";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  const body = (await req.json()) as { matterKind: string; region: string };
  if (!body.matterKind || !body.region) return NextResponse.json({ error: "matterKind + region required" }, { status: 400 });
  const out = await predictForMatter(session, body);
  return NextResponse.json(out);
}
