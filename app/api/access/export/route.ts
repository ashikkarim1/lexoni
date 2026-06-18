/**
 * POST /api/access/export
 * Records an export event with the lawyer-supplied reason. Used by the
 * export-with-reason modal - the bytes leave the server only after this
 * write succeeds.
 *
 * Body: { entityKind: string, entityId?: string, caseId?: string, reason: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { getExportPolicy, recordAccess } from "@/lib/data/access";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    entityKind?: string;
    entityId?: string;
    caseId?: string;
    reason?: string;
  } | null;
  if (!body?.entityKind) return NextResponse.json({ error: "entityKind is required" }, { status: 400 });

  const session = await getSession();
  const policy = await getExportPolicy(session);
  if (policy.requireReason && !body.reason?.trim()) {
    return NextResponse.json({ error: "reason is required by policy" }, { status: 403 });
  }
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  await recordAccess(session, {
    action: "export",
    entityKind: body.entityKind,
    entityId: body.entityId,
    caseId: body.caseId,
    exportReason: body.reason?.trim(),
    ipAddress: ipAddress ?? undefined,
    userAgent: userAgent ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
