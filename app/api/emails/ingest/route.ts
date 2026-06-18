/**
 * Manual + provider-stub email ingestion.
 *
 *   POST /api/emails/ingest  {provider, providerMessageId, direction, subject,
 *                             fromAddress, toAddresses[], ccAddresses?, inReplyTo?,
 *                             threadId?, receivedAt (ISO), bodyText?, bodyHtml?,
 *                             attachmentsJson?, mailboxUserId?}
 *
 * The Outlook + Gmail OAuth pollers (when wired) call this internally with
 * the same shape. Until then, manual paste-in from the matter page works.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { ingestEmail, type IngestEmail } from "@/lib/data/matter-emails";

export async function POST(req: Request) {
  const session = await getSession();
  const body = (await req.json()) as IngestEmail & { receivedAt: string | Date };
  if (!body?.subject || !body?.fromAddress || !body?.providerMessageId) {
    return NextResponse.json({ error: "subject, fromAddress, providerMessageId required" }, { status: 400 });
  }
  try {
    const out = await ingestEmail(session, {
      ...body,
      receivedAt: new Date(body.receivedAt),
    });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
