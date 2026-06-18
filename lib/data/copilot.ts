/**
 * Copilot plan persistence + lifecycle.
 *
 * One row per generated plan in `copilot_plans`. The flow:
 *   POST /api/copilot/plan        — generate + save as draft
 *   PATCH /api/copilot/plan       — approve | reject (partner action)
 *   POST  /api/copilot/instantiate — turn an approved plan into a matter
 *                                    + a matter_processes + matter_document_slots
 *
 * All transitions audited; partner-only on approve + instantiate.
 */
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { generatePlan, type CopilotPlan } from "@/lib/ai/copilot/plan";
import { writeAudit } from "@/lib/data/audit";

function matterTypeFromKind(kind: string): typeof s.matterTypeEnum.enumValues[number] {
  if (kind.startsWith("ma_")) return "ma";
  if (kind === "go_public" || kind === "go_private" || kind === "joint_venture" || kind === "company_formation" || kind === "fundraising_round" || kind === "restructuring") return "corporate";
  if (kind === "dispute_litigation") return "litigation";
  if (kind === "employment_matter") return "employment";
  if (kind === "licensing_regulatory") return "regulatory";
  return "advisory";
}

export type StoredPlan = {
  id: string;
  outcome: string;
  status: "draft" | "approved" | "instantiated" | "rejected";
  confidence: number;
  plan: CopilotPlan;
  requesterName: string | null;
  approverName: string | null;
  approvedAt: Date | null;
  rejectedReason: string | null;
  instantiatedCaseId: string | null;
  createdAt: Date;
};

export async function createPlan(session: Session, args: { outcome: string; region?: CopilotPlan["region"]; jurisdiction?: string | null }): Promise<{ id: string; plan: CopilotPlan }> {
  if (!dbReady) {
    // Generate without persisting so the demo screen still works without a DB.
    const plan = await generatePlan(session, args);
    return { id: "demo", plan };
  }
  const plan = await generatePlan(session, args);
  const id = randomUUID();
  await db.insert(s.copilotPlans).values({
    id,
    tenantId: session.tenantId,
    requesterUserId: session.userId,
    outcome: args.outcome,
    region: (args.region ?? plan.region) as CopilotPlan["region"],
    jurisdiction: args.jurisdiction ?? plan.jurisdiction ?? null,
    language: "en",
    planJson: plan as never,
    confidence: plan.confidence,
    status: "draft",
  });
  await writeAudit(session, {
    action: "copilot_plan_created",
    entityKind: "copilot_plan",
    entityId: id,
    afterJson: { outcome: args.outcome, confidence: plan.confidence, model: plan.modelLabel },
  });
  return { id, plan };
}

export async function listPlans(session: Session, limit = 50): Promise<StoredPlan[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      id: s.copilotPlans.id,
      outcome: s.copilotPlans.outcome,
      status: s.copilotPlans.status,
      confidence: s.copilotPlans.confidence,
      planJson: s.copilotPlans.planJson,
      requesterName: s.users.fullName,
      approverName: sql_approverName(),
      approvedAt: s.copilotPlans.approvedAt,
      rejectedReason: s.copilotPlans.rejectedReason,
      instantiatedCaseId: s.copilotPlans.instantiatedCaseId,
      createdAt: s.copilotPlans.createdAt,
    })
    .from(s.copilotPlans)
    .leftJoin(s.users, eq(s.users.id, s.copilotPlans.requesterUserId))
    .where(tenantScope(session, s.copilotPlans))
    .orderBy(desc(s.copilotPlans.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    ...r,
    status: r.status as StoredPlan["status"],
    plan: r.planJson as CopilotPlan,
    approverName: null,  // populated when we join the approver below; left null for the simple list
  }));
}

function sql_approverName() {
  // Lightweight stub — current schema doesn't join approver in this query;
  // populated on the per-plan page via a second lookup. Keeping the row
  // shape stable on /copilot is more useful than a second join here.
  return s.copilotPlans.approvedByUserId;
}

export async function getPlan(session: Session, id: string): Promise<StoredPlan | null> {
  if (!dbReady) return null;
  const [row] = await db
    .select({
      id: s.copilotPlans.id,
      outcome: s.copilotPlans.outcome,
      status: s.copilotPlans.status,
      confidence: s.copilotPlans.confidence,
      planJson: s.copilotPlans.planJson,
      requesterName: s.users.fullName,
      approvedAt: s.copilotPlans.approvedAt,
      rejectedReason: s.copilotPlans.rejectedReason,
      instantiatedCaseId: s.copilotPlans.instantiatedCaseId,
      createdAt: s.copilotPlans.createdAt,
    })
    .from(s.copilotPlans)
    .leftJoin(s.users, eq(s.users.id, s.copilotPlans.requesterUserId))
    .where(and(tenantScope(session, s.copilotPlans), eq(s.copilotPlans.id, id)))
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    status: row.status as StoredPlan["status"],
    plan: row.planJson as CopilotPlan,
    approverName: null,
  };
}

export async function approvePlan(session: Session, id: string): Promise<void> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  if (session.role !== "firm_admin" && session.role !== "lawyer" && session.role !== "platform_admin") {
    throw new Error("Only a partner / lead lawyer can approve a copilot plan.");
  }
  await db
    .update(s.copilotPlans)
    .set({ status: "approved", approvedByUserId: session.userId, approvedAt: new Date() })
    .where(and(tenantScope(session, s.copilotPlans), eq(s.copilotPlans.id, id)));
  await writeAudit(session, {
    action: "copilot_plan_approved",
    entityKind: "copilot_plan",
    entityId: id,
  });
}

export async function rejectPlan(session: Session, id: string, reason: string): Promise<void> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  if (session.role !== "firm_admin" && session.role !== "lawyer" && session.role !== "platform_admin") {
    throw new Error("Only a partner / lead lawyer can reject a copilot plan.");
  }
  await db
    .update(s.copilotPlans)
    .set({ status: "rejected", rejectedReason: reason })
    .where(and(tenantScope(session, s.copilotPlans), eq(s.copilotPlans.id, id)));
  await writeAudit(session, {
    action: "copilot_plan_rejected",
    entityKind: "copilot_plan",
    entityId: id,
    afterJson: { reason },
  });
}

/** Turn an approved plan into a real matter — inserts a `cases` row, a
 *  `matter_processes` row, and the `matter_document_slots`.  No matter
 *  text is finalised — this is suggestion-state; the partner can edit. */
export async function instantiatePlan(session: Session, id: string): Promise<{ caseId: string }> {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  if (session.role !== "firm_admin" && session.role !== "lawyer" && session.role !== "platform_admin") {
    throw new Error("Only a partner / lead lawyer can instantiate a copilot plan.");
  }
  const row = await getPlan(session, id);
  if (!row) throw new Error("Plan not found");
  if (row.status !== "approved") throw new Error("Plan must be approved before instantiation");

  const plan = row.plan;
  const caseId = randomUUID();
  const matterNumber = `M-COP-${Date.now().toString(36).toUpperCase()}`;
  await db.insert(s.cases).values({
    id: caseId,
    tenantId: session.tenantId,
    matterNumber,
    title: plan.title,
    matterType: matterTypeFromKind(plan.kind),
    status: "intake",
    region: plan.region,
    jurisdiction: plan.jurisdiction ?? null,
    leadLawyerId: session.userId,
    feeArrangement: plan.defaultFeeModel,
  });

  await db
    .update(s.copilotPlans)
    .set({ status: "instantiated", instantiatedCaseId: caseId })
    .where(and(tenantScope(session, s.copilotPlans), eq(s.copilotPlans.id, id)));

  // Materialise a tenant-scoped process from the plan, then attach it to
  // the matter and stamp the document slots so the matter workspace renders.
  const [proc] = await db.insert(s.processes).values({
    tenantId: session.tenantId,
    kind: plan.kind as typeof s.processKindEnum.enumValues[number],
    title: plan.title,
    titleAr: null,
    description: `Generated by Lexoni Copilot from: "${row.outcome}"`,
    region: plan.region,
    jurisdiction: plan.jurisdiction ?? null,
    language: "en",
    defaultFeeModel: plan.defaultFeeModel,
    expectedDurationDays: plan.expectedDurationDays,
    version: 1,
    isCurrent: true,
    active: true,
  }).returning({ id: s.processes.id });

  // Steps — insert and capture (ordinal → step.id) so slots link back.
  const stepIdByOrdinal = new Map<number, string>();
  for (const step of plan.steps) {
    const [stepRow] = await db.insert(s.processSteps).values({
      processId: proc.id,
      ordinal: step.ordinal,
      name: step.name,
      nameAr: step.nameAr ?? null,
      dependsOnOrdinals: step.dependsOnOrdinals ?? [],
      ownerRole: step.ownerRole ?? null,
      expectedDurationDays: step.expectedDurationDays,
      isMilestone: step.isMilestone ?? false,
      optional: false,
    }).returning({ id: s.processSteps.id });
    stepIdByOrdinal.set(step.ordinal, stepRow.id);
  }
  // Process document slots (the template definitions).
  const procSlotIdByOrdinal = new Map<number, string>();
  for (const slot of plan.slots) {
    const [slotRow] = await db.insert(s.processDocumentSlots).values({
      processId: proc.id,
      stepId: stepIdByOrdinal.get(slot.stepOrdinal) ?? null,
      ordinal: slot.ordinal,
      title: slot.title,
      titleAr: slot.titleAr ?? null,
      expectedKind: slot.expectedKind,
      required: slot.required ?? true,
      stage: slot.stage ?? null,
    }).returning({ id: s.processDocumentSlots.id });
    procSlotIdByOrdinal.set(slot.ordinal, slotRow.id);
  }

  // Attach process to the matter + spawn live slots.
  const [mp] = await db.insert(s.matterProcesses).values({
    tenantId: session.tenantId,
    caseId,
    processId: proc.id,
    processVersion: 1,
  }).returning({ id: s.matterProcesses.id });
  for (const slot of plan.slots) {
    await db.insert(s.matterDocumentSlots).values({
      tenantId: session.tenantId,
      matterProcessId: mp.id,
      slotId: procSlotIdByOrdinal.get(slot.ordinal) ?? null,
      ordinal: slot.ordinal,
      title: slot.title,
      status: "not_started",
    });
  }

  await writeAudit(session, {
    action: "copilot_plan_instantiated",
    entityKind: "case",
    entityId: caseId,
    afterJson: { copilotPlanId: id, slots: plan.slots.length, steps: plan.steps.length },
  });

  return { caseId };
}
