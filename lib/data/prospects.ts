/**
 * Prospects + lookalike scoring.
 *
 *   listProspects(session)
 *   addProspect(session, fields)
 *   updateProspectStatus(session, id, status)
 *
 *   computeLookalike(session, candidate)
 *     — scores a candidate against the firm's top historicals on
 *       (industry × region × deal kind), returns 0-100.
 *
 *   spawnFromRegulatoryImpact(session, assessmentId)
 *     — promotes "lookalike companies who AREN'T yet our clients but
 *       match the affected profile" into the prospect queue.
 */
import { and, desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";

export type ProspectRow = {
  id: string;
  legalName: string;
  industry: string | null;
  region: string;
  jurisdiction: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactRole: string | null;
  status: typeof s.bdProspectStatusEnum.enumValues[number];
  source: typeof s.bdProspectSourceEnum.enumValues[number];
  lookalikeScore: number;
  predictedFeeCents: number | null;
  ownerName: string | null;
  createdAt: Date;
};

export async function listProspects(session: Session, opts: { status?: ProspectRow["status"] } = {}): Promise<ProspectRow[]> {
  if (!dbReady) return [];
  const filters = [tenantScope(session, s.bdProspects)];
  if (opts.status) filters.push(eq(s.bdProspects.status, opts.status));
  const rows = await db
    .select({
      id: s.bdProspects.id,
      legalName: s.bdProspects.legalName,
      industry: s.bdProspects.industry,
      region: s.bdProspects.region,
      jurisdiction: s.bdProspects.jurisdiction,
      contactName: s.bdProspects.contactName,
      contactEmail: s.bdProspects.contactEmail,
      contactRole: s.bdProspects.contactRole,
      status: s.bdProspects.status,
      source: s.bdProspects.source,
      lookalikeScore: s.bdProspects.lookalikeScore,
      predictedFeeCents: s.bdProspects.predictedFeeCents,
      ownerName: s.users.fullName,
      createdAt: s.bdProspects.createdAt,
    })
    .from(s.bdProspects)
    .leftJoin(s.users, eq(s.users.id, s.bdProspects.ownerUserId))
    .where(filters.length === 1 ? filters[0] : and(...filters))
    .orderBy(desc(s.bdProspects.lookalikeScore), desc(s.bdProspects.createdAt));
  return rows as ProspectRow[];
}

export type ProspectInput = {
  legalName: string;
  industry?: string | null;
  region: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL";
  jurisdiction?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactRole?: string | null;
  source?: ProspectRow["source"];
  sourceJson?: unknown;
  lookalikeScore?: number;
  predictedFeeCents?: number | null;
  ownerUserId?: string | null;
};

export async function addProspect(session: Session, input: ProspectInput): Promise<{ id: string }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const [row] = await db.insert(s.bdProspects).values({
    tenantId: session.tenantId,
    legalName: input.legalName,
    industry: input.industry ?? null,
    region: input.region,
    jurisdiction: input.jurisdiction ?? null,
    contactName: input.contactName ?? null,
    contactEmail: input.contactEmail ?? null,
    contactRole: input.contactRole ?? null,
    source: input.source ?? "manual",
    sourceJson: (input.sourceJson ?? null) as never,
    lookalikeScore: input.lookalikeScore ?? 0,
    predictedFeeCents: input.predictedFeeCents ?? null,
    ownerUserId: input.ownerUserId ?? session.userId,
  }).returning({ id: s.bdProspects.id });
  await writeAudit(session, {
    action: "bd_prospect_added",
    entityKind: "bd_prospect",
    entityId: row.id,
    afterJson: { legalName: input.legalName, source: input.source ?? "manual", lookalikeScore: input.lookalikeScore ?? 0 },
  });
  return row;
}

export async function updateProspectStatus(session: Session, id: string, status: ProspectRow["status"]): Promise<void> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  await db
    .update(s.bdProspects)
    .set({ status, updatedAt: new Date() })
    .where(and(tenantScope(session, s.bdProspects), eq(s.bdProspects.id, id)));
  await writeAudit(session, { action: "bd_prospect_status_changed", entityKind: "bd_prospect", entityId: id, afterJson: { status } });
}

// ──────────────────────────────────────────────────────────────────────
// Lookalike scoring
//
//   A prospect scores against the firm's depthRadar() rows. The matching
//   logic is intentionally simple at first ship so it's explainable:
//
//     industry match     +30
//     region match       +20
//     jurisdiction match +10
//     same kind in the firm's top-3 deepest practices (>= 5 historicals) +25
//     same kind growing (growthPct > 20%) +15
//
//   The model plugs in behind this function — when an embedder lands we
//   swap for `cosine(prospect_embedding, top_client_centroid)` * 100.
// ──────────────────────────────────────────────────────────────────────
export type LookalikeInput = {
  industry?: string | null;
  region: string;
  jurisdiction?: string | null;
  /** Hint about which kind of work this prospect is likely to need —
   *  comes from the regulatory_impact source, or from manual entry. */
  targetKind?: string | null;
};

export async function computeLookalike(session: Session, candidate: LookalikeInput): Promise<{ score: number; reasons: string[] }> {
  if (!dbReady) return { score: 0, reasons: ["DB unavailable"] };

  // Look at our top clients to identify the firm's "ideal customer profile".
  const cases = await db
    .select({
      region: s.cases.region,
      clientTenantId: s.cases.clientTenantId,
      kind: s.processes.kind,
    })
    .from(s.cases)
    .leftJoin(s.matterProcesses, eq(s.matterProcesses.caseId, s.cases.id))
    .leftJoin(s.processes, eq(s.processes.id, s.matterProcesses.processId))
    .where(tenantScope(session, s.cases));

  if (cases.length === 0) return { score: 0, reasons: ["No historicals to compare against yet."] };

  const reasons: string[] = [];
  let score = 0;

  // Region match.
  const regionCount = cases.filter((c) => c.region === candidate.region).length;
  const regionPct = regionCount / cases.length;
  if (regionPct > 0.15) { score += 20; reasons.push(`Region (${candidate.region}) — ${Math.round(regionPct * 100)}% of our matters.`); }

  // Kind depth.
  const kindCounts = new Map<string, number>();
  for (const c of cases) if (c.kind) kindCounts.set(c.kind, (kindCounts.get(c.kind) ?? 0) + 1);
  const sortedKinds = [...kindCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

  if (candidate.targetKind && sortedKinds.indexOf(candidate.targetKind) >= 0 && sortedKinds.indexOf(candidate.targetKind) < 3) {
    score += 25;
    reasons.push(`Top-3 deepest practice (${candidate.targetKind}) — ${kindCounts.get(candidate.targetKind) ?? 0} historicals.`);
  }

  // Industry — for now we only score this when we can identify the prospect's
  // industry overlaps with > 1 client's company.industry (proxy: name token
  // overlap is too weak; we keep this generic until industry is on companies).
  if (candidate.industry) {
    score += 15;
    reasons.push(`Industry signal recorded (${candidate.industry}).`);
  }
  if (candidate.jurisdiction) {
    score += 10;
    reasons.push(`Jurisdiction (${candidate.jurisdiction}) — pinpoints the filing path.`);
  }

  // Recent activity ramp — if the firm has done a lot of this kind in last 6 months.
  // Approximated via the kindCounts share.
  if (candidate.targetKind) {
    const share = (kindCounts.get(candidate.targetKind) ?? 0) / cases.length;
    if (share > 0.1) { score += 15; reasons.push(`Active in this practice — ${Math.round(share * 100)}% of book.`); }
  }

  return { score: Math.min(100, score), reasons };
}

/** Take a regulatory impact assessment and push the affected non-client
 *  companies onto the prospect queue. For now we approximate "non-client"
 *  by adding shell prospect rows for the affected client list — the real
 *  pipeline adds external company DB matches as it lands.  */
export async function spawnFromRegulatoryImpact(session: Session, assessmentId: string): Promise<{ added: number }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const [a] = await db
    .select({
      affectedJson: s.regulatoryImpactAssessments.affectedJson,
      updateId: s.regulatoryImpactAssessments.regulatoryUpdateId,
    })
    .from(s.regulatoryImpactAssessments)
    .where(and(tenantScope(session, s.regulatoryImpactAssessments), eq(s.regulatoryImpactAssessments.id, assessmentId)))
    .limit(1);
  if (!a) throw new Error("assessment not found");
  const affected = (a.affectedJson as { clients?: Array<{ id: string; name: string }> } | null) ?? {};
  const candidates = (affected.clients ?? []).slice(0, 25);
  let added = 0;
  for (const c of candidates) {
    const lookalike = await computeLookalike(session, { region: "UAE", targetKind: "licensing_regulatory" });
    await addProspect(session, {
      legalName: c.name,
      region: "UAE",
      source: "regulatory_impact",
      sourceJson: { regulatoryUpdateId: a.updateId, originatingAssessmentId: assessmentId },
      lookalikeScore: lookalike.score,
      predictedFeeCents: 30_000_00,
    });
    added += 1;
  }
  return { added };
}
