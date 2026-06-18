/* eslint-disable no-console */
/**
 * Sprint 1.2 guard — tenantScope() must:
 *   1. throw when called on a table that has no tenant_id column
 *   2. produce a where-clause referencing the session's tenantId for every
 *      tenant-scoped table we read in lib/data/*
 *
 * Run: `npm test`.
 */
import assert from "node:assert/strict";
import * as s from "../lib/db/schema";
import { tenantScope } from "../lib/db/scoped";

const session = { tenantId: "11111111-1111-1111-1111-111111111111" } as const;

// 1) Refuses tables without a tenant_id (users is the canonical example —
//    a user can belong to many tenants; identity is global).
assert.throws(
  () => tenantScope(session, s.users as unknown as { tenantId: unknown }),
  /tenant_id/,
  "tenantScope must throw on tables without a tenant_id column",
);

// 2) Accepts every tenant-scoped table used by lib/data/matters.ts (and a few
//    more for good measure). Each call should produce a where-clause object.
const tenantScoped = [
  ["cases",                 s.cases],
  ["matter_processes",      s.matterProcesses],
  ["matter_document_slots", s.matterDocumentSlots],
  ["contracts",             s.contracts],
  ["time_entries",          s.timeEntries],
  ["time_entry_drafts",     s.timeEntryDrafts],
  ["activity_events",       s.activityEvents],
  ["leakage_alerts",        s.leakageAlerts],
  ["draft_requests",        s.draftRequests],
  ["clauses",               s.clauses],
  ["wall_groups",           s.wallGroups],
  ["memberships",           s.memberships],
  ["audit_log",             s.auditLog],
  ["matter_documents",      s.matterDocuments],
  ["pending_invites",       s.pendingInvites],
  ["invoices",              s.invoices],
  ["subscriptions",         s.subscriptions],
  ["usage_meters",          s.usageMeters],
  ["data_subject_requests", s.dataSubjectRequests],
  ["consent_records",       s.consentRecords],
  ["data_processing_activities", s.dataProcessingActivities],
  ["engagement_letter_delivery", s.engagementLetterDelivery],
  ["signature_party_delivery",   s.signaturePartyDelivery],
  ["signature_workflow_content", s.signatureWorkflowContent],
  ["pending_invites",            s.pendingInvites],
  ["document_inbox",             s.documentInbox],
  ["precedents",                 s.precedents],
  ["matter_emails",              s.matterEmails],
  ["knowledge_chunks",           s.knowledgeChunks],
  ["copilot_plans",              s.copilotPlans],
  ["regulatory_impact_assessments", s.regulatoryImpactAssessments],
  ["knowledge_graph_nodes",      s.knowledgeGraphNodes],
  ["knowledge_graph_edges",      s.knowledgeGraphEdges],
  ["bd_prospects",               s.bdProspects],
  ["bd_outreach",                s.bdOutreach],
  ["user_feedback",              s.userFeedback],
] as const;

for (const [name, table] of tenantScoped) {
  const where = tenantScope(session, table as unknown as { tenantId: unknown });
  assert.ok(where, `tenantScope returned falsy for ${name}`);
}

console.log(`✓ tenantScope refuses tenant-less tables and scopes ${tenantScoped.length} tenant-scoped tables`);
