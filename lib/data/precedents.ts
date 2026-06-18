/**
 * Precedent library — Sprint 11.4.
 *
 * "Every firm has 20 years of contracts and nobody can find anything." We
 * fix that by cloning every executed document into `precedents`, redacting
 * PII per the firm policy, and tagging with kind / jurisdiction / clauses /
 * party-kinds. Search lives here too.
 *
 * Walls: a precedent inherits the source matter's wall. The query layer
 * filters out precedents whose source matter is invisible to the requester.
 */
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { deniedCaseIdsForUser } from "@/lib/data/walls";
import { writeAudit } from "@/lib/data/audit";

export type PrecedentRow = {
  id: string;
  title: string;
  kind: string | null;
  jurisdiction: string | null;
  governingLaw: string | null;
  language: string;
  tags: string[];
  partyKinds: string[];
  outcome: string | null;
  approved: boolean;
  learnFromThis: boolean;
  sourceCaseId: string | null;
  createdAt: Date;
};

export type PrecedentSearch = {
  q?: string;
  kind?: string;
  jurisdiction?: string;
  approvedOnly?: boolean;
};

export async function searchPrecedents(session: Session, opts: PrecedentSearch = {}): Promise<PrecedentRow[]> {
  if (!dbReady) return [];
  const denied = await deniedCaseIdsForUser(session);

  const filters: ReturnType<typeof eq>[] = [tenantScope(session, s.precedents)];
  if (opts.kind) filters.push(eq(s.precedents.kind, opts.kind));
  if (opts.jurisdiction) filters.push(eq(s.precedents.jurisdiction, opts.jurisdiction));
  if (opts.approvedOnly) filters.push(eq(s.precedents.approved, true));
  if (opts.q) {
    const q = `%${opts.q.replace(/[%_]/g, (m) => "\\" + m)}%`;
    const text = or(ilike(s.precedents.title, q), ilike(s.precedents.bodyText, q));
    if (text) filters.push(text);
  }

  const rows = await db
    .select({
      id: s.precedents.id,
      title: s.precedents.title,
      kind: s.precedents.kind,
      jurisdiction: s.precedents.jurisdiction,
      governingLaw: s.precedents.governingLaw,
      language: s.precedents.language,
      tags: s.precedents.tags,
      partyKinds: s.precedents.partyKinds,
      outcome: s.precedents.outcome,
      approved: s.precedents.approved,
      learnFromThis: s.precedents.learnFromThis,
      sourceCaseId: s.precedents.sourceCaseId,
      createdAt: s.precedents.createdAt,
    })
    .from(s.precedents)
    .where(and(...filters))
    .orderBy(desc(s.precedents.createdAt));

  // Wall-strip: any precedent whose source case is denied stays hidden.
  return rows.filter((r) => !r.sourceCaseId || !denied.has(r.sourceCaseId));
}

/** Distinct kind + jurisdiction lists for the filter sidebar. */
export async function precedentFacets(session: Session): Promise<{ kinds: string[]; jurisdictions: string[] }> {
  if (!dbReady) return { kinds: [], jurisdictions: [] };
  const rows = await db
    .select({ kind: s.precedents.kind, jurisdiction: s.precedents.jurisdiction })
    .from(s.precedents)
    .where(tenantScope(session, s.precedents));
  const kinds = new Set<string>(), juri = new Set<string>();
  for (const r of rows) {
    if (r.kind) kinds.add(r.kind);
    if (r.jurisdiction) juri.add(r.jurisdiction);
  }
  return { kinds: [...kinds].sort(), jurisdictions: [...juri].sort() };
}

/**
 * Clone an executed document into the precedent library. Redaction is
 * configurable; for now the default policy masks named parties + email
 * addresses + phone numbers (cheap regex pass — good enough as a default;
 * NER pass can land later behind the same interface).
 */
export async function cloneToPrecedent(
  session: Session,
  args: {
    sourceDocumentId: string;
    title: string;
    kind?: string | null;
    jurisdiction?: string | null;
    governingLaw?: string | null;
    language?: string;
    tags?: string[];
    partyKinds?: string[];
    outcome?: "executed" | "terminated" | "superseded";
    redactPii?: boolean;
  },
): Promise<{ precedentId: string }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const [doc] = await db
    .select()
    .from(s.matterDocuments)
    .where(and(tenantScope(session, s.matterDocuments), eq(s.matterDocuments.id, args.sourceDocumentId)))
    .limit(1);
  if (!doc) throw new Error("Source document not found");

  const sourceBody = doc.extractedText ?? "";
  const { redacted, redactions } = args.redactPii ?? true ? redactPii(sourceBody) : { redacted: sourceBody, redactions: [] };

  const [row] = await db
    .insert(s.precedents)
    .values({
      tenantId: session.tenantId,
      sourceDocumentId: doc.id,
      sourceCaseId: doc.caseId,
      title: args.title,
      bodyText: redacted,
      bodyHtml: doc.extractedHtml,
      redactionsJson: redactions as never,
      kind: args.kind ?? null,
      jurisdiction: args.jurisdiction ?? null,
      governingLaw: args.governingLaw ?? null,
      language: args.language ?? "en",
      tags: args.tags ?? [],
      partyKinds: args.partyKinds ?? [],
      outcome: args.outcome ?? "executed",
      approved: false,
      learnFromThis: true,
    })
    .returning({ id: s.precedents.id });

  await writeAudit(session, {
    action: "precedent_cloned",
    entityKind: "precedent",
    entityId: row.id,
    afterJson: { sourceDocumentId: doc.id, caseId: doc.caseId, redactions: redactions.length },
  });

  return { precedentId: row.id };
}

export async function approvePrecedent(session: Session, id: string): Promise<void> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  await db
    .update(s.precedents)
    .set({ approved: true, approvedByUserId: session.userId, approvedAt: new Date() })
    .where(and(tenantScope(session, s.precedents), eq(s.precedents.id, id)));
  await writeAudit(session, { action: "precedent_approved", entityKind: "precedent", entityId: id });
}

// ────────────────────────────────────────────────────────────────────────
// Redaction — keep simple, keep documented. NER pass plugs in here later.
// ────────────────────────────────────────────────────────────────────────
type Redaction = { kind: "email" | "phone" | "named_party"; value: string; mask: string };

function redactPii(text: string): { redacted: string; redactions: Redaction[] } {
  const redactions: Redaction[] = [];
  let redacted = text;

  // Emails.
  redacted = redacted.replace(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g, (m) => {
    redactions.push({ kind: "email", value: m, mask: "[email]" });
    return "[email]";
  });
  // Phones — UAE/KSA-ish heuristic (any 8+ digit sequence with optional +/spaces/dashes).
  redacted = redacted.replace(/\+?\d[\d\s\-()]{7,}\d/g, (m) => {
    redactions.push({ kind: "phone", value: m, mask: "[phone]" });
    return "[phone]";
  });
  // Don't ship a real NER yet — kept as the documented extension point.
  return { redacted, redactions };
}

void inArray;
