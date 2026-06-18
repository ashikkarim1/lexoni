/**
 * AI outreach drafter — Sprint 21.
 *
 * Composes a prospect-specific outreach email grounded in:
 *   1. The firm's voice (exemplars marked via the AI Partner Brain).
 *   2. A recent regulator event the prospect is affected by (when present).
 *   3. The firm's depth in the matching practice area — count of historicals,
 *      named client refs we can mention by analogue ("a similar UAE fintech
 *      we advised on…").
 *
 * Returns subject + plain text + html. Deterministic fallback when there's
 * no Anthropic key. Never invents matter names — only references actual
 * historicals + the recent regulator event.
 */
import { loadFirmVoice } from "@/lib/ai/firm-voice";
import { depthRadar } from "@/lib/data/growth";
import type { Session } from "@/lib/auth/session";

export type OutreachDraftInput = {
  prospect: {
    legalName: string;
    industry?: string | null;
    region: string;
    contactName?: string | null;
    contactRole?: string | null;
  };
  /** Hook — a recent regulator event the prospect is affected by, OR null
   *  if this is a cold-warm lookalike outreach. */
  hook?: {
    regulator: string;
    title: string;
    publishedAt: Date;
    deadlineDays?: number;
  } | null;
  /** What kind of work we'd be pitching — drives the depth-grounding. */
  targetKind: string;
};

export type OutreachDraft = {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  grounding: {
    voiceExemplarsUsed: number;
    historicalsCited: number;
    hook: string | null;
    modelLabel: "claude" | "deterministic";
  };
};

export async function draftOutreachLetter(session: Session, input: OutreachDraftInput): Promise<OutreachDraft> {
  const [voice, depth] = await Promise.all([
    loadFirmVoice(session, { limit: 2 }),
    depthRadar(session),
  ]);
  const matched = depth.find((d) => d.kind === input.targetKind) ?? null;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await draftWithAnthropic(input, voice.suffix, matched);
    } catch {
      // fall through to deterministic
    }
  }
  return deterministicDraft(input, matched, voice.exemplars.length);
}

async function draftWithAnthropic(
  input: OutreachDraftInput,
  voiceSuffix: string,
  matched: { kind: string; matters: number; onTimePct: number } | null,
): Promise<OutreachDraft> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system = `You draft a short business-development email to a prospect for a GCC law firm.

Rules:
- 90 to 130 words. One opener sentence, one value sentence, one credibility sentence, one call-to-action.
- Reference the regulator hook if present.
- Cite the firm's depth using ONLY the numbers provided ("we've closed X matters of this kind"). NEVER invent client names.
- Tone is partner-grade, not salesy. No emojis. No exclamation marks. No "I hope this finds you well."
- Output JSON: {"subject": "...", "bodyText": "..."} only — no commentary.

${voiceSuffix}`;

  const hook = input.hook ? `Recent regulator event: ${input.hook.regulator} — "${input.hook.title}" (published ${input.hook.publishedAt.toISOString().slice(0, 10)})${input.hook.deadlineDays ? `, action within ${input.hook.deadlineDays} days` : ""}.` : "No specific recent hook — outreach is based on firm depth and prospect fit.";
  const depthLine = matched ? `Firm depth in ${matched.kind}: ${matched.matters} historical matters; ${matched.onTimePct}% on-time on closed.` : `No firm historicals in the target practice area — keep credibility light.`;
  const prospectLine = `Prospect: ${input.prospect.legalName} (${input.prospect.industry ?? "industry unknown"}, ${input.prospect.region}). Contact: ${input.prospect.contactName ?? "—"}${input.prospect.contactRole ? `, ${input.prospect.contactRole}` : ""}.`;

  const res = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 800,
    system,
    messages: [{ role: "user", content: `${prospectLine}\n${hook}\n${depthLine}` }],
  });
  const block = res.content.find((b) => b.type === "text");
  const raw = block && "text" in block ? block.text : "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("draftWithAnthropic: no JSON in response");
  const parsed = JSON.parse(json) as { subject: string; bodyText: string };
  const bodyHtml = `<p>${parsed.bodyText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
  return {
    subject: parsed.subject,
    bodyText: parsed.bodyText,
    bodyHtml,
    grounding: {
      voiceExemplarsUsed: voiceSuffix.includes("Firm-voice exemplars") ? 2 : 0,
      historicalsCited: matched?.matters ?? 0,
      hook: input.hook?.title ?? null,
      modelLabel: "claude",
    },
  };
}

function deterministicDraft(
  input: OutreachDraftInput,
  matched: { kind: string; matters: number; onTimePct: number } | null,
  exemplarsUsed: number,
): OutreachDraft {
  const name = input.prospect.contactName ?? input.prospect.legalName;
  const role = input.prospect.contactRole ? `, ${input.prospect.contactRole}` : "";
  const opener = input.hook
    ? `${input.hook.regulator} published "${input.hook.title}" on ${input.hook.publishedAt.toISOString().slice(0, 10)} — a measure that we expect to affect ${input.prospect.legalName} in ${input.prospect.region}.${input.hook.deadlineDays ? ` The deadline window is ${input.hook.deadlineDays} days.` : ""}`
    : `We've been following the work ${input.prospect.legalName} is doing in ${input.prospect.region} and wanted to make a short introduction.`;
  const credibility = matched && matched.matters >= 3
    ? `Our team has closed ${matched.matters} matters of this kind, with ${matched.onTimePct}% on-time delivery.`
    : `We can connect you with a partner who has worked on similar matters in the region.`;
  const value = input.hook
    ? `We've prepared a one-page note on the practical steps to take in the next 30 days — happy to share it.`
    : `If useful, we'd be glad to walk you through the most common pitfalls and the cleanest structure for ${input.targetKind.replace(/_/g, " ")} matters in your jurisdiction.`;
  const cta = `Would 15 minutes next week suit?`;
  const subject = input.hook ? `${input.hook.regulator} — quick note for ${input.prospect.legalName}` : `Quick note from a GCC law firm — ${input.prospect.legalName}`;
  const bodyText = `Dear ${name}${role},\n\n${opener}\n\n${value}\n\n${credibility}\n\n${cta}\n\nKind regards,\nThe partners`;
  const bodyHtml = `<p>${bodyText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
  return {
    subject,
    bodyText,
    bodyHtml,
    grounding: {
      voiceExemplarsUsed: exemplarsUsed,
      historicalsCited: matched?.matters ?? 0,
      hook: input.hook?.title ?? null,
      modelLabel: "deterministic",
    },
  };
}
