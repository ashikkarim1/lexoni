/**
 * Sprint 17 — AI Partner Brain.
 *
 * Per-firm voice layer for every AI call. The system prompt for Draft /
 * Redline / Insert / Memory / Copilot is composed as:
 *
 *   [base task prompt]
 *   + [firm-voice suffix loaded by this module]
 *
 * The suffix is built from:
 *   - the firm's brand defaults (firm_branding.brandTone, brandPhrases)
 *   - the firm's exemplar knowledge items (partner-marked house style)
 *   - quick guardrails: cite firm precedent, never invent matters, etc.
 *
 * Falls back to a neutral suffix when no exemplars exist, so the call
 * still works on a fresh tenant.
 */
import { and, desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type FirmVoiceContext = {
  exemplars: Array<{ id: string; title: string; snippet: string }>;
  suffix: string;
};

const BASE_SUFFIX = [
  "",
  "House-style guardrails:",
  " · Write in the firm's voice — measured, clause-precise, partner-grade.",
  " · Cite firm precedent when possible; never invent a matter, party or precedent.",
  " · Default to the firm's preferred wording for indemnities, caps and governing law unless the matter clearly requires otherwise.",
  " · Where Arabic is needed, use formal legal Arabic, not colloquial.",
].join("\n");

export async function loadFirmVoice(session: Session, opts: { limit?: number } = {}): Promise<FirmVoiceContext> {
  if (!dbReady) return { exemplars: [], suffix: BASE_SUFFIX };
  const rows = await db
    .select({
      id: s.knowledgeItems.id,
      title: s.knowledgeItems.title,
      bodyMd: s.knowledgeItems.bodyMd,
    })
    .from(s.knowledgeItems)
    .where(and(
      tenantScope(session, s.knowledgeItems),
      eq(s.knowledgeItems.isExemplar, true),
      eq(s.knowledgeItems.approved, true),
    ))
    .orderBy(desc(s.knowledgeItems.createdAt))
    .limit(opts.limit ?? 4);

  if (rows.length === 0) return { exemplars: [], suffix: BASE_SUFFIX };

  const exemplars = rows.map((r) => ({
    id: r.id,
    title: r.title,
    snippet: (r.bodyMd ?? "").slice(0, 1200),
  }));
  const exBlock = exemplars
    .map((e, i) => `Exemplar [${i + 1}] "${e.title}":\n${e.snippet}`)
    .join("\n\n");

  const suffix = `${BASE_SUFFIX}\n\nFirm-voice exemplars (write in this register; match clause density + tone):\n\n${exBlock}`;
  return { exemplars, suffix };
}

/** Convenience: compose a base task-prompt with the firm-voice suffix. */
export function composeWithFirmVoice(basePrompt: string, ctx: FirmVoiceContext): string {
  return `${basePrompt}\n${ctx.suffix}`;
}
