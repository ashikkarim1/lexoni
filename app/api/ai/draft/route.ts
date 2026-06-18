/**
 * POST /api/ai/draft - the smart-prompt drafting endpoint behind the matter
 * workspace (text or voice-transcribed input, or selection-aware mode).
 *
 * GUARDRAILS (do not weaken):
 *  - Output is ALWAYS suggestion-state. The API never finalises, sends, or
 *    signs. A human with `final_review` capability accepts it in the UI.
 *  - WALL-AWARE: context is assembled server-side via `assembleDraftContext()`
 *    and pinned to the requesting user's wall memberships. Selection text is
 *    accepted, but the document it came from is wall-checked too (Sprint #4).
 *  - Region/language aware: pinned to the matter's jurisdiction + language.
 *  - Every call persists a `draft_requests` row with the citations the draft
 *    was grounded on.
 *  - Without ANTHROPIC_API_KEY set, returns a deterministic stub.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth/session-server";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { assembleDraftContext } from "@/lib/ai/draft";
import { writeAudit } from "@/lib/data/audit";
import { getDocument } from "@/lib/data/documents";
import { systemFor, type DraftMode } from "@/lib/ai/prompts";

export const runtime = "nodejs";

type Body = {
  matterId: string;
  prompt: string;
  language?: "en" | "ar";
  slotTitle?: string;
  slotId?: string;
  inputMode?: "text" | "voice";
  voiceStorageUrl?: string;
  /** Sprint #4 - selection-aware AI actions. */
  mode?: DraftMode;
  selection?: string;
  documentId?: string;
};

const MAX_SELECTION_CHARS = 8000;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.matterId) {
    return NextResponse.json({ error: "matterId is required" }, { status: 400 });
  }
  if (!body.prompt?.trim() && !body.selection?.trim()) {
    return NextResponse.json({ error: "prompt or selection is required" }, { status: 400 });
  }

  const session = await getSession();
  const ctx = await assembleDraftContext(session, { matterId: body.matterId, language: body.language });
  if (!ctx.allowed) {
    return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "wall_denied" ? 403 : 404 });
  }

  // If a documentId is supplied, verify it belongs to this matter and the
  // caller can see it (wall + tenant). Drops the selection if not.
  let selection = body.selection?.slice(0, MAX_SELECTION_CHARS) ?? "";
  let documentLabel = "";
  if (body.documentId) {
    const doc = await getDocument(session, body.documentId);
    if (!doc || doc.caseId !== body.matterId) {
      return NextResponse.json({ error: "document_not_visible" }, { status: 403 });
    }
    documentLabel = doc.filename;
  }

  const slotTitle = body.slotTitle ?? "document";
  const language = ctx.language as "en" | "ar";
  const key = process.env.ANTHROPIC_API_KEY;
  const mode: DraftMode = body.mode ?? "freeform";

  let draftMd: string;
  let stub: boolean;

  if (!key) {
    stub = true;
    draftMd = stubFor(mode, language, slotTitle, ctx.jurisdiction, body.prompt, selection);
  } else {
    stub = false;
    const system = systemFor({ mode, jurisdiction: ctx.jurisdiction, language, slotTitle });

    const contextBlock = ctx.entries.length
      ? `\n\nFirm clause context (wall-permitted):\n${ctx.entries.map((c) => `### ${c.title}\n${c.body}`).join("\n\n")}`
      : "";
    const selectionBlock = selection
      ? `\n\nSelected text${documentLabel ? ` (from ${documentLabel})` : ""}:\n"""\n${selection}\n"""`
      : "";
    const briefBlock = body.prompt?.trim()
      ? `\n\nLawyer brief: ${body.prompt.trim()}`
      : "";

    try {
      const client = new Anthropic({ apiKey: key });
      const msg = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: `${briefBlock}${selectionBlock}${contextBlock}`.trim() }],
      });
      draftMd = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    } catch (err) {
      return NextResponse.json(
        { error: "draft_failed", detail: err instanceof Error ? err.message : "unknown" },
        { status: 502 },
      );
    }
  }

  const citedSources = ctx.entries.map((c) => ({ id: c.id, title: c.title }));

  let draftRequestId: string | undefined;
  if (dbReady) {
    const [row] = await db.insert(s.draftRequests).values({
      tenantId: session.tenantId,
      caseId: ctx.caseId,
      matterSlotId: body.slotId,
      inputMode: body.inputMode ?? "text",
      promptText: composeStored(mode, body.prompt ?? "", selection),
      voiceStorageUrl: body.voiceStorageUrl,
      language,
      citedSourcesJson: citedSources,
      outputMd: draftMd,
      createdByUserId: session.userId,
    }).returning({ id: s.draftRequests.id });
    draftRequestId = row.id;

    await writeAudit(session, {
      action: "ai_draft_suggested",
      entityKind: "draft_request",
      entityId: row.id,
      afterJson: { slotId: body.slotId, slotTitle, citedSources, stub, mode, documentId: body.documentId },
    });
  }

  return NextResponse.json({
    status: "suggestion",
    draftRequestId,
    mode,
    draftMd,
    citedSources,
    stub,
  });
}

function composeStored(mode: DraftMode, prompt: string, selection: string): string {
  const head = `[mode:${mode}]`;
  const sel = selection ? `\n[selection]\n${selection}` : "";
  const p = prompt ? `\n[brief]\n${prompt}` : "";
  return `${head}${p}${sel}`.trim();
}

function stubFor(mode: DraftMode, lang: "en" | "ar", slotTitle: string, jurisdiction: string, prompt: string | undefined, selection: string): string {
  const ar = lang === "ar";
  if (mode === "explain") {
    return ar
      ? `> _شرح مقترح (${jurisdiction}) - ${slotTitle}._\n\nالنص المحدد: "${selection.slice(0, 240)}…"\n\nهذا البند يحدد ${prompt?.trim() || "نقطة جوهرية في العقد"}. (مخرج تجريبي - عيّن ANTHROPIC_API_KEY لشرح حقيقي.)`
      : `> _Explain suggestion (${jurisdiction}) - ${slotTitle}._\n\nSelected text: "${selection.slice(0, 240)}…"\n\nThis clause establishes ${prompt?.trim() || "a material point in the contract"}. (Stub output - set ANTHROPIC_API_KEY for a real explanation.)`;
  }
  if (mode === "redline") {
    return ar
      ? `> _اقتراح تعديل (${jurisdiction}) - ${slotTitle}._\n\n${prompt?.trim() ?? "تعديل مقترح للبند."}\n\n---\n(مخرج تجريبي - عيّن ANTHROPIC_API_KEY لتعديل حقيقي.)`
      : `> _Redline (${jurisdiction}) - ${slotTitle}._\n\n${prompt?.trim() ?? "Proposed replacement clause."}\n\n---\n(Stub output - set ANTHROPIC_API_KEY for a real redline.)`;
  }
  if (mode === "insert") {
    return ar
      ? `> _بند مقترح للإدراج (${jurisdiction}) - ${slotTitle}._\n\n${prompt?.trim() ?? "بند جديد مقترح."}\n\n(مخرج تجريبي.)`
      : `> _Insert (${jurisdiction}) - ${slotTitle}._\n\n${prompt?.trim() ?? "New proposed clause."}\n\n(Stub output.)`;
  }
  return ar
    ? `> _مسودة مقترحة (${jurisdiction}, ${lang.toUpperCase()}) - ${slotTitle} - بانتظار مراجعة المحامي._\n\n${prompt}\n\n_(مخرج تجريبي.)_`
    : `> _Draft suggestion (${jurisdiction}, ${lang.toUpperCase()}) - ${slotTitle} - awaiting lawyer review._\n\n${prompt}\n\n_(Stub output.)_`;
}
