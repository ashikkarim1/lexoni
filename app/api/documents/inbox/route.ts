/**
 * Drop a document into the firm inbox.
 *
 *   POST /api/documents/inbox    multipart: file
 *   → parses, classifies, either auto-files (confidence ≥ AUTO_FILE_CUTOFF)
 *     or queues for human triage on /documents.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { ingestForInbox } from "@/lib/data/document-inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
]);
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getSession();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: `mime not allowed: ${file.type}` }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file too large (>25 MB)" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await ingestForInbox(session, { filename: file.name, mime: file.type, bytes });
  return NextResponse.json(result);
}
