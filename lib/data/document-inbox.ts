/**
 * Document inbox — Sprint 11.1.
 *
 * When a lawyer drops a document on Lexoni without choosing a matter (e.g. on
 * /documents, or via an email-forward, or via a mobile share-sheet), it lands
 * here first. We:
 *   1. Parse the bytes (extract text, mime-aware) via lib/documents/parse.
 *   2. Ask Claude (or a deterministic fallback) which (matter, slot) this
 *      belongs to — citing parties, dates, document kind, party signals.
 *   3. If confidence ≥ AUTO_FILE_CUTOFF, we file directly into matter_documents
 *      and skip human triage. Otherwise the row stays `pending` and surfaces
 *      on /documents for one-click filing.
 *
 * Routing is wall-aware: the candidate matter set is filtered to matters the
 * uploader can see. Filing a doc into a walled matter via auto-route would
 * surface its existence to non-members; this prevents that.
 */
import { and, desc, eq } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { parseDocument } from "@/lib/documents/parse";
import { putBytes } from "@/lib/documents/storage";
import { listMatters } from "@/lib/data/matters";
import { writeAudit } from "@/lib/data/audit";

export const AUTO_FILE_CUTOFF = 80;

export type RoutingSuggestion = {
  caseId: string | null;
  caseTitle: string | null;
  slotId: string | null;
  slotTitle: string | null;
  confidence: number;
  reasoning: string;
};

export type InboxRow = {
  id: string;
  filename: string;
  mime: string;
  bytes: number;
  status: "pending" | "filed" | "rejected";
  routingConfidence: number | null;
  suggestedRouting: RoutingSuggestion | null;
  uploadedByName: string | null;
  filedAt: Date | null;
  createdAt: Date;
};

export async function listInbox(session: Session, opts: { status?: "pending" | "filed" | "rejected" } = {}): Promise<InboxRow[]> {
  if (!dbReady) return [];
  const filters = [tenantScope(session, s.documentInbox)];
  if (opts.status) filters.push(eq(s.documentInbox.status, opts.status));
  const rows = await db
    .select({
      id: s.documentInbox.id,
      filename: s.documentInbox.filename,
      mime: s.documentInbox.mime,
      bytes: s.documentInbox.bytes,
      status: s.documentInbox.status,
      routingConfidence: s.documentInbox.routingConfidence,
      suggestedRoutingJson: s.documentInbox.suggestedRoutingJson,
      uploadedByName: s.users.fullName,
      filedAt: s.documentInbox.filedAt,
      createdAt: s.documentInbox.createdAt,
    })
    .from(s.documentInbox)
    .leftJoin(s.users, eq(s.users.id, s.documentInbox.uploadedByUserId))
    .where(filters.length === 1 ? filters[0] : and(...filters))
    .orderBy(desc(s.documentInbox.createdAt));
  return rows.map((r) => ({
    ...r,
    status: r.status as InboxRow["status"],
    suggestedRouting: (r.suggestedRoutingJson as RoutingSuggestion | null) ?? null,
  }));
}

/**
 * Ingest a fresh document, parse it, attempt to classify, and either auto-file
 * or leave in the inbox. Returns the inbox row id + the auto-filed matter
 * document id if it was filed.
 */
export async function ingestForInbox(
  session: Session,
  file: { filename: string; mime: string; bytes: Buffer },
): Promise<{ inboxId: string; filed?: { matterDocumentId: string; caseId: string; slotId: string | null } }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");

  // Persist bytes + parse first so the routing prompt has real text to chew.
  const id = randomUUID();
  const ext = (file.filename.split(".").pop() ?? "bin").toLowerCase();
  const sha256 = createHash("sha256").update(file.bytes).digest("hex");
  const stored = await putBytes(id, ext, file.bytes);
  const parsed = await parseDocument(file.mime, file.bytes).catch(() => ({
    text: "", html: null, pages: null, pageMap: null,
  }));

  // Build the candidate set — only matters this user can see.
  const matters = await listMatters(session);
  const suggestion = await classifyDocument(parsed.text, file.filename, matters);

  // Persist the inbox row.
  await db.insert(s.documentInbox).values({
    id,
    tenantId: session.tenantId,
    uploadedByUserId: session.userId,
    filename: file.filename,
    mime: file.mime,
    bytes: stored.bytes,
    storageUrl: stored.storageUrl,
    sha256,
    extractedText: parsed.text.slice(0, 10 * 1024 * 1024),
    suggestedRoutingJson: suggestion,
    routingConfidence: suggestion.confidence,
    status: "pending",
  });

  await writeAudit(session, {
    action: "document_inbox_ingested",
    entityKind: "document_inbox",
    entityId: id,
    afterJson: { filename: file.filename, bytes: stored.bytes, confidence: suggestion.confidence },
  });

  // Auto-file when the AI is confident AND it nominated a real matter+slot.
  if (suggestion.confidence >= AUTO_FILE_CUTOFF && suggestion.caseId) {
    const filed = await fileFromInbox(session, id, {
      caseId: suggestion.caseId,
      slotId: suggestion.slotId ?? null,
    });
    return { inboxId: id, filed: { matterDocumentId: filed.matterDocumentId, caseId: suggestion.caseId, slotId: suggestion.slotId ?? null } };
  }
  return { inboxId: id };
}

/** Move an inbox row into matter_documents and audit. Used by the auto-router
 *  AND the human triage on /documents. */
export async function fileFromInbox(
  session: Session,
  inboxId: string,
  target: { caseId: string; slotId: string | null },
): Promise<{ matterDocumentId: string }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const [row] = await db
    .select()
    .from(s.documentInbox)
    .where(and(tenantScope(session, s.documentInbox), eq(s.documentInbox.id, inboxId)))
    .limit(1);
  if (!row) throw new Error("Inbox row not found");

  // Wall guard: confirm the user can see the target matter.
  const visible = await listMatters(session);
  if (!visible.some((m) => m.id === target.caseId)) {
    throw new Error("Target matter not accessible (wall or tenant)");
  }

  const matterDocId = randomUUID();
  await db.insert(s.matterDocuments).values({
    id: matterDocId,
    tenantId: session.tenantId,
    caseId: target.caseId,
    matterSlotId: target.slotId,
    filename: row.filename,
    mime: row.mime,
    bytes: row.bytes,
    storageUrl: row.storageUrl,
    sha256: row.sha256,
    extractedText: row.extractedText,
    status: row.extractedText ? "ready" : "uploaded",
    uploadedByUserId: session.userId,
  });
  await db
    .update(s.documentInbox)
    .set({ status: "filed", filedDocumentId: matterDocId, filedByUserId: session.userId, filedAt: new Date() })
    .where(eq(s.documentInbox.id, inboxId));

  await writeAudit(session, {
    action: "document_inbox_filed",
    entityKind: "matter_document",
    entityId: matterDocId,
    afterJson: { inboxId, slotId: target.slotId, caseId: target.caseId },
  });
  return { matterDocumentId: matterDocId };
}

export async function rejectFromInbox(session: Session, inboxId: string, reason: string): Promise<void> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  await db
    .update(s.documentInbox)
    .set({ status: "rejected" })
    .where(and(tenantScope(session, s.documentInbox), eq(s.documentInbox.id, inboxId)));
  await writeAudit(session, {
    action: "document_inbox_rejected",
    entityKind: "document_inbox",
    entityId: inboxId,
    afterJson: { reason },
  });
}

// ────────────────────────────────────────────────────────────────────────
// Classifier — Anthropic if available, else a deterministic keyword scorer.
// ────────────────────────────────────────────────────────────────────────
type MatterCandidate = { id: string; title: string; client: string; matterNumber: string; processTitle: string };

async function classifyDocument(
  text: string,
  filename: string,
  matters: MatterCandidate[],
): Promise<RoutingSuggestion> {
  if (matters.length === 0) {
    return { caseId: null, caseTitle: null, slotId: null, slotTitle: null, confidence: 0,
      reasoning: "No matters available — file goes to inbox for triage." };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await classifyWithAnthropic(text, filename, matters);
    } catch {
      // fall through to deterministic
    }
  }
  return classifyDeterministic(text, filename, matters);
}

async function classifyWithAnthropic(
  text: string,
  filename: string,
  matters: MatterCandidate[],
): Promise<RoutingSuggestion> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sys = `You are a legal-ops classifier. Given a document and a list of open matters, pick the single best match. Return JSON {caseId, confidence (0-100), reasoning} only. If nothing fits, caseId=null with low confidence.`;
  const matterDigest = matters.map((m) => `- id=${m.id} | ${m.matterNumber} | ${m.title} | client=${m.client} | process=${m.processTitle}`).join("\n");
  const prompt = `Filename: ${filename}\n\nExtracted text (first 4000 chars):\n${text.slice(0, 4000)}\n\nMatters:\n${matterDigest}`;
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 400,
    system: sys,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content.find((b) => b.type === "text");
  const raw = block && "text" in block ? block.text : "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("No JSON in classifier response");
  const parsed = JSON.parse(json) as { caseId: string | null; confidence: number; reasoning: string };
  const matched = parsed.caseId ? matters.find((m) => m.id === parsed.caseId) ?? null : null;
  return {
    caseId: matched?.id ?? null,
    caseTitle: matched?.title ?? null,
    slotId: null,
    slotTitle: null,
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence))),
    reasoning: parsed.reasoning,
  };
}

function classifyDeterministic(
  text: string,
  filename: string,
  matters: MatterCandidate[],
): RoutingSuggestion {
  // Score each matter by token overlap with filename + first 8 KB of text.
  const haystack = `${filename}\n${text.slice(0, 8 * 1024)}`.toLowerCase();
  let best: { matter: MatterCandidate; score: number } | null = null;
  for (const m of matters) {
    const tokens = `${m.title} ${m.client} ${m.matterNumber}`.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    let score = 0;
    for (const tok of tokens) if (haystack.includes(tok)) score += 1;
    if (!best || score > best.score) best = { matter: m, score };
  }
  if (!best || best.score === 0) {
    return {
      caseId: null, caseTitle: null, slotId: null, slotTitle: null,
      confidence: 0,
      reasoning: "Deterministic classifier found no token overlap; queueing for human triage.",
    };
  }
  const ratio = Math.min(1, best.score / 3);  // 3 hits = full confidence
  return {
    caseId: best.matter.id,
    caseTitle: best.matter.title,
    slotId: null,
    slotTitle: null,
    confidence: Math.round(ratio * 70),  // deterministic caps at 70 → never auto-files (cutoff is 80)
    reasoning: `Deterministic match on tokens overlapping "${best.matter.title}" / "${best.matter.client}".`,
  };
}
