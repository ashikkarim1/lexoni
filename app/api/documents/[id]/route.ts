/**
 * GET /api/documents/:id        → bytes (for the inline viewer in Sprint #2)
 * GET /api/documents/:id?meta=1 → JSON metadata + extracted text
 *
 * Wall-scoped via `getDocument()`. Records a view in `access_log`.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { getDocument } from "@/lib/data/documents";
import { getBytes } from "@/lib/documents/storage";
import { recordAccess } from "@/lib/data/access";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const row = await getDocument(session, params.id);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await recordAccess(session, {
    action: "view",
    entityKind: "matter_document",
    entityId: row.id,
    caseId: row.caseId,
  });

  const meta = req.nextUrl.searchParams.get("meta");
  if (meta === "1") {
    return NextResponse.json({
      id: row.id,
      filename: row.filename,
      mime: row.mime,
      bytes: row.bytes,
      pages: row.pages,
      status: row.status,
      version: row.version,
      isCurrent: row.isCurrent,
      extractedText: row.extractedText,
      extractedHtml: row.extractedHtml,
      pageMapJson: row.pageMapJson,
      extractedMetaJson: row.extractedMetaJson,
      uploadedAt: row.uploadedAt,
    });
  }

  const bytes = await getBytes(row.storageUrl);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${encodeURIComponent(row.filename)}"`,
    },
  });
}
