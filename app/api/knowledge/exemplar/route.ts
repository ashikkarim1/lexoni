/**
 * Mark / unmark a knowledge item as a firm-voice exemplar.
 *
 *   PATCH /api/knowledge/exemplar  { id, isExemplar }
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import { getSession } from "@/lib/auth/session-server";
import { writeAudit } from "@/lib/data/audit";

export async function PATCH(req: Request) {
  const session = await getSession();
  const { id, isExemplar } = (await req.json()) as { id: string; isExemplar: boolean };
  if (!id || typeof isExemplar !== "boolean") {
    return NextResponse.json({ error: "id + isExemplar required" }, { status: 400 });
  }
  if (!dbReady) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 });

  await db
    .update(s.knowledgeItems)
    .set({ isExemplar })
    .where(and(tenantScope(session, s.knowledgeItems), eq(s.knowledgeItems.id, id)));

  await writeAudit(session, {
    action: isExemplar ? "knowledge_item_marked_exemplar" : "knowledge_item_unmarked_exemplar",
    entityKind: "knowledge_item",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
