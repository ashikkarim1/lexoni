/**
 * PATCH /api/slots
 *
 * Persists a matter_document_slot update (status / autofill / template attach)
 * and writes the audit_log entries. In mock mode (no DATABASE_URL) the route
 * succeeds without persisting - the workspace UI keeps its optimistic state.
 *
 * Body: { slotId: string, status?, autofilledFromClient?, coreDetailDiffJson?,
 *         attachedTemplateTitle? } - see lib/data/slots.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { patchSlot, type SlotPatch } from "@/lib/data/slots";

export const runtime = "nodejs";

type Body = { slotId?: string } & SlotPatch;

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.slotId) {
    return NextResponse.json({ error: "slotId is required" }, { status: 400 });
  }
  const session = await getSession();
  const result = await patchSlot(session, body.slotId, {
    status: body.status,
    autofilledFromClient: body.autofilledFromClient,
    coreDetailDiffJson: body.coreDetailDiffJson,
    attachedTemplateTitle: body.attachedTemplateTitle,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
