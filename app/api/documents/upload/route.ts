/**
 * POST /api/documents/upload
 *
 * Multipart upload. Body fields: `file` (the bytes), `caseId`, `matterSlotId?`,
 * `version?`. Returns the persisted matter_documents row id + parse status.
 *
 * Allowed MIME types: PDF, DOCX, DOC, plain text, markdown. Up to 25 MB per
 * file. Wall-aware: a non-member of the matter's wall is refused with 403.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { uploadDocument } from "@/lib/data/documents";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
]);

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "multipart_form_required" }, { status: 400 });
  }
  const file = form.get("file");
  const caseId = String(form.get("caseId") ?? "");
  const matterSlotId = form.get("matterSlotId") ? String(form.get("matterSlotId")) : undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large", maxBytes: MAX_BYTES }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "unsupported_mime", mime: file.type }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const session = await getSession();
  const result = await uploadDocument(session, {
    caseId,
    matterSlotId,
    filename: file.name,
    mime: file.type,
    bytes,
  });

  if (result.status === "failed" && result.error === "wall_denied") {
    return NextResponse.json({ error: "wall_denied" }, { status: 403 });
  }
  if (result.status === "failed") {
    return NextResponse.json({ error: "parse_failed", detail: result.error }, { status: 502 });
  }
  return NextResponse.json({ id: result.id, status: result.status });
}
