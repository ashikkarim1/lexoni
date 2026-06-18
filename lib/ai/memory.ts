/**
 * Institutional Memory AI — the "have we ever done this before?" engine.
 *
 * Given a question:
 *   1. Retrieve wall-permitted chunks via `lib/knowledge/index.retrieve`.
 *   2. Compose them into a partner-grade answer with Anthropic (citations
 *      back to the source documents / matters / precedents / emails).
 *   3. Return both the answer and the underlying chunk citations so the UI
 *      can render the answer + clickable sources.
 *
 * Falls back to a deterministic summary when ANTHROPIC_API_KEY is not set,
 * so the demo works without a key.
 */
import { retrieve, type RetrieveResult } from "@/lib/knowledge";
import type { Session } from "@/lib/auth/session";

export type MemoryCitation = {
  id: string;
  sourceKind: RetrieveResult["sourceKind"];
  sourceId: string;
  sourceCaseId: string | null;
  sourceTitle: string;
  ordinal: number;
  snippet: string;
  score: number;
};

export type MemoryAnswer = {
  question: string;
  answer: string;
  citations: MemoryCitation[];
  hadCoverage: boolean;
  modelLabel: string;
};

export async function askMemory(
  session: Session,
  question: string,
  opts: { limit?: number } = {},
): Promise<MemoryAnswer> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { question, answer: "", citations: [], hadCoverage: false, modelLabel: "none" };
  }

  const chunks = await retrieve(session, trimmed, { limit: opts.limit ?? 8 });
  const citations: MemoryCitation[] = chunks.map((c) => ({
    id: c.id,
    sourceKind: c.sourceKind,
    sourceId: c.sourceId,
    sourceCaseId: c.sourceCaseId,
    sourceTitle: c.sourceTitle,
    ordinal: c.ordinal,
    snippet: c.text.length > 320 ? c.text.slice(0, 320) + "…" : c.text,
    score: Math.round(c.score * 100) / 100,
  }));

  if (chunks.length === 0) {
    return {
      question: trimmed,
      answer: "No relevant precedent, matter or memo was found in the firm's index for this question. Try a broader phrasing, or check that the source has been indexed (run /api/memory/reindex).",
      citations: [],
      hadCoverage: false,
      modelLabel: "no-coverage",
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const answer = await answerWithAnthropic(trimmed, chunks);
      return { question: trimmed, answer, citations, hadCoverage: true, modelLabel: "claude" };
    } catch (e) {
      // fall through to deterministic
      return {
        question: trimmed,
        answer: deterministicAnswer(trimmed, chunks) + `\n\n_AI call failed: ${e instanceof Error ? e.message : "unknown"}; showing retrieval summary._`,
        citations, hadCoverage: true, modelLabel: "deterministic-fallback",
      };
    }
  }

  return {
    question: trimmed,
    answer: deterministicAnswer(trimmed, chunks),
    citations,
    hadCoverage: true,
    modelLabel: "deterministic",
  };
}

async function answerWithAnthropic(question: string, chunks: RetrieveResult[]): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sys = `You are a senior partner at a GCC law firm answering a colleague's "have we ever done this before?" question.
Use ONLY the firm's source chunks provided below; do not invent matters, parties, or precedents.
Cite each claim by the chunk number in square brackets, e.g. [3]. If multiple chunks support a point, cite all (e.g. [1][4]).
Keep the answer tight — 4-8 sentences. Lead with the bottom line. Surface where the firm has done this before and any non-obvious risk that came up.
If the chunks don't actually answer the question, say so.`;
  const sourceBlock = chunks
    .map((c, i) => `[${i + 1}] ${c.sourceKind} — ${c.sourceTitle} (chunk ${c.ordinal})\n${c.text}`)
    .join("\n\n---\n\n");
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 800,
    system: sys,
    messages: [{
      role: "user",
      content: `Question: ${question}\n\nSource chunks (cite by [n]):\n\n${sourceBlock}`,
    }],
  });
  const block = msg.content.find((b) => b.type === "text");
  return (block && "text" in block ? block.text : "").trim();
}

/** Deterministic fallback — surfaces the top sources with a short framing. */
function deterministicAnswer(question: string, chunks: RetrieveResult[]): string {
  const top = chunks.slice(0, 3);
  const head = `Top matches in the firm's index for "${question}":`;
  const bullets = top.map((c, i) => `  ${i + 1}. ${c.sourceTitle} — ${c.sourceKind} (relevance ${Math.round(c.score * 100) / 100})`).join("\n");
  const sniff = top[0]?.text ? `\n\nMost-relevant excerpt:\n"${top[0].text.slice(0, 240)}${top[0].text.length > 240 ? "…" : ""}"` : "";
  return `${head}\n${bullets}${sniff}\n\n(AI answer composer is offline — wire ANTHROPIC_API_KEY for a partner-grade narrative.)`;
}
