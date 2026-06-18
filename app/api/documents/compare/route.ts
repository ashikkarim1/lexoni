/**
 * POST /api/documents/compare
 * Body: { aId: string, bId: string }
 *
 * Both documents must be in the same matter and visible to the caller
 * (tenant + wall scoped via getDocument). Returns:
 *   • diff:    word-level segments (added / removed / equal) + counts
 *   • summary: AI one-paragraph "what materially moved" - when
 *              ANTHROPIC_API_KEY is set; deterministic stub otherwise
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth/session-server";
import { getDocument } from "@/lib/data/documents";
import { diffText } from "@/lib/documents/diff";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { aId?: string; bId?: string } | null;
  if (!body?.aId || !body?.bId) {
    return NextResponse.json({ error: "aId and bId are required" }, { status: 400 });
  }

  const session = await getSession();
  const a = await getDocument(session, body.aId);
  const b = await getDocument(session, body.bId);
  if (!a || !b) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (a.caseId !== b.caseId) {
    return NextResponse.json({ error: "different_matter" }, { status: 400 });
  }

  const aText = a.extractedText ?? "";
  const bText = b.extractedText ?? "";
  const diff = diffText(aText, bText);

  // AI summary - short prose for partner consumption.
  let summary: string;
  let stub: boolean;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    stub = true;
    const movedPrice  = diff.added > 0 || diff.removed > 0 ? "yes" : "no";
    summary = `Stub diff summary - added ${diff.added} chars, removed ${diff.removed} chars. Set ANTHROPIC_API_KEY for a real partner-grade summary that flags whether price, obligations, governing law or other material terms moved. (Material movement: ${movedPrice}.)`;
  } else {
    stub = false;
    try {
      const client = new Anthropic({ apiKey: key });
      const msg = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
        max_tokens: 800,
        system: [
          "You are a senior corporate lawyer comparing two versions of the same document.",
          "Write a tight, partner-grade summary (under 200 words) of what materially moved.",
          "Lead with whether anything material moved (price, payment terms, parties, dates, jurisdiction, governing law, conditions precedent, IP, termination, indemnity, liability cap).",
          "Then 3-6 bullet points on the most material moves. Quote the changed phrasing in single quotes.",
          "If nothing material moved, say so plainly.",
        ].join(" "),
        messages: [{
          role: "user",
          content: `Version A (${a.version} · ${a.filename}):\n"""\n${aText.slice(0, 30000)}\n"""\n\nVersion B (${b.version} · ${b.filename}):\n"""\n${bText.slice(0, 30000)}\n"""`,
        }],
      });
      summary = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    } catch (err) {
      stub = true;
      summary = `(Diff summary failed: ${err instanceof Error ? err.message : "unknown"}. Showing the raw diff below.)`;
    }
  }

  return NextResponse.json({
    a: { id: a.id, filename: a.filename, version: a.version },
    b: { id: b.id, filename: b.filename, version: b.version },
    diff,
    summary,
    stub,
  });
}
