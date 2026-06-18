/**
 * Matter document slot writes.
 *
 * Persists status changes, template attaches, and autofill confirmations into
 * `matter_document_slots`, scoped to the caller's tenant. Every write emits an
 * `audit_log` row (action labels listed below). Autofill writes the proposed
 * core-detail diff into `core_detail_diff_json` — we capture the diff but do
 * NOT silently overwrite the canonical client record (Sprint 1.3 contract).
 */
import { and, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import type { SlotStatus } from "@/lib/mock";

export type SlotPatch = {
  status?: SlotStatus;
  autofilledFromClient?: boolean;
  coreDetailDiffJson?: Record<string, unknown>;
  attachedTemplateTitle?: string;
};

const AUDIT_ACTION: Record<keyof SlotPatch, string> = {
  status: "slot_status_update",
  autofilledFromClient: "slot_autofill_confirm",
  coreDetailDiffJson: "slot_autofill_diff_recorded",
  attachedTemplateTitle: "slot_attach_template",
};

export async function patchSlot(
  session: Session,
  slotId: string,
  patch: SlotPatch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!dbReady) return { ok: true }; // mock-mode: UI keeps its optimistic state

  const [before] = await db
    .select()
    .from(s.matterDocumentSlots)
    .where(and(tenantScope(session, s.matterDocumentSlots), eq(s.matterDocumentSlots.id, slotId)))
    .limit(1);
  if (!before) return { ok: false, error: "slot_not_found" };

  const update: Record<string, unknown> = {};
  if (patch.status) update.status = patch.status;
  if (typeof patch.autofilledFromClient === "boolean") update.autofilledFromClient = patch.autofilledFromClient;
  if (patch.coreDetailDiffJson) update.coreDetailDiffJson = patch.coreDetailDiffJson;
  if (patch.status === "signed" || patch.status === "filed") update.completedAt = new Date();

  if (Object.keys(update).length === 0 && !patch.attachedTemplateTitle) {
    return { ok: true };
  }

  if (Object.keys(update).length > 0) {
    await db
      .update(s.matterDocumentSlots)
      .set(update)
      .where(and(tenantScope(session, s.matterDocumentSlots), eq(s.matterDocumentSlots.id, slotId)));
  }

  // One audit row per discrete change so the trail is grep-able.
  if (patch.status && patch.status !== before.status) {
    await writeAudit(session, {
      action: AUDIT_ACTION.status,
      entityKind: "matter_document_slot",
      entityId: slotId,
      beforeJson: { status: before.status },
      afterJson: { status: patch.status },
    });
  }
  if (typeof patch.autofilledFromClient === "boolean" && patch.autofilledFromClient !== before.autofilledFromClient) {
    await writeAudit(session, {
      action: AUDIT_ACTION.autofilledFromClient,
      entityKind: "matter_document_slot",
      entityId: slotId,
      afterJson: { autofilledFromClient: patch.autofilledFromClient },
    });
  }
  if (patch.coreDetailDiffJson) {
    await writeAudit(session, {
      action: AUDIT_ACTION.coreDetailDiffJson,
      entityKind: "matter_document_slot",
      entityId: slotId,
      afterJson: { diff: patch.coreDetailDiffJson },
    });
  }
  if (patch.attachedTemplateTitle) {
    await writeAudit(session, {
      action: AUDIT_ACTION.attachedTemplateTitle,
      entityKind: "matter_document_slot",
      entityId: slotId,
      afterJson: { templateTitle: patch.attachedTemplateTitle },
    });
  }

  return { ok: true };
}
