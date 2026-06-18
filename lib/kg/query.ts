/**
 * Sprint 20 — Knowledge Graph queries.
 *
 * Wall-aware reads over knowledge_graph_{nodes, edges}. The query layer is
 * exposed as an AI tool to the Memory + Copilot engines; the firm's data
 * structure is too big to ship as raw context every call, so we expose
 * narrow, parameterised queries instead.
 */
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { deniedCaseIdsForUser } from "@/lib/data/walls";

type NodeKind = typeof s.knowledgeGraphNodeKindEnum.enumValues[number];
type EdgeKind = typeof s.knowledgeGraphEdgeKindEnum.enumValues[number];

export type KgNode = { id: string; kind: NodeKind; label: string; props: Record<string, unknown> | null };
export type KgEdge = { id: string; kind: EdgeKind; from: KgNode; to: KgNode };

async function denied(session: Session): Promise<Set<string>> {
  return deniedCaseIdsForUser(session);
}

/** All nodes of one kind, wall-stripped. */
export async function nodesByKind(session: Session, kind: NodeKind): Promise<KgNode[]> {
  if (!dbReady) return [];
  const d = await denied(session);
  const rows = await db
    .select({
      id: s.knowledgeGraphNodes.id,
      kind: s.knowledgeGraphNodes.kind,
      label: s.knowledgeGraphNodes.label,
      props: s.knowledgeGraphNodes.propsJson,
      walledCaseId: s.knowledgeGraphNodes.walledCaseId,
    })
    .from(s.knowledgeGraphNodes)
    .where(and(tenantScope(session, s.knowledgeGraphNodes), eq(s.knowledgeGraphNodes.kind, kind)));
  return rows
    .filter((r) => !r.walledCaseId || !d.has(r.walledCaseId))
    .map((r) => ({ id: r.id, kind: r.kind as NodeKind, label: r.label, props: (r.props as Record<string, unknown> | null) ?? null }));
}

/** Neighbours of a node along a typed edge — useful tool call for "all
 *  matters on this company", "all contracts on this matter", etc. */
export async function neighbours(
  session: Session,
  nodeId: string,
  edgeKind: EdgeKind,
  direction: "out" | "in",
): Promise<KgNode[]> {
  if (!dbReady) return [];
  const d = await denied(session);
  const edges = await db
    .select({
      otherId: direction === "out" ? s.knowledgeGraphEdges.toNodeId : s.knowledgeGraphEdges.fromNodeId,
      walledCaseId: s.knowledgeGraphEdges.walledCaseId,
    })
    .from(s.knowledgeGraphEdges)
    .where(and(
      tenantScope(session, s.knowledgeGraphEdges),
      eq(s.knowledgeGraphEdges.kind, edgeKind),
      eq(direction === "out" ? s.knowledgeGraphEdges.fromNodeId : s.knowledgeGraphEdges.toNodeId, nodeId),
      isNull(s.knowledgeGraphEdges.validTo),
    ));
  const allowed = edges.filter((e) => !e.walledCaseId || !d.has(e.walledCaseId)).map((e) => e.otherId);
  if (allowed.length === 0) return [];
  const nodes = await db
    .select({
      id: s.knowledgeGraphNodes.id,
      kind: s.knowledgeGraphNodes.kind,
      label: s.knowledgeGraphNodes.label,
      props: s.knowledgeGraphNodes.propsJson,
      walledCaseId: s.knowledgeGraphNodes.walledCaseId,
    })
    .from(s.knowledgeGraphNodes)
    .where(and(tenantScope(session, s.knowledgeGraphNodes), inArray(s.knowledgeGraphNodes.id, allowed)));
  return nodes
    .filter((n) => !n.walledCaseId || !d.has(n.walledCaseId))
    .map((n) => ({ id: n.id, kind: n.kind as NodeKind, label: n.label, props: (n.props as Record<string, unknown> | null) ?? null }));
}

/** Quick "graph summary" used as a one-shot AI tool — counts every node
 *  kind the requesting user can see. */
export async function summary(session: Session): Promise<{ kind: NodeKind; count: number }[]> {
  if (!dbReady) return [];
  const d = await denied(session);
  const rows = await db
    .select({
      kind: s.knowledgeGraphNodes.kind,
      walledCaseId: s.knowledgeGraphNodes.walledCaseId,
    })
    .from(s.knowledgeGraphNodes)
    .where(tenantScope(session, s.knowledgeGraphNodes));
  const counts = new Map<NodeKind, number>();
  for (const r of rows) {
    if (r.walledCaseId && d.has(r.walledCaseId)) continue;
    counts.set(r.kind as NodeKind, (counts.get(r.kind as NodeKind) ?? 0) + 1);
  }
  return [...counts.entries()].map(([kind, count]) => ({ kind, count }));
}

void or;
