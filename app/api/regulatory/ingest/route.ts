/**
 * Sprint 16.1 - regulatory ingest.
 *
 *   POST /api/regulatory/ingest
 *     { region, regulator, title, summary?, fullText?, sourceUrl?,
 *       publishedAt (ISO), severity?, extractedJson? }
 *
 * Real RSS / API pollers (lib/regulatory/sources/*) call this internally.
 * For the demo + hand-curated rules, partners can also paste an update in
 * directly through a small form on /compliance/changes.
 */
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session-server";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

type Body = {
  region: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL";
  regulator: string;
  title: string;
  summary?: string;
  fullText?: string;
  sourceUrl?: string;
  publishedAt: string;
  severity?: "info" | "low" | "medium" | "high" | "critical";
  extractedJson?: Record<string, unknown>;
  providerKey?: string;
};

export async function POST(req: Request) {
  const session = await getSession();
  const b = (await req.json()) as Body;
  if (!b.region || !b.regulator || !b.title || !b.publishedAt) {
    return NextResponse.json({ error: "region, regulator, title, publishedAt required" }, { status: 400 });
  }
  if (!dbReady) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 });

  const providerKey = b.providerKey ?? createHash("sha256").update(`${b.regulator}|${b.title}|${b.publishedAt}`).digest("hex").slice(0, 32);
  const [row] = await db
    .insert(s.regulatoryUpdates)
    .values({
      providerKey,
      region: b.region,
      regulator: b.regulator,
      title: b.title,
      summary: b.summary ?? null,
      fullText: b.fullText ?? null,
      sourceUrl: b.sourceUrl ?? null,
      publishedAt: new Date(b.publishedAt),
      severity: b.severity ?? "info",
      extractedJson: (b.extractedJson ?? null) as never,
      status: "ingested",
    })
    .onConflictDoNothing()
    .returning({ id: s.regulatoryUpdates.id });

  if (!row) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  await writeAudit(session, {
    action: "regulatory_update_ingested",
    entityKind: "regulatory_update",
    entityId: row.id,
    afterJson: { regulator: b.regulator, title: b.title, severity: b.severity ?? "info" },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
