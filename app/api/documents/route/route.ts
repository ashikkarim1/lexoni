/**
 * Document inbox routing API.
 *
 *   POST   /api/documents/route   { inboxId, caseId, slotId? }  → file
 *   DELETE /api/documents/route   { inboxId, reason }           → reject
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { fileFromInbox, rejectFromInbox } from "@/lib/data/document-inbox";

export async function POST(req: Request) {
  const session = await getSession();
  const body = (await req.json()) as { inboxId: string; caseId: string; slotId?: string | null };
  if (!body.inboxId || !body.caseId) {
    return NextResponse.json({ error: "inboxId and caseId required" }, { status: 400 });
  }
  try {
    const filed = await fileFromInbox(session, body.inboxId, {
      caseId: body.caseId,
      slotId: body.slotId ?? null,
    });
    return NextResponse.json({ ok: true, matterDocumentId: filed.matterDocumentId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  const body = (await req.json()) as { inboxId: string; reason?: string };
  if (!body.inboxId) return NextResponse.json({ error: "inboxId required" }, { status: 400 });
  try {
    await rejectFromInbox(session, body.inboxId, body.reason ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
