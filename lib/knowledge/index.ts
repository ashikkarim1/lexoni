/**
 * Knowledge OS — Sprint 13.
 *
 * Unified retrieval over the firm's institutional record: matter_documents,
 * precedents, knowledge_items, matter_emails. Two entry points:
 *
 *   indexSource(session, kind, id)   — index ONE row (called on write paths)
 *   indexAll(session)                — bulk re-index (called by /api/memory/reindex)
 *   retrieve(session, query, opts)   — search; ALWAYS wall-aware
 *
 * Wall enforcement is the non-negotiable part. The retrieve() helper calls
 * `deniedCaseIdsForUser` and prunes the candidate set BEFORE scoring —
 * a non-member's query can never surface a walled chunk regardless of how
 * the prompt is phrased. There is a dedicated test in
 * scripts/test-knowledge-walls.ts asserting this end-to-end.
 *
 * Scoring is a deterministic BM25-flavoured lexical score over termsJson.
 * When a real embedder lands (pgvector / Anthropic embeddings), it plugs in
 * behind the same `retrieve` signature — callers do not care.
 */
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { deniedCaseIdsForUser } from "@/lib/data/walls";
import { chunkText, extractTerms } from "@/lib/knowledge/chunk";

export type ChunkRow = {
  id: string;
  sourceKind: "matter_document" | "precedent" | "knowledge_item" | "matter_email";
  sourceId: string;
  sourceCaseId: string | null;
  sourceTitle: string;
  ordinal: number;
  text: string;
  language: string;
};

export type RetrieveResult = ChunkRow & { score: number };

// ────────────────────────────────────────────────────────────────────────
// Indexing
// ────────────────────────────────────────────────────────────────────────

/** Re-index every eligible source for the tenant. Idempotent — replaces the
 *  source's existing chunks. Useful from /api/memory/reindex + tests. */
export async function indexAll(session: Session): Promise<{ indexed: number; chunks: number }> {
  if (!dbReady) return { indexed: 0, chunks: 0 };

  // Matter documents — ready status only.
  const docs = await db
    .select({
      id: s.matterDocuments.id,
      caseId: s.matterDocuments.caseId,
      filename: s.matterDocuments.filename,
      extractedText: s.matterDocuments.extractedText,
    })
    .from(s.matterDocuments)
    .where(and(tenantScope(session, s.matterDocuments), eq(s.matterDocuments.status, "ready")));

  // Precedents.
  const precs = await db
    .select({
      id: s.precedents.id,
      caseId: s.precedents.sourceCaseId,
      title: s.precedents.title,
      bodyText: s.precedents.bodyText,
    })
    .from(s.precedents)
    .where(tenantScope(session, s.precedents));

  // Knowledge items.
  const kis = await db
    .select({
      id: s.knowledgeItems.id,
      title: s.knowledgeItems.title,
      content: s.knowledgeItems.bodyMd,
      approved: s.knowledgeItems.approved,
      learnFromThis: s.knowledgeItems.learnFromThis,
    })
    .from(s.knowledgeItems)
    .where(tenantScope(session, s.knowledgeItems));

  // Filed emails.
  const ems = await db
    .select({
      id: s.matterEmails.id,
      caseId: s.matterEmails.caseId,
      subject: s.matterEmails.subject,
      bodyText: s.matterEmails.bodyText,
    })
    .from(s.matterEmails)
    .where(tenantScope(session, s.matterEmails));

  let indexed = 0, totalChunks = 0;
  for (const d of docs) {
    if (!d.extractedText) continue;
    const c = await indexOne(session, "matter_document", d.id, d.filename, d.extractedText, d.caseId);
    if (c > 0) { indexed++; totalChunks += c; }
  }
  for (const p of precs) {
    if (!p.bodyText) continue;
    const c = await indexOne(session, "precedent", p.id, p.title, p.bodyText, p.caseId);
    if (c > 0) { indexed++; totalChunks += c; }
  }
  for (const k of kis) {
    if (!k.approved || !k.learnFromThis || !k.content) continue;
    const c = await indexOne(session, "knowledge_item", k.id, k.title, k.content, null);
    if (c > 0) { indexed++; totalChunks += c; }
  }
  for (const e of ems) {
    if (!e.bodyText) continue;
    const title = `Email: ${e.subject}`;
    const c = await indexOne(session, "matter_email", e.id, title, e.bodyText, e.caseId);
    if (c > 0) { indexed++; totalChunks += c; }
  }
  return { indexed, chunks: totalChunks };
}

/** Index a single source — used by write-path hooks and indexAll. */
export async function indexOne(
  session: Session,
  sourceKind: ChunkRow["sourceKind"],
  sourceId: string,
  sourceTitle: string,
  text: string,
  sourceCaseId: string | null,
): Promise<number> {
  if (!dbReady) return 0;
  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;

  // Replace existing chunks for this source — keeps re-index idempotent.
  await db
    .delete(s.knowledgeChunks)
    .where(and(
      eq(s.knowledgeChunks.tenantId, session.tenantId),
      eq(s.knowledgeChunks.sourceKind, sourceKind),
      eq(s.knowledgeChunks.sourceId, sourceId),
    ));

  await db.insert(s.knowledgeChunks).values(
    chunks.map((chunk, ordinal) => ({
      tenantId: session.tenantId,
      sourceKind,
      sourceId,
      sourceCaseId,
      sourceTitle,
      ordinal,
      text: chunk,
      termsJson: extractTerms(chunk) as never,
      embeddingJson: null,
      language: "en",
    })),
  );

  return chunks.length;
}

// ────────────────────────────────────────────────────────────────────────
// Retrieval — wall-aware BM25-flavoured lexical scoring
// ────────────────────────────────────────────────────────────────────────

export type RetrieveOpts = {
  limit?: number;
  sourceKinds?: ChunkRow["sourceKind"][];
};

export async function retrieve(
  session: Session,
  query: string,
  opts: RetrieveOpts = {},
): Promise<RetrieveResult[]> {
  if (!dbReady) return [];
  const queryTerms = extractTerms(query);
  if (queryTerms.length === 0) return [];

  const denied = await deniedCaseIdsForUser(session);

  const filters: ReturnType<typeof eq>[] = [tenantScope(session, s.knowledgeChunks)];
  if (opts.sourceKinds?.length) {
    filters.push(inArray(s.knowledgeChunks.sourceKind, opts.sourceKinds));
  }
  // Wall filter: drop chunks whose sourceCaseId is in the denied set. We
  // also keep firm-wide chunks (sourceCaseId IS NULL).
  if (denied.size > 0) {
    const allowedCase = or(
      isNull(s.knowledgeChunks.sourceCaseId),
      sql`${s.knowledgeChunks.sourceCaseId} NOT IN (${sql.join([...denied].map((d) => sql`${d}`), sql`, `)})`,
    );
    if (allowedCase) filters.push(allowedCase);
  }

  const rows = await db
    .select({
      id: s.knowledgeChunks.id,
      sourceKind: s.knowledgeChunks.sourceKind,
      sourceId: s.knowledgeChunks.sourceId,
      sourceCaseId: s.knowledgeChunks.sourceCaseId,
      sourceTitle: s.knowledgeChunks.sourceTitle,
      ordinal: s.knowledgeChunks.ordinal,
      text: s.knowledgeChunks.text,
      termsJson: s.knowledgeChunks.termsJson,
      language: s.knowledgeChunks.language,
    })
    .from(s.knowledgeChunks)
    .where(and(...filters))
    .orderBy(desc(s.knowledgeChunks.createdAt))
    .limit(2000);  // candidate cap; safe for the demo, replace w/ vector later

  // Lexical scoring — BM25-flavoured. Plain Jaccard would over-reward
  // tiny chunks; we weight by query-coverage × source-rarity.
  const docFreq: Record<string, number> = {};
  for (const r of rows) {
    const terms = (r.termsJson as string[] | null) ?? [];
    const seen = new Set<string>();
    for (const t of terms) {
      if (seen.has(t)) continue;
      seen.add(t);
      docFreq[t] = (docFreq[t] ?? 0) + 1;
    }
  }
  const N = rows.length || 1;

  const scored: RetrieveResult[] = [];
  for (const r of rows) {
    const terms = new Set((r.termsJson as string[] | null) ?? []);
    let score = 0;
    let hits = 0;
    for (const q of queryTerms) {
      if (!terms.has(q)) continue;
      hits += 1;
      const df = docFreq[q] ?? 1;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      score += idf;
    }
    if (hits === 0) continue;
    score *= hits / queryTerms.length;  // query-coverage weighting
    scored.push({
      id: r.id,
      sourceKind: r.sourceKind as ChunkRow["sourceKind"],
      sourceId: r.sourceId,
      sourceCaseId: r.sourceCaseId,
      sourceTitle: r.sourceTitle,
      ordinal: r.ordinal,
      text: r.text,
      language: r.language,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, opts.limit ?? 12);
}
