/**
 * POST /api/time/confirm
 *
 * Confirms one or more `time_entry_drafts` for the calling user. Inserts a
 * `time_entries` row per draft (source='passive', confirmedAt=now) and writes
 * an audit_log entry for each. The Desk's WIP and Firm Pulse's recoverable
 * figures pick up the changes on the next render (server components - call
 * `router.refresh()` after the POST).
 *
 * Body: { draftIds: string[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { confirmDrafts } from "@/lib/data/time";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { draftIds?: string[] } | null;
  const draftIds = Array.isArray(body?.draftIds) ? body!.draftIds.filter((x): x is string => typeof x === "string") : [];
  const session = await getSession();
  const result = await confirmDrafts(session, draftIds);
  return NextResponse.json({ ok: true, ...result });
}
