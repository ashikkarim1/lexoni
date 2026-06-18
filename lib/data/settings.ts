import { asc, desc } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type AutomationRow = {
  id: string;
  name: string;
  trigger: string;
  kind: string;
  active: boolean;
  runCount: number;
  failureCount: number;
  lastRunAt: Date | null;
};

export async function listAutomations(session: Session): Promise<AutomationRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.automations.id,
      name: s.automations.name,
      trigger: s.automations.trigger,
      kind: s.automations.kind,
      active: s.automations.active,
      runCount: s.automations.runCount,
      failureCount: s.automations.failureCount,
      lastRunAt: s.automations.lastRunAt,
    })
    .from(s.automations)
    .where(tenantScope(session, s.automations))
    .orderBy(asc(s.automations.name));
}

export type RoutingRuleRow = {
  id: string;
  name: string;
  priority: number;
  active: boolean;
  match: unknown;
  action: unknown;
  matchedCount: number;
  lastMatchedAt: Date | null;
};

export async function listRoutingRules(session: Session): Promise<RoutingRuleRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.routingRules.id,
      name: s.routingRules.name,
      priority: s.routingRules.priority,
      active: s.routingRules.active,
      match: s.routingRules.match as unknown as typeof s.routingRules.match,
      action: s.routingRules.action as unknown as typeof s.routingRules.action,
      matchedCount: s.routingRules.matchedCount,
      lastMatchedAt: s.routingRules.lastMatchedAt,
    })
    .from(s.routingRules)
    .where(tenantScope(session, s.routingRules))
    .orderBy(asc(s.routingRules.priority));
}

export type IntegrationRow = {
  id: string;
  kind: string;
  status: string;
  connectedAt: Date | null;
  lastSyncedAt: Date | null;
};

export async function listIntegrations(session: Session): Promise<IntegrationRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.integrations.id,
      kind: s.integrations.kind,
      status: s.integrations.status,
      connectedAt: s.integrations.connectedAt,
      lastSyncedAt: s.integrations.lastSyncedAt,
    })
    .from(s.integrations)
    .where(tenantScope(session, s.integrations))
    .orderBy(asc(s.integrations.kind));
}

void desc;
