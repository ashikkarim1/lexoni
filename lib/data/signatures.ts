/**
 * General-purpose e-signature workflows.
 *
 *   • Sequential or parallel ordering
 *   • Per-party magic link delivered by Resend
 *   • Click-to-sign on the public page, certificate hash sealed
 *   • Workflow auto-transitions to `complete` when every signer has signed
 *
 * Reusable from anywhere — engagement letters, contracts, ad-hoc documents.
 * Audit trail end-to-end.
 */
import { randomBytes, createHash } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import { sendEmail, appUrl } from "@/lib/email/resend";
import { signRequestEmail } from "@/lib/email/templates";

export type WorkflowRow = {
  id: string;
  status: string;
  order: "sequential" | "parallel";
  title: string;
  bodyMd: string;
  createdAt: Date;
  expiresAt: Date | null;
  parties: PartyRow[];
};

export type PartyRow = {
  id: string;
  ordinal: number;
  name: string;
  email: string;
  role: string;
  status: string;
  notifiedAt: Date | null;
  viewedAt: Date | null;
  signedAt: Date | null;
  declinedAt: Date | null;
};

export type CreateWorkflowInput = {
  title: string;
  bodyMd: string;
  order: "sequential" | "parallel";
  parties: Array<{ name: string; email: string; role?: string }>;
  expiresInDays?: number;
  contractId?: string;
};

export async function createWorkflow(session: Session, input: CreateWorkflowInput): Promise<{ id: string } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };
  if (!input.title.trim() || !input.bodyMd.trim()) return { error: "title_and_body_required" };
  if (input.parties.length === 0) return { error: "at_least_one_party_required" };

  const expires = new Date(Date.now() + (input.expiresInDays ?? 14) * 24 * 60 * 60 * 1000);
  const [wf] = await db.insert(s.signatureWorkflows).values({
    tenantId: session.tenantId,
    contractId: input.contractId,
    order: input.order,
    expiresAt: expires,
    reminderEveryDays: 3,
    status: "draft",
  }).returning({ id: s.signatureWorkflows.id });

  await db.insert(s.signatureWorkflowContent).values({
    tenantId: session.tenantId,
    workflowId: wf.id,
    title: input.title.trim(),
    bodyMd: input.bodyMd,
  });

  for (let i = 0; i < input.parties.length; i++) {
    const p = input.parties[i];
    const [party] = await db.insert(s.signatureWorkflowParties).values({
      workflowId: wf.id,
      ordinal: i + 1,
      partyName: p.name.trim(),
      partyEmail: p.email.trim().toLowerCase(),
      partyRole: p.role?.trim() || "signer",
      status: "pending",
    }).returning({ id: s.signatureWorkflowParties.id });

    const token = randomBytes(24).toString("base64url");
    await db.insert(s.signaturePartyDelivery).values({
      tenantId: session.tenantId,
      partyId: party.id,
      viewToken: token,
    });
  }

  await writeAudit(session, {
    action: "signature_workflow_created",
    entityKind: "signature_workflow",
    entityId: wf.id,
    afterJson: { title: input.title, parties: input.parties.length, order: input.order },
  });
  return { id: wf.id };
}

/** Mark workflow `in_flight`. For sequential workflows, email party 1 only.
 *  For parallel, email everyone. */
export async function sendWorkflow(session: Session, workflowId: string): Promise<{ ok: true } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };
  const [wf] = await db
    .select()
    .from(s.signatureWorkflows)
    .where(and(tenantScope(session, s.signatureWorkflows), eq(s.signatureWorkflows.id, workflowId)))
    .limit(1);
  if (!wf) return { error: "not_found" };

  const [content] = await db
    .select()
    .from(s.signatureWorkflowContent)
    .where(eq(s.signatureWorkflowContent.workflowId, workflowId))
    .limit(1);

  const parties = await db
    .select()
    .from(s.signatureWorkflowParties)
    .where(eq(s.signatureWorkflowParties.workflowId, workflowId))
    .orderBy(asc(s.signatureWorkflowParties.ordinal));

  const partyIds = parties.map((p) => p.id);
  const deliveries = await db
    .select()
    .from(s.signaturePartyDelivery)
    .where(inArray(s.signaturePartyDelivery.partyId, partyIds));
  const tokenByParty = new Map(deliveries.map((d) => [d.partyId, d.viewToken]));

  await db
    .update(s.signatureWorkflows)
    .set({ status: "in_flight" })
    .where(and(tenantScope(session, s.signatureWorkflows), eq(s.signatureWorkflows.id, workflowId)));

  const toEmail = wf.order === "sequential" ? parties.slice(0, 1) : parties;

  for (const p of toEmail) {
    const token = tokenByParty.get(p.id);
    if (!token) continue;
    const url = `${appUrl()}/sign/${token}`;
    const tpl = signRequestEmail({
      locale: session.locale === "ar" ? "ar" : "en",
      signerName: p.partyName,
      firmName: session.tenantName,
      documentTitle: content?.title ?? "Document for signature",
      signUrl: url,
    });
    const sent = await sendEmail({
      to: p.partyEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "kind", value: "sign_request" }],
    });
    await db
      .update(s.signatureWorkflowParties)
      .set({ status: "notified", notifiedAt: new Date() })
      .where(eq(s.signatureWorkflowParties.id, p.id));
    await writeAudit(session, {
      action: "sign_request_emailed",
      entityKind: "signature_party",
      entityId: p.id,
      afterJson: { to: p.partyEmail, sent: "ok" in sent && sent.ok, skipped: "skipped" in sent },
    });
  }

  return { ok: true };
}

export async function listWorkflows(session: Session): Promise<WorkflowRow[]> {
  if (!dbReady) return [];
  const wfs = await db
    .select()
    .from(s.signatureWorkflows)
    .where(tenantScope(session, s.signatureWorkflows))
    .orderBy(desc(s.signatureWorkflows.createdAt));

  if (wfs.length === 0) return [];
  const wfIds = wfs.map((w) => w.id);
  const contents = await db
    .select()
    .from(s.signatureWorkflowContent)
    .where(inArray(s.signatureWorkflowContent.workflowId, wfIds));
  const contentByWf = new Map(contents.map((c) => [c.workflowId, c]));
  const partiesAll = await db
    .select()
    .from(s.signatureWorkflowParties)
    .where(inArray(s.signatureWorkflowParties.workflowId, wfIds))
    .orderBy(asc(s.signatureWorkflowParties.ordinal));
  const partiesByWf = new Map<string, typeof partiesAll>();
  for (const p of partiesAll) {
    const arr = partiesByWf.get(p.workflowId) ?? [];
    arr.push(p);
    partiesByWf.set(p.workflowId, arr);
  }
  return wfs.map((w) => ({
    id: w.id,
    status: w.status,
    order: w.order as "sequential" | "parallel",
    title: contentByWf.get(w.id)?.title ?? "Document",
    bodyMd: contentByWf.get(w.id)?.bodyMd ?? "",
    createdAt: w.createdAt,
    expiresAt: w.expiresAt,
    parties: (partiesByWf.get(w.id) ?? []).map((p) => ({
      id: p.id,
      ordinal: p.ordinal,
      name: p.partyName,
      email: p.partyEmail,
      role: p.partyRole,
      status: p.status,
      notifiedAt: p.notifiedAt,
      viewedAt: p.viewedAt,
      signedAt: p.signedAt,
      declinedAt: p.declinedAt,
    })),
  }));
}

// ─────────────────── PUBLIC (no auth) — party signing flow ───────────────────

export type PublicSignView = {
  partyId: string;
  partyName: string;
  partyEmail: string;
  partyRole: string;
  partyStatus: string;
  workflowId: string;
  workflowStatus: string;
  workflowOrder: "sequential" | "parallel";
  title: string;
  bodyMd: string;
  yourTurn: boolean;
  firmName: string;
};

export async function publicLookupParty(token: string): Promise<PublicSignView | null> {
  if (!dbReady) return null;
  const [row] = await db
    .select({
      partyId: s.signatureWorkflowParties.id,
      partyName: s.signatureWorkflowParties.partyName,
      partyEmail: s.signatureWorkflowParties.partyEmail,
      partyRole: s.signatureWorkflowParties.partyRole,
      partyStatus: s.signatureWorkflowParties.status,
      partyOrdinal: s.signatureWorkflowParties.ordinal,
      workflowId: s.signatureWorkflows.id,
      workflowStatus: s.signatureWorkflows.status,
      workflowOrder: s.signatureWorkflows.order,
      tenantId: s.signaturePartyDelivery.tenantId,
      firmName: s.tenants.name,
      contentTitle: s.signatureWorkflowContent.title,
      contentBody: s.signatureWorkflowContent.bodyMd,
    })
    .from(s.signaturePartyDelivery)
    .innerJoin(s.signatureWorkflowParties, eq(s.signatureWorkflowParties.id, s.signaturePartyDelivery.partyId))
    .innerJoin(s.signatureWorkflows, eq(s.signatureWorkflows.id, s.signatureWorkflowParties.workflowId))
    .innerJoin(s.tenants, eq(s.tenants.id, s.signaturePartyDelivery.tenantId))
    .leftJoin(s.signatureWorkflowContent, eq(s.signatureWorkflowContent.workflowId, s.signatureWorkflows.id))
    .where(eq(s.signaturePartyDelivery.viewToken, token))
    .limit(1);
  if (!row) return null;

  // For sequential workflows, the party can only sign if all earlier parties have signed.
  let yourTurn = true;
  if (row.workflowOrder === "sequential") {
    const earlier = await db
      .select({ status: s.signatureWorkflowParties.status })
      .from(s.signatureWorkflowParties)
      .where(
        and(
          eq(s.signatureWorkflowParties.workflowId, row.workflowId),
          // ordinal < this party's ordinal
        ),
      );
    yourTurn = earlier
      .slice(0, Math.max(0, row.partyOrdinal - 1))
      .every((p) => p.status === "signed");
  }
  yourTurn = yourTurn && row.partyStatus !== "signed" && row.partyStatus !== "declined" && row.workflowStatus !== "complete";

  return {
    partyId: row.partyId,
    partyName: row.partyName,
    partyEmail: row.partyEmail,
    partyRole: row.partyRole,
    partyStatus: row.partyStatus,
    workflowId: row.workflowId,
    workflowStatus: row.workflowStatus,
    workflowOrder: row.workflowOrder as "sequential" | "parallel",
    title: row.contentTitle ?? "Document for signature",
    bodyMd: row.contentBody ?? "",
    yourTurn,
    firmName: row.firmName,
  };
}

export async function publicMarkPartyViewed(token: string, ipAddress: string | null): Promise<void> {
  if (!dbReady) return;
  const [d] = await db
    .select({ partyId: s.signaturePartyDelivery.partyId, tenantId: s.signaturePartyDelivery.tenantId })
    .from(s.signaturePartyDelivery)
    .where(eq(s.signaturePartyDelivery.viewToken, token))
    .limit(1);
  if (!d) return;
  await db
    .update(s.signatureWorkflowParties)
    .set({ status: "viewed", viewedAt: new Date(), ipAddress: ipAddress ?? undefined })
    .where(and(eq(s.signatureWorkflowParties.id, d.partyId), isNull(s.signatureWorkflowParties.signedAt)));
  await db.insert(s.auditLog).values({
    tenantId: d.tenantId,
    action: "signature_party_viewed",
    entityKind: "signature_party",
    entityId: d.partyId,
    ipAddress: ipAddress ?? undefined,
  });
}

export async function publicPartySign(token: string, args: { signerName: string; ipAddress: string | null; userAgent: string | null }): Promise<{ ok: true } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };
  const [d] = await db
    .select({ partyId: s.signaturePartyDelivery.partyId, tenantId: s.signaturePartyDelivery.tenantId })
    .from(s.signaturePartyDelivery)
    .where(eq(s.signaturePartyDelivery.viewToken, token))
    .limit(1);
  if (!d) return { error: "not_found" };

  const [party] = await db
    .select()
    .from(s.signatureWorkflowParties)
    .where(eq(s.signatureWorkflowParties.id, d.partyId))
    .limit(1);
  if (!party) return { error: "not_found" };
  if (party.status === "signed" || party.status === "declined") return { error: "already_finalised" };

  const now = new Date();
  const certInput = `${party.id}|${args.signerName}|${args.ipAddress ?? ""}|${now.toISOString()}`;
  const certHash = createHash("sha256").update(certInput).digest("hex");

  await db
    .update(s.signatureWorkflowParties)
    .set({ status: "signed", signedAt: now, ipAddress: args.ipAddress ?? undefined, signatureCertHash: certHash })
    .where(eq(s.signatureWorkflowParties.id, d.partyId));

  await db.insert(s.auditLog).values({
    tenantId: d.tenantId,
    action: "signature_party_signed",
    entityKind: "signature_party",
    entityId: d.partyId,
    afterJson: { signerName: args.signerName, certHash } as never,
    ipAddress: args.ipAddress ?? undefined,
    userAgent: args.userAgent ?? undefined,
  });

  // Advance the workflow if everyone has signed; for sequential, notify the next.
  const all = await db
    .select()
    .from(s.signatureWorkflowParties)
    .where(eq(s.signatureWorkflowParties.workflowId, party.workflowId))
    .orderBy(asc(s.signatureWorkflowParties.ordinal));
  const allSigned = all.every((p) => p.status === "signed");
  if (allSigned) {
    await db
      .update(s.signatureWorkflows)
      .set({ status: "complete" })
      .where(eq(s.signatureWorkflows.id, party.workflowId));
    await db.insert(s.auditLog).values({
      tenantId: d.tenantId,
      action: "signature_workflow_complete",
      entityKind: "signature_workflow",
      entityId: party.workflowId,
    });
  } else {
    // Sequential — notify the next pending party.
    const [wf] = await db.select().from(s.signatureWorkflows).where(eq(s.signatureWorkflows.id, party.workflowId)).limit(1);
    if (wf?.order === "sequential") {
      const next = all.find((p) => p.status === "pending");
      if (next) {
        const [delivery] = await db.select().from(s.signaturePartyDelivery).where(eq(s.signaturePartyDelivery.partyId, next.id)).limit(1);
        const [content] = await db.select().from(s.signatureWorkflowContent).where(eq(s.signatureWorkflowContent.workflowId, party.workflowId)).limit(1);
        if (delivery && content) {
          const [tenant] = await db.select().from(s.tenants).where(eq(s.tenants.id, d.tenantId)).limit(1);
          const url = `${appUrl()}/sign/${delivery.viewToken}`;
          const tpl = signRequestEmail({
            locale: "en",
            signerName: next.partyName,
            firmName: tenant?.name ?? "the firm",
            documentTitle: content.title,
            signUrl: url,
          });
          await sendEmail({
            to: next.partyEmail,
            subject: tpl.subject,
            html: tpl.html,
            text: tpl.text,
            tags: [{ name: "kind", value: "sign_request" }],
          });
          await db
            .update(s.signatureWorkflowParties)
            .set({ status: "notified", notifiedAt: new Date() })
            .where(eq(s.signatureWorkflowParties.id, next.id));
        }
      }
    }
  }

  return { ok: true };
}

export async function publicPartyDecline(token: string, args: { reason: string; ipAddress: string | null }): Promise<{ ok: true } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };
  const [d] = await db
    .select({ partyId: s.signaturePartyDelivery.partyId, tenantId: s.signaturePartyDelivery.tenantId })
    .from(s.signaturePartyDelivery)
    .where(eq(s.signaturePartyDelivery.viewToken, token))
    .limit(1);
  if (!d) return { error: "not_found" };
  await db
    .update(s.signatureWorkflowParties)
    .set({ status: "declined", declinedAt: new Date(), ipAddress: args.ipAddress ?? undefined })
    .where(eq(s.signatureWorkflowParties.id, d.partyId));
  // Workflow as a whole goes to declined.
  const [p] = await db.select().from(s.signatureWorkflowParties).where(eq(s.signatureWorkflowParties.id, d.partyId)).limit(1);
  if (p) {
    await db
      .update(s.signatureWorkflows)
      .set({ status: "declined" })
      .where(eq(s.signatureWorkflows.id, p.workflowId));
  }
  await db.insert(s.auditLog).values({
    tenantId: d.tenantId,
    action: "signature_party_declined",
    entityKind: "signature_party",
    entityId: d.partyId,
    afterJson: { reason: args.reason } as never,
    ipAddress: args.ipAddress ?? undefined,
  });
  return { ok: true };
}
