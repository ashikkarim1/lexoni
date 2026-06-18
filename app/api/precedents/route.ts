import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { cloneToPrecedent, approvePrecedent } from "@/lib/data/precedents";

export async function POST(req: Request) {
  const session = await getSession();
  const body = (await req.json()) as Parameters<typeof cloneToPrecedent>[1];
  if (!body?.sourceDocumentId || !body?.title) {
    return NextResponse.json({ error: "sourceDocumentId and title required" }, { status: 400 });
  }
  try {
    const out = await cloneToPrecedent(session, body);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const { id } = (await req.json()) as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try { await approvePrecedent(session, id); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 }); }
}
