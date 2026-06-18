/**
 * Matter workspace reads.
 *
 * `dbReady === false` → fall back to lib/mock so the app boots without a DB.
 * `dbReady === true`  → live Drizzle reads, every tenant-scoped table guarded
 * by `tenantScope(session, table)`.
 *
 * The shape returned is `MatterWorkspace` (from lib/mock) so the existing
 * MatterWorkspace client component doesn't change.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { deniedCaseIdsForUser } from "@/lib/data/walls";
import {
  matterWorkspaces,
  type MatterWorkspace,
  type DocSlot,
  type SlotStatus,
} from "@/lib/mock";

export async function listMatters(session: Session): Promise<MatterWorkspace[]> {
  if (!dbReady) return matterWorkspaces;
  return loadMatters(session);
}

export async function getMatter(session: Session, id: string): Promise<MatterWorkspace | null> {
  if (!dbReady) return matterWorkspaces.find((m) => m.id === id) ?? null;
  const [matter] = await loadMatters(session, id);
  return matter ?? null;
}

async function loadMatters(session: Session, onlyMatterId?: string): Promise<MatterWorkspace[]> {
  // Default-deny — walled matters the caller isn't in must not appear in any
  // list/get, even by direct id lookup. This is the trust unlock.
  const denied = await deniedCaseIdsForUser(session);
  if (onlyMatterId && denied.has(onlyMatterId)) return [];

  const headRows = await db
    .select({
      matterId: s.cases.id,
      matterNumber: s.cases.matterNumber,
      title: s.cases.title,
      description: s.cases.description,
      region: s.cases.region,
      jurisdiction: s.cases.jurisdiction,
      leadLawyerId: s.cases.leadLawyerId,
      mpId: s.matterProcesses.id,
      progressPct: s.matterProcesses.progressPct,
      targetCloseAt: s.matterProcesses.targetCloseAt,
      procId: s.processes.id,
      procTitle: s.processes.title,
      procLanguage: s.processes.language,
      procFeeModel: s.processes.defaultFeeModel,
    })
    .from(s.cases)
    .innerJoin(s.matterProcesses, eq(s.matterProcesses.caseId, s.cases.id))
    .innerJoin(s.processes, eq(s.processes.id, s.matterProcesses.processId))
    .where(
      and(
        tenantScope(session, s.cases),
        tenantScope(session, s.matterProcesses),
        ...(onlyMatterId ? [eq(s.cases.id, onlyMatterId)] : []),
      ),
    );

  const visibleHead = denied.size === 0 ? headRows : headRows.filter((r) => !denied.has(r.matterId));
  if (visibleHead.length === 0) return [];

  const mpIds = visibleHead.map((r) => r.mpId);
  const slotRows = await db
    .select({
      slot: s.matterDocumentSlots,
      procSlot: s.processDocumentSlots,
      assignee: s.users,
    })
    .from(s.matterDocumentSlots)
    .leftJoin(s.processDocumentSlots, eq(s.processDocumentSlots.id, s.matterDocumentSlots.slotId))
    .leftJoin(s.users, eq(s.users.id, s.matterDocumentSlots.assignedToUserId))
    .where(
      and(
        tenantScope(session, s.matterDocumentSlots),
        inArray(s.matterDocumentSlots.matterProcessId, mpIds),
      ),
    );

  const leadIds = visibleHead.map((r) => r.leadLawyerId).filter((x): x is string => !!x);
  const leadRows = leadIds.length
    ? await db.select({ id: s.users.id, fullName: s.users.fullName })
        .from(s.users).where(inArray(s.users.id, leadIds))
    : [];
  const leadByUserId = new Map(leadRows.map((u) => [u.id, u.fullName]));

  const slotsByMp = new Map<string, DocSlot[]>();
  for (const r of slotRows) {
    const list = slotsByMp.get(r.slot.matterProcessId) ?? [];
    list.push({
      id: r.slot.id,
      ordinal: r.slot.ordinal,
      title: r.slot.title,
      expectedKind: r.procSlot?.expectedKind ?? "",
      stage: r.procSlot?.stage ?? "",
      required: r.procSlot?.required ?? true,
      status: r.slot.status as SlotStatus,
      assignee: r.assignee?.fullName ?? "",
      autofilled: r.slot.autofilledFromClient,
      dueAt: r.slot.dueAt?.toISOString().slice(0, 10) ?? "",
    });
    slotsByMp.set(r.slot.matterProcessId, list);
  }
  for (const list of slotsByMp.values()) list.sort((a, b) => a.ordinal - b.ordinal);

  return visibleHead.map((row) => {
    // Seed stores `description = "${client} · ${feeModel}"` — see scripts/seed.ts.
    // TODO(Sprint 1.3+): pull these from clientContacts / companies once seeded.
    const [client = "", feeModel = ""] = (row.description ?? "").split(" · ");
    return {
      id: row.matterId,
      matterNumber: row.matterNumber,
      title: row.title,
      client,
      processId: row.procId,
      processTitle: row.procTitle,
      region: row.region as "UAE" | "KSA",
      jurisdiction: row.jurisdiction ?? "",
      language: (row.procLanguage === "ar" ? "ar" : "en") as "en" | "ar",
      lead: row.leadLawyerId ? leadByUserId.get(row.leadLawyerId) ?? "" : "",
      progressPct: row.progressPct,
      targetCloseAt: row.targetCloseAt?.toISOString().slice(0, 10) ?? "",
      feeModel: feeModel || row.procFeeModel,
      slots: slotsByMp.get(row.mpId) ?? [],
      clientRecord: {
        legalName: client,
        legalNameAr: "",
        address: "",
        licenseNo: "",
        signatory: "",
        signatoryTitle: "",
      },
    };
  });
}
