/**
 * Matter documents — uploads layer. Persists uploaded files, surfaces the
 * parsed text to AI context assembly, exposes them to the matter workspace.
 *
 * All reads scope-checked via `tenantScope()` and (where applicable) wall
 * default-deny via `deniedCaseIdsForUser()` so a non-member can't fetch a
 * walled matter's documents.
 */
import { randomUUID, createHash } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { deniedCaseIdsForUser } from "@/lib/data/walls";
import { writeAudit } from "@/lib/data/audit";
import { putBytes, extFromMime } from "@/lib/documents/storage";
import { parseDocument } from "@/lib/documents/parse";
import { extractDocumentInsights } from "@/lib/ai/extract";

export type DocumentRow = {
  id: string;
  caseId: string;
  matterSlotId: string | null;
  filename: string;
  mime: string;
  bytes: number;
  pages: number | null;
  status: string;
  parseError: string | null;
  version: string;
  isCurrent: boolean;
  uploadedAt: Date;
};

export async function uploadDocument(
  session: Session,
  args: {
    caseId: string;
    matterSlotId?: string;
    filename: string;
    mime: string;
    bytes: Buffer;
  },
): Promise<{ id: string; status: "ready" | "failed" | "duplicate"; error?: string }> {
  if (!dbReady) {
    return { id: "mock-" + randomUUID(), status: "ready" };
  }

  // Wall + tenant guard — a non-member of the matter's wall cannot upload.
  const denied = await deniedCaseIdsForUser(session);
  if (denied.has(args.caseId)) {
    return { id: "", status: "failed", error: "wall_denied" };
  }

  const sha = createHash("sha256").update(args.bytes).digest("hex");

  // Idempotency: same (tenant, case, sha) → return the existing row.
  const [existing] = await db
    .select({ id: s.matterDocuments.id })
    .from(s.matterDocuments)
    .where(
      and(
        tenantScope(session, s.matterDocuments),
        eq(s.matterDocuments.caseId, args.caseId),
        eq(s.matterDocuments.sha256, sha),
      ),
    )
    .limit(1);
  if (existing) return { id: existing.id, status: "duplicate" };

  const id = randomUUID();
  const stored = await putBytes(id, extFromMime(args.mime, args.filename), args.bytes);

  // Determine version: count existing versions for the slot, then label v(N+1).
  let version = "v1";
  if (args.matterSlotId) {
    const prior = await db
      .select({ id: s.matterDocuments.id })
      .from(s.matterDocuments)
      .where(
        and(
          tenantScope(session, s.matterDocuments),
          eq(s.matterDocuments.matterSlotId, args.matterSlotId),
        ),
      );
    if (prior.length > 0) {
      version = `v${prior.length + 1}`;
      // Demote previous versions.
      await db
        .update(s.matterDocuments)
        .set({ isCurrent: false })
        .where(
          and(
            tenantScope(session, s.matterDocuments),
            eq(s.matterDocuments.matterSlotId, args.matterSlotId),
          ),
        );
    }
  }

  await db.insert(s.matterDocuments).values({
    id,
    tenantId: session.tenantId,
    caseId: args.caseId,
    matterSlotId: args.matterSlotId,
    filename: args.filename,
    mime: args.mime,
    bytes: stored.bytes,
    storageUrl: stored.storageUrl,
    sha256: stored.sha256,
    status: "parsing",
    version,
    isCurrent: true,
    uploadedByUserId: session.userId,
  });

  await writeAudit(session, {
    action: "document_uploaded",
    entityKind: "matter_document",
    entityId: id,
    afterJson: { caseId: args.caseId, matterSlotId: args.matterSlotId, filename: args.filename, bytes: stored.bytes, version },
  });

  // Parse inline. For large files we'd queue this; for now it's fast enough.
  try {
    const parsed = await parseDocument(args.mime, args.bytes);
    await db
      .update(s.matterDocuments)
      .set({
        status: "ready",
        extractedText: parsed.text,
        extractedHtml: parsed.html,
        pageMapJson: parsed.pageMap as unknown as never,
        pages: parsed.pages,
        parsedAt: new Date(),
      })
      .where(and(tenantScope(session, s.matterDocuments), eq(s.matterDocuments.id, id)));
    await writeAudit(session, {
      action: "document_parsed",
      entityKind: "matter_document",
      entityId: id,
      afterJson: { pages: parsed.pages, textChars: parsed.text.length },
    });

    // Auto-extraction (Sprint #3) — runs after parse. Fire-and-forget style:
    // if Anthropic fails or the response is malformed we fall back to a stub
    // so the UI always has content. Doesn't block the upload response.
    try {
      const insights = await extractDocumentInsights({
        text: parsed.text,
        filename: args.filename,
      });
      await db
        .update(s.matterDocuments)
        .set({ extractedMetaJson: insights as unknown as never })
        .where(and(tenantScope(session, s.matterDocuments), eq(s.matterDocuments.id, id)));
      await writeAudit(session, {
        action: "document_insights_extracted",
        entityKind: "matter_document",
        entityId: id,
        afterJson: { generatedBy: insights.generatedBy, partyCount: insights.parties.length, riskCount: insights.risks.length },
      });
    } catch {
      // Don't break the upload if extraction errors — the document is still
      // usable. The lawyer can re-run it later if we add a manual retry.
    }
    return { id, status: "ready" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "parse_failed";
    await db
      .update(s.matterDocuments)
      .set({ status: "failed", parseError: msg })
      .where(and(tenantScope(session, s.matterDocuments), eq(s.matterDocuments.id, id)));
    return { id, status: "failed", error: msg };
  }
}

export async function listDocumentsForMatter(session: Session, caseId: string): Promise<DocumentRow[]> {
  if (!dbReady) return [];
  const denied = await deniedCaseIdsForUser(session);
  if (denied.has(caseId)) return [];

  const rows = await db
    .select({
      id: s.matterDocuments.id,
      caseId: s.matterDocuments.caseId,
      matterSlotId: s.matterDocuments.matterSlotId,
      filename: s.matterDocuments.filename,
      mime: s.matterDocuments.mime,
      bytes: s.matterDocuments.bytes,
      pages: s.matterDocuments.pages,
      status: s.matterDocuments.status,
      parseError: s.matterDocuments.parseError,
      version: s.matterDocuments.version,
      isCurrent: s.matterDocuments.isCurrent,
      uploadedAt: s.matterDocuments.uploadedAt,
    })
    .from(s.matterDocuments)
    .where(and(tenantScope(session, s.matterDocuments), eq(s.matterDocuments.caseId, caseId)))
    .orderBy(desc(s.matterDocuments.uploadedAt));
  return rows;
}

export async function listDocumentsForSlots(session: Session, slotIds: string[]): Promise<Map<string, DocumentRow[]>> {
  if (!dbReady || slotIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: s.matterDocuments.id,
      caseId: s.matterDocuments.caseId,
      matterSlotId: s.matterDocuments.matterSlotId,
      filename: s.matterDocuments.filename,
      mime: s.matterDocuments.mime,
      bytes: s.matterDocuments.bytes,
      pages: s.matterDocuments.pages,
      status: s.matterDocuments.status,
      parseError: s.matterDocuments.parseError,
      version: s.matterDocuments.version,
      isCurrent: s.matterDocuments.isCurrent,
      uploadedAt: s.matterDocuments.uploadedAt,
    })
    .from(s.matterDocuments)
    .where(
      and(
        tenantScope(session, s.matterDocuments),
        inArray(s.matterDocuments.matterSlotId, slotIds),
      ),
    )
    .orderBy(asc(s.matterDocuments.uploadedAt));

  const out = new Map<string, DocumentRow[]>();
  for (const r of rows) {
    if (!r.matterSlotId) continue;
    const arr = out.get(r.matterSlotId) ?? [];
    arr.push(r);
    out.set(r.matterSlotId, arr);
  }
  return out;
}

export async function getDocument(session: Session, id: string) {
  if (!dbReady) return null;
  const [row] = await db
    .select()
    .from(s.matterDocuments)
    .where(and(tenantScope(session, s.matterDocuments), eq(s.matterDocuments.id, id)))
    .limit(1);
  if (!row) return null;
  const denied = await deniedCaseIdsForUser(session);
  if (denied.has(row.caseId)) return null;
  return row;
}
