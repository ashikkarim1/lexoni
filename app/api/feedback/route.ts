/**
 * POST /api/feedback   { kind, message, pageContext?, meta? }
 *   Saves user feedback. Tenant-scoped via the session. Always
 *   writes an audit-log entry so reviewers can see the trail.
 */
import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session-server";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

type Body = {
  kind: "feature_idea" | "bug" | "praise" | "other";
  message: string;
  pageContext?: string | null;
  meta?: Record<string, unknown>;
};

export async function POST(req: Request) {
  const session = await getSession();
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.kind || !body?.message?.trim()) {
    return NextResponse.json({ error: "kind + message required" }, { status: 400 });
  }
  const message = body.message.trim().slice(0, 4000);

  if (dbReady) {
    await db.insert(s.userFeedback).values({
      tenantId: session.tenantId,
      userId: session.userId,
      kind: body.kind,
      message,
      pageContext: body.pageContext ?? null,
      metaJson: (body.meta ?? null) as never,
    });
  }
  await writeAudit(session, {
    action: "user_feedback_submitted",
    entityKind: "user_feedback",
    afterJson: { kind: body.kind, pageContext: body.pageContext, length: message.length },
  });
  return NextResponse.json({ ok: true });
}
