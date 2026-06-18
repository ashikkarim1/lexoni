/**
 * GET /api/cron/reindex-knowledge
 * Weekly: re-run the chunk indexer across every tenant. Heavy but rare;
 * 60s max duration. Skip when no DB; never crash the cron job.
 */
import { NextResponse } from "next/server";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { indexAll } from "@/lib/knowledge";
import { isAuthorisedCron } from "@/lib/security/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorisedCron(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!dbReady) return NextResponse.json({ ok: true, skipped: "no_db" });

  const tenants = await db.select({ id: s.tenants.id }).from(s.tenants);
  let totalIndexed = 0;
  let totalChunks  = 0;
  for (const t of tenants) {
    try {
      // The session shape only needs tenantId for tenantScope().
      const fakeSession = { tenantId: t.id, userId: t.id, role: "platform_admin" as const };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await indexAll(fakeSession as any);
      totalIndexed += result.indexed;
      totalChunks  += result.chunks;
    } catch { /* keep going across tenants */ }
  }
  return NextResponse.json({ ok: true, tenants: tenants.length, indexed: totalIndexed, chunks: totalChunks });
}
