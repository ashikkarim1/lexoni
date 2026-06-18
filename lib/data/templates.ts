import { desc } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type TemplateRow = {
  id: string;
  title: string;
  kind: string;
  scope: string;
  region: string;
  jurisdiction: string | null;
  language: string;
  version: number;
  usageCount: number;
  installCount: number;
  priceCents: number | null;
};

export async function listTemplates(session: Session): Promise<TemplateRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.templates.id,
      title: s.templates.title,
      kind: s.templates.kind,
      scope: s.templates.scope,
      region: s.templates.region,
      jurisdiction: s.templates.jurisdiction,
      language: s.templates.language,
      version: s.templates.version,
      usageCount: s.templates.usageCount,
      installCount: s.templates.installCount,
      priceCents: s.templates.priceCents,
    })
    .from(s.templates)
    .where(tenantScope(session, s.templates))
    .orderBy(desc(s.templates.usageCount));
}

export type KnowledgeRow = {
  id: string;
  kind: string;
  title: string;
  region: string;
  jurisdiction: string | null;
  language: string;
  tags: string[] | null;
  approved: boolean;
  learnFromThis: boolean;
};

export async function listKnowledge(session: Session): Promise<KnowledgeRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.knowledgeItems.id,
      kind: s.knowledgeItems.kind,
      title: s.knowledgeItems.title,
      region: s.knowledgeItems.region,
      jurisdiction: s.knowledgeItems.jurisdiction,
      language: s.knowledgeItems.language,
      tags: s.knowledgeItems.tags,
      approved: s.knowledgeItems.approved,
      learnFromThis: s.knowledgeItems.learnFromThis,
    })
    .from(s.knowledgeItems)
    .where(tenantScope(session, s.knowledgeItems))
    .orderBy(desc(s.knowledgeItems.createdAt));
}

export type ClauseRow = {
  id: string;
  title: string;
  region: string;
  language: string;
  tags: string[] | null;
  usageCount: number;
  version: number;
};

export async function listClauses(session: Session): Promise<ClauseRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.clauses.id,
      title: s.clauses.title,
      region: s.clauses.region,
      language: s.clauses.language,
      tags: s.clauses.tags,
      usageCount: s.clauses.usageCount,
      version: s.clauses.version,
    })
    .from(s.clauses)
    .where(tenantScope(session, s.clauses))
    .orderBy(desc(s.clauses.usageCount));
}
