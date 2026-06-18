/**
 * Sprint 20 — Knowledge Graph projector.
 *
 * Write-path hook: when a business object is created or updated, we upsert
 * the matching node + its outgoing edges. Idempotent on (tenant, kind,
 * entityId). Walled matters tag their nodes + edges with `walledCaseId`
 * so the query layer can hide them from non-members.
 *
 * Reads use lib/kg/query.ts.
 */
import { and, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import type { Session } from "@/lib/auth/session";

type NodeKind = typeof s.knowledgeGraphNodeKindEnum.enumValues[number];
type EdgeKind = typeof s.knowledgeGraphEdgeKindEnum.enumValues[number];

async function upsertNode(args: {
  tenantId: string;
  kind: NodeKind;
  entityId: string;
  label: string;
  walledCaseId?: string | null;
  propsJson?: unknown;
}): Promise<string> {
  if (!dbReady) return "";
  const [existing] = await db
    .select({ id: s.knowledgeGraphNodes.id })
    .from(s.knowledgeGraphNodes)
    .where(and(
      eq(s.knowledgeGraphNodes.tenantId, args.tenantId),
      eq(s.knowledgeGraphNodes.kind, args.kind),
      eq(s.knowledgeGraphNodes.entityId, args.entityId),
    ))
    .limit(1);
  if (existing) {
    await db.update(s.knowledgeGraphNodes)
      .set({
        label: args.label,
        walledCaseId: args.walledCaseId ?? null,
        propsJson: (args.propsJson ?? null) as never,
        updatedAt: new Date(),
      })
      .where(eq(s.knowledgeGraphNodes.id, existing.id));
    return existing.id;
  }
  const [row] = await db.insert(s.knowledgeGraphNodes).values({
    tenantId: args.tenantId,
    kind: args.kind,
    entityId: args.entityId,
    label: args.label,
    walledCaseId: args.walledCaseId ?? null,
    propsJson: (args.propsJson ?? null) as never,
  }).returning({ id: s.knowledgeGraphNodes.id });
  return row.id;
}

async function upsertEdge(args: {
  tenantId: string;
  kind: EdgeKind;
  fromNodeId: string;
  toNodeId: string;
  walledCaseId?: string | null;
  validFrom?: Date;
  propsJson?: unknown;
}): Promise<void> {
  if (!dbReady) return;
  await db.insert(s.knowledgeGraphEdges).values({
    tenantId: args.tenantId,
    kind: args.kind,
    fromNodeId: args.fromNodeId,
    toNodeId: args.toNodeId,
    walledCaseId: args.walledCaseId ?? null,
    validFrom: args.validFrom ?? new Date(),
    propsJson: (args.propsJson ?? null) as never,
  }).onConflictDoNothing();
}

// ────────────────────────────────────────────────────────────────────────
// Entity projectors — called from the data layer write paths.
// ────────────────────────────────────────────────────────────────────────

export async function projectMatter(args: {
  tenantId: string;
  caseId: string;
  title: string;
  region: string;
  jurisdiction?: string | null;
  status: string;
  leadUserId?: string | null;
  companyId?: string | null;
  walledCaseId?: string | null;
}): Promise<void> {
  if (!dbReady) return;
  const matterNode = await upsertNode({
    tenantId: args.tenantId,
    kind: "matter",
    entityId: args.caseId,
    label: args.title,
    walledCaseId: args.walledCaseId ?? args.caseId, // if walled, points at self
    propsJson: { region: args.region, jurisdiction: args.jurisdiction, status: args.status },
  });

  if (args.leadUserId) {
    const userNode = await upsertNode({
      tenantId: args.tenantId, kind: "user", entityId: args.leadUserId, label: `Lawyer ${args.leadUserId.slice(0, 6)}`,
    });
    await upsertEdge({ tenantId: args.tenantId, kind: "matter_lead", fromNodeId: matterNode, toNodeId: userNode, walledCaseId: args.walledCaseId });
  }
  if (args.companyId) {
    const companyNode = await upsertNode({
      tenantId: args.tenantId, kind: "company", entityId: args.companyId, label: `Company ${args.companyId.slice(0, 6)}`,
    });
    await upsertEdge({ tenantId: args.tenantId, kind: "matter_on_company", fromNodeId: matterNode, toNodeId: companyNode, walledCaseId: args.walledCaseId });
  }
}

export async function projectCompany(args: {
  tenantId: string;
  companyId: string;
  legalName: string;
  jurisdiction: string;
  region: string;
  status: string;
  parentCompanyId?: string | null;
}): Promise<void> {
  if (!dbReady) return;
  const node = await upsertNode({
    tenantId: args.tenantId, kind: "company", entityId: args.companyId, label: args.legalName,
    propsJson: { jurisdiction: args.jurisdiction, region: args.region, status: args.status },
  });
  if (args.parentCompanyId) {
    const parent = await upsertNode({
      tenantId: args.tenantId, kind: "company", entityId: args.parentCompanyId, label: `Parent ${args.parentCompanyId.slice(0, 6)}`,
    });
    await upsertEdge({ tenantId: args.tenantId, kind: "subsidiary_of", fromNodeId: node, toNodeId: parent });
  }
}

export async function projectContract(args: {
  tenantId: string;
  contractId: string;
  title: string;
  region: string;
  status: string;
  caseId?: string | null;
  counterpartyCompanyId?: string | null;
  walledCaseId?: string | null;
}): Promise<void> {
  if (!dbReady) return;
  const node = await upsertNode({
    tenantId: args.tenantId, kind: "contract", entityId: args.contractId, label: args.title,
    walledCaseId: args.walledCaseId ?? null,
    propsJson: { region: args.region, status: args.status },
  });
  if (args.caseId) {
    const matterNode = await upsertNode({
      tenantId: args.tenantId, kind: "matter", entityId: args.caseId, label: `Matter ${args.caseId.slice(0, 6)}`,
      walledCaseId: args.walledCaseId ?? null,
    });
    await upsertEdge({ tenantId: args.tenantId, kind: "contract_on_matter", fromNodeId: node, toNodeId: matterNode, walledCaseId: args.walledCaseId });
  }
  if (args.counterpartyCompanyId) {
    const cpNode = await upsertNode({
      tenantId: args.tenantId, kind: "company", entityId: args.counterpartyCompanyId, label: `Counterparty ${args.counterpartyCompanyId.slice(0, 6)}`,
    });
    await upsertEdge({ tenantId: args.tenantId, kind: "contract_with_party", fromNodeId: node, toNodeId: cpNode, walledCaseId: args.walledCaseId });
  }
}

/** Bulk projector — sweep the firm's current rows into the graph. Useful
 *  as a one-shot warm-up on a new firm, or after a schema migration. */
export async function projectAll(session: Session): Promise<{ matters: number; companies: number; contracts: number }> {
  if (!dbReady) return { matters: 0, companies: 0, contracts: 0 };
  const tenantId = session.tenantId;

  const matters = await db.select().from(s.cases).where(eq(s.cases.tenantId, tenantId));
  for (const m of matters) {
    await projectMatter({
      tenantId,
      caseId: m.id,
      title: m.title,
      region: m.region,
      jurisdiction: m.jurisdiction,
      status: m.status,
      leadUserId: m.leadLawyerId,
      companyId: m.companyId,
    });
  }
  const companies = await db.select().from(s.companies).where(eq(s.companies.tenantId, tenantId));
  for (const c of companies) {
    await projectCompany({
      tenantId,
      companyId: c.id,
      legalName: c.legalName,
      jurisdiction: c.jurisdiction,
      region: c.region,
      status: c.status,
      parentCompanyId: c.parentCompanyId,
    });
  }
  const contracts = await db.select().from(s.contracts).where(eq(s.contracts.tenantId, tenantId));
  for (const ct of contracts) {
    await projectContract({
      tenantId,
      contractId: ct.id,
      title: ct.title,
      region: ct.region,
      status: ct.status,
    });
  }
  return { matters: matters.length, companies: companies.length, contracts: contracts.length };
}
