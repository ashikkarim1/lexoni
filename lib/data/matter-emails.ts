/**
 * Email capture — Sprint 11.2.
 *
 * The OAuth pollers (Outlook + Gmail) live behind the `IngestEmail` shape so
 * the poller scaffold and the manual paste-an-email API both call this. Real
 * provider integration plugs in when API credentials land; until then, the
 * surface is fully usable from manual ingestion + seeded data.
 *
 * Classification is wall-aware: the candidate matter set is filtered before
 * the AI sees it, so a non-member's email can never auto-file into a walled
 * matter (and thus reveal its existence).
 */
import { and, desc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { listMatters } from "@/lib/data/matters";
import { writeAudit } from "@/lib/data/audit";

export const AUTO_FILE_CUTOFF = 80;

export type IngestEmail = {
  provider: "outlook" | "gmail" | "manual";
  providerMessageId: string;
  direction: "inbound" | "outbound";
  subject: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  inReplyTo?: string | null;
  threadId?: string | null;
  receivedAt: Date;
  bodyText?: string | null;
  bodyHtml?: string | null;
  attachmentsJson?: unknown;
  mailboxUserId?: string | null;
};

export type EmailRow = {
  id: string;
  caseId: string | null;
  caseTitle: string | null;
  subject: string;
  fromAddress: string;
  direction: "inbound" | "outbound";
  receivedAt: Date;
  status: "captured" | "classified" | "filed" | "rejected";
  classificationConfidence: number | null;
  classificationReasoning: string | null;
};

/** Ingest a single email. Idempotent on (tenantId, provider, providerMessageId). */
export async function ingestEmail(session: Session, email: IngestEmail): Promise<{ id: string; status: EmailRow["status"]; caseId: string | null }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");

  const matters = await listMatters(session);
  const classification = await classifyEmail({
    subject: email.subject,
    body: email.bodyText ?? "",
    from: email.fromAddress,
  }, matters);

  const willAutoFile = classification.confidence >= AUTO_FILE_CUTOFF && !!classification.caseId;

  const [existing] = await db
    .select({ id: s.matterEmails.id })
    .from(s.matterEmails)
    .where(and(
      tenantScope(session, s.matterEmails),
      eq(s.matterEmails.provider, email.provider),
      eq(s.matterEmails.providerMessageId, email.providerMessageId),
    ))
    .limit(1);

  if (existing) return { id: existing.id, status: "captured", caseId: null };

  const id = randomUUID();
  await db.insert(s.matterEmails).values({
    id,
    tenantId: session.tenantId,
    caseId: willAutoFile ? classification.caseId : null,
    mailboxUserId: email.mailboxUserId ?? session.userId,
    providerMessageId: email.providerMessageId,
    provider: email.provider,
    direction: email.direction,
    subject: email.subject,
    fromAddress: email.fromAddress,
    toAddresses: email.toAddresses,
    ccAddresses: email.ccAddresses ?? [],
    inReplyTo: email.inReplyTo ?? null,
    threadId: email.threadId ?? null,
    receivedAt: email.receivedAt,
    bodyText: email.bodyText ?? null,
    bodyHtml: email.bodyHtml ?? null,
    attachmentsJson: (email.attachmentsJson ?? null) as never,
    classificationJson: classification as never,
    status: willAutoFile ? "filed" : "classified",
  });

  await writeAudit(session, {
    action: willAutoFile ? "matter_email_filed" : "matter_email_classified",
    entityKind: "matter_email",
    entityId: id,
    afterJson: { caseId: willAutoFile ? classification.caseId : null, confidence: classification.confidence },
  });

  return { id, status: willAutoFile ? "filed" : "classified", caseId: willAutoFile ? classification.caseId : null };
}

export async function listEmailsForMatter(session: Session, caseId: string, limit = 50): Promise<EmailRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      id: s.matterEmails.id,
      caseId: s.matterEmails.caseId,
      subject: s.matterEmails.subject,
      fromAddress: s.matterEmails.fromAddress,
      direction: s.matterEmails.direction,
      receivedAt: s.matterEmails.receivedAt,
      status: s.matterEmails.status,
      classificationJson: s.matterEmails.classificationJson,
    })
    .from(s.matterEmails)
    .where(and(tenantScope(session, s.matterEmails), eq(s.matterEmails.caseId, caseId)))
    .orderBy(desc(s.matterEmails.receivedAt))
    .limit(limit);
  return rows.map((r) => {
    const c = r.classificationJson as null | { confidence?: number; reasoning?: string };
    return {
      ...r,
      caseTitle: null,
      direction: r.direction as "inbound" | "outbound",
      status: r.status as EmailRow["status"],
      classificationConfidence: c?.confidence ?? null,
      classificationReasoning: c?.reasoning ?? null,
    };
  });
}

/** Inbox view across captured-but-not-yet-filed emails. */
export async function listEmailInbox(session: Session): Promise<EmailRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      id: s.matterEmails.id,
      caseId: s.matterEmails.caseId,
      subject: s.matterEmails.subject,
      fromAddress: s.matterEmails.fromAddress,
      direction: s.matterEmails.direction,
      receivedAt: s.matterEmails.receivedAt,
      status: s.matterEmails.status,
      classificationJson: s.matterEmails.classificationJson,
    })
    .from(s.matterEmails)
    .where(and(tenantScope(session, s.matterEmails), isNull(s.matterEmails.caseId)))
    .orderBy(desc(s.matterEmails.receivedAt))
    .limit(100);
  return rows.map((r) => {
    const c = r.classificationJson as null | { confidence?: number; reasoning?: string };
    return {
      ...r,
      caseTitle: null,
      direction: r.direction as "inbound" | "outbound",
      status: r.status as EmailRow["status"],
      classificationConfidence: c?.confidence ?? null,
      classificationReasoning: c?.reasoning ?? null,
    };
  });
}

// ────────────────────────────────────────────────────────────────────────
// Classifier — Anthropic-or-deterministic, same shape as document inbox.
// ────────────────────────────────────────────────────────────────────────
type Candidate = { id: string; title: string; client: string; matterNumber: string };
type Classification = { caseId: string | null; confidence: number; reasoning: string; intent?: string };

async function classifyEmail(
  email: { subject: string; body: string; from: string },
  matters: Candidate[],
): Promise<Classification> {
  if (matters.length === 0) {
    return { caseId: null, confidence: 0, reasoning: "No matters to classify against." };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await classifyEmailWithAnthropic(email, matters);
    } catch { /* fall through */ }
  }
  return classifyEmailDeterministic(email, matters);
}

async function classifyEmailWithAnthropic(
  email: { subject: string; body: string; from: string },
  matters: Candidate[],
): Promise<Classification> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sys = `You are a legal-ops email classifier. Pick the best matching matter or none. Return JSON {caseId, confidence (0-100), reasoning, intent} only. intent ∈ {update, request, attachment, fyi, none}.`;
  const matterDigest = matters.map((m) => `- id=${m.id} | ${m.matterNumber} | ${m.title} | client=${m.client}`).join("\n");
  const prompt = `From: ${email.from}\nSubject: ${email.subject}\n\n${email.body.slice(0, 4000)}\n\nMatters:\n${matterDigest}`;
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 300,
    system: sys,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content.find((b) => b.type === "text");
  const raw = block && "text" in block ? block.text : "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("No JSON in classifier response");
  const parsed = JSON.parse(json) as Classification;
  const validCase = parsed.caseId ? matters.find((m) => m.id === parsed.caseId) : null;
  return {
    caseId: validCase?.id ?? null,
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 0))),
    reasoning: parsed.reasoning ?? "",
    intent: parsed.intent,
  };
}

function classifyEmailDeterministic(
  email: { subject: string; body: string; from: string },
  matters: Candidate[],
): Classification {
  const haystack = `${email.subject}\n${email.body.slice(0, 8 * 1024)}\n${email.from}`.toLowerCase();
  let best: { matter: Candidate; score: number } | null = null;
  for (const m of matters) {
    const tokens = `${m.title} ${m.client} ${m.matterNumber}`.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    let score = 0;
    for (const tok of tokens) if (haystack.includes(tok)) score += 1;
    if (!best || score > best.score) best = { matter: m, score };
  }
  if (!best || best.score === 0) return { caseId: null, confidence: 0, reasoning: "No token overlap with any matter." };
  return {
    caseId: best.matter.id,
    confidence: Math.round(Math.min(1, best.score / 3) * 70),
    reasoning: `Deterministic token overlap with "${best.matter.title}" / "${best.matter.client}".`,
  };
}
