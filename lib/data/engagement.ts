/**
 * Engagement-letter automation. Live data layer on top of:
 *   • engagement_letters (schema.ts)
 *   • engagement_letter_delivery (schema.process.ts — added in Sprint 7)
 *   • intake_requests (for context when auto-drafting from an intake)
 *
 * Lifecycle:
 *   draft  → sent → viewed → countersigned (client signed) → executed (firm signed)
 *
 * Every state transition writes an audit row + access_log entry where a
 * client touched the letter. Public access uses the opaque `viewToken`; no
 * auth required for the client side.
 */
import { randomBytes, createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/data/audit";
import { sendEmail, appUrl } from "@/lib/email/resend";
import { engagementLetterEmail } from "@/lib/email/templates";
import { draftEngagementLetterAi, type DraftEngagementArgs } from "@/lib/ai/engagement-draft";

export type EngagementRow = {
  id: string;
  status: string;
  scopeOfWork: string;
  feeArrangement: string;
  feeQuoteCents: number | null;
  currency: string;
  bodyMd: string;
  clientName: string | null;
  clientEmail: string | null;
  intakeId: string | null;
  caseId: string | null;
  matterTitle: string | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  signedByClientAt: Date | null;
  signedByFirmAt: Date | null;
  declinedAt: Date | null;
  createdAt: Date;
};

export async function listEngagementLetters(session: Session): Promise<EngagementRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      id: s.engagementLetters.id,
      status: s.engagementLetters.status,
      scopeOfWork: s.engagementLetters.scopeOfWork,
      feeArrangement: s.engagementLetters.feeArrangement,
      feeQuoteCents: s.engagementLetters.feeQuoteCents,
      currency: s.engagementLetters.currency,
      bodyMd: s.engagementLetters.bodyMd,
      intakeId: s.engagementLetters.intakeId,
      caseId: s.engagementLetters.caseId,
      matterTitle: s.cases.title,
      sentAt: s.engagementLetters.sentAt,
      viewedAt: s.engagementLetters.viewedAt,
      signedByClientAt: s.engagementLetters.signedByClientAt,
      signedByFirmAt: s.engagementLetters.signedByFirmAt,
      declinedAt: s.engagementLetters.declinedAt,
      createdAt: s.engagementLetters.createdAt,
      clientName: s.engagementLetterDelivery.clientName,
      clientEmail: s.engagementLetterDelivery.clientEmail,
    })
    .from(s.engagementLetters)
    .leftJoin(s.cases, eq(s.cases.id, s.engagementLetters.caseId))
    .leftJoin(s.engagementLetterDelivery, eq(s.engagementLetterDelivery.engagementLetterId, s.engagementLetters.id))
    .where(tenantScope(session, s.engagementLetters))
    .orderBy(desc(s.engagementLetters.createdAt));
  return rows.map((r) => ({ ...r, status: r.status as string }));
}

export type GenerateInput = {
  intakeId?: string;
  caseId?: string;
  clientName?: string;
  clientEmail?: string;
  clientLanguage?: "en" | "ar";
  scopeOverride?: string;
  feeArrangement?: DraftEngagementArgs["feeArrangement"];
  feeQuoteUsd?: number;
  currency?: "AED" | "SAR" | "USD";
};

export async function generateEngagementLetter(
  session: Session,
  input: GenerateInput,
): Promise<{ id: string; status: "draft"; generatedBy: "ai" | "stub" } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };

  let clientName = input.clientName?.trim() ?? "";
  let clientEmail = input.clientEmail?.trim().toLowerCase() ?? "";
  let region: "UAE" | "KSA" = session.region === "KSA" ? "KSA" : "UAE";
  let legalFunction = "general";
  let sector: string | undefined;
  let intakeSummary: string | undefined;
  let language: "en" | "ar" = input.clientLanguage ?? (session.locale === "ar" ? "ar" : "en");
  let intakeId: string | undefined;
  let caseId: string | undefined;
  let jurisdiction = region === "KSA" ? "MISA" : "DIFC";

  if (input.intakeId) {
    const [intake] = await db
      .select()
      .from(s.intakeRequests)
      .where(and(tenantScope(session, s.intakeRequests), eq(s.intakeRequests.id, input.intakeId)))
      .limit(1);
    if (!intake) return { error: "intake_not_found" };
    clientName = clientName || intake.companyName || intake.contactName;
    clientEmail = clientEmail || intake.contactEmail.toLowerCase();
    region = (intake.region as "UAE" | "KSA") ?? region;
    language = (intake.language as "en" | "ar") ?? language;
    legalFunction = (intake.legalFunction ?? intake.aiFunction ?? "general") as string;
    sector = (intake.sector ?? intake.aiSector ?? undefined) as string | undefined;
    intakeSummary = intake.plainEnglish;
    intakeId = intake.id;
  }
  if (input.caseId) {
    const [c] = await db
      .select()
      .from(s.cases)
      .where(and(tenantScope(session, s.cases), eq(s.cases.id, input.caseId)))
      .limit(1);
    if (!c) return { error: "case_not_found" };
    region = (c.region as "UAE" | "KSA") ?? region;
    jurisdiction = c.jurisdiction ?? jurisdiction;
    caseId = c.id;
  }
  if (!clientName || !clientEmail) return { error: "client_name_and_email_required" };

  const feeArrangement = input.feeArrangement ?? "hourly";
  const feeQuoteUsd = input.feeQuoteUsd ?? 30000;
  const currency: "AED" | "SAR" | "USD" = input.currency ?? (region === "KSA" ? "SAR" : "AED");

  // Optional firm template — pick the most recent matching region/function/language.
  const tmpl = await db
    .select({ body: s.engagementTemplates.bodyMd })
    .from(s.engagementTemplates)
    .where(
      and(
        tenantScope(session, s.engagementTemplates),
        eq(s.engagementTemplates.isCurrent, true),
        eq(s.engagementTemplates.region, region),
      ),
    )
    .limit(1);

  const draft = await draftEngagementLetterAi({
    firmName: session.tenantName,
    clientName,
    region,
    legalFunction,
    sector,
    intakeSummary,
    feeArrangement,
    feeQuoteUsd,
    currency,
    jurisdiction,
    language,
    firmTemplateBody: tmpl[0]?.body,
  });

  const scope = input.scopeOverride?.trim() || draft.scopeOfWork;
  const feeQuoteCents = Math.round(feeQuoteUsd * 100);

  const [row] = await db.insert(s.engagementLetters).values({
    tenantId: session.tenantId,
    intakeId,
    caseId,
    scopeOfWork: scope,
    feeArrangement,
    feeQuoteCents,
    currency,
    bodyMd: draft.bodyMd,
    version: 1,
    isCurrent: true,
    status: "draft",
  }).returning({ id: s.engagementLetters.id });

  const token = randomBytes(24).toString("base64url");
  await db.insert(s.engagementLetterDelivery).values({
    tenantId: session.tenantId,
    engagementLetterId: row.id,
    viewToken: token,
    clientEmail,
    clientName,
  });

  await writeAudit(session, {
    action: "engagement_letter_drafted",
    entityKind: "engagement_letter",
    entityId: row.id,
    afterJson: { intakeId, caseId, clientEmail, clientName, region, feeArrangement, feeQuoteCents, generatedBy: draft.generatedBy },
  });

  return { id: row.id, status: "draft", generatedBy: draft.generatedBy };
}

/** Mark the letter sent and email it to the client. */
export async function sendEngagementLetter(
  session: Session,
  engagementId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };

  const [eng] = await db
    .select({
      id: s.engagementLetters.id,
      status: s.engagementLetters.status,
      bodyMd: s.engagementLetters.bodyMd,
      feeArrangement: s.engagementLetters.feeArrangement,
      currency: s.engagementLetters.currency,
      feeQuoteCents: s.engagementLetters.feeQuoteCents,
      scope: s.engagementLetters.scopeOfWork,
      clientName: s.engagementLetterDelivery.clientName,
      clientEmail: s.engagementLetterDelivery.clientEmail,
      viewToken: s.engagementLetterDelivery.viewToken,
    })
    .from(s.engagementLetters)
    .innerJoin(s.engagementLetterDelivery, eq(s.engagementLetterDelivery.engagementLetterId, s.engagementLetters.id))
    .where(and(tenantScope(session, s.engagementLetters), eq(s.engagementLetters.id, engagementId)))
    .limit(1);
  if (!eng) return { error: "not_found" };

  await db
    .update(s.engagementLetters)
    .set({ status: "sent", sentAt: new Date() })
    .where(and(tenantScope(session, s.engagementLetters), eq(s.engagementLetters.id, engagementId)));

  const url = `${appUrl()}/engagement/${eng.viewToken}`;
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: eng.currency, maximumFractionDigits: 0 }).format((eng.feeQuoteCents ?? 0) / 100);
  const inviteeLocale: "en" | "ar" = session.locale === "ar" ? "ar" : "en";
  const tpl = engagementLetterEmail({
    locale: inviteeLocale,
    clientName: eng.clientName,
    firmName: session.tenantName,
    scope: eng.scope,
    feeArrangement: eng.feeArrangement,
    amount,
    viewUrl: url,
  });
  const sent = await sendEmail({
    to: eng.clientEmail,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [{ name: "kind", value: "engagement_letter" }],
  });

  await writeAudit(session, {
    action: "engagement_letter_sent",
    entityKind: "engagement_letter",
    entityId: engagementId,
    afterJson: { to: eng.clientEmail, sent: "ok" in sent && sent.ok, skipped: "skipped" in sent, error: "error" in sent ? sent.error : undefined },
  });

  return { ok: true };
}

/** Counter-sign by the firm — moves status to executed. Auto-converts intake
 *  to a case if one isn't linked yet. */
export async function firmSignEngagementLetter(
  session: Session,
  engagementId: string,
): Promise<{ ok: true; caseId?: string } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };

  const [eng] = await db
    .select()
    .from(s.engagementLetters)
    .where(and(tenantScope(session, s.engagementLetters), eq(s.engagementLetters.id, engagementId)))
    .limit(1);
  if (!eng) return { error: "not_found" };
  if (eng.status !== "countersigned") return { error: "not_client_signed_yet" };

  // Create the matter if the engagement letter started from an intake.
  let caseId = eng.caseId ?? undefined;
  if (!caseId && eng.intakeId) {
    const [intake] = await db.select().from(s.intakeRequests).where(eq(s.intakeRequests.id, eng.intakeId)).limit(1);
    if (intake) {
      // Auto-generated matter number for the demo.
      const matterNumber = `${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const fn = (intake.aiFunction ?? intake.legalFunction ?? "advisory").replace(/_/g, " ");
      const [c] = await db.insert(s.cases).values({
        tenantId: session.tenantId,
        matterNumber,
        title: `${intake.companyName} — ${fn}`,
        matterType: "corporate",
        status: "open",
        region: intake.region as never,
        jurisdiction: session.region === "KSA" ? "MISA" : "DIFC",
        description: `${intake.companyName} · Auto-opened from intake ${intake.reference}.`,
        feeArrangement: eng.feeArrangement,
        leadLawyerId: session.userId,
      }).returning({ id: s.cases.id });
      caseId = c.id;
      await db
        .update(s.intakeRequests)
        .set({ status: "engaged", caseId })
        .where(eq(s.intakeRequests.id, eng.intakeId));
    }
  }

  await db
    .update(s.engagementLetters)
    .set({
      status: "executed",
      signedByFirmAt: new Date(),
      caseId,
    })
    .where(and(tenantScope(session, s.engagementLetters), eq(s.engagementLetters.id, engagementId)));

  await writeAudit(session, {
    action: "engagement_letter_firm_signed",
    entityKind: "engagement_letter",
    entityId: engagementId,
    afterJson: { signerUserId: session.userId, caseId },
  });

  return { ok: true, caseId };
}

// ─────────────────────────── PUBLIC (no auth) ───────────────────────────

export type PublicEngagementView = {
  id: string;
  status: string;
  bodyMd: string;
  clientName: string;
  firmName: string;
  feeArrangement: string;
  currency: string;
  feeQuoteCents: number | null;
  signedByClient: boolean;
  declined: boolean;
};

export async function publicLookupByToken(token: string): Promise<PublicEngagementView | null> {
  if (!dbReady) return null;
  const [row] = await db
    .select({
      id: s.engagementLetters.id,
      status: s.engagementLetters.status,
      bodyMd: s.engagementLetters.bodyMd,
      feeArrangement: s.engagementLetters.feeArrangement,
      currency: s.engagementLetters.currency,
      feeQuoteCents: s.engagementLetters.feeQuoteCents,
      signedByClientAt: s.engagementLetters.signedByClientAt,
      declinedAt: s.engagementLetters.declinedAt,
      clientName: s.engagementLetterDelivery.clientName,
      firmName: s.tenants.name,
    })
    .from(s.engagementLetterDelivery)
    .innerJoin(s.engagementLetters, eq(s.engagementLetters.id, s.engagementLetterDelivery.engagementLetterId))
    .innerJoin(s.tenants, eq(s.tenants.id, s.engagementLetterDelivery.tenantId))
    .where(eq(s.engagementLetterDelivery.viewToken, token))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    bodyMd: row.bodyMd,
    clientName: row.clientName,
    firmName: row.firmName,
    feeArrangement: row.feeArrangement,
    currency: row.currency,
    feeQuoteCents: row.feeQuoteCents,
    signedByClient: !!row.signedByClientAt,
    declined: !!row.declinedAt,
  };
}

/** Mark the letter viewed the first time the client opens the public link. */
export async function publicMarkViewed(token: string, ipAddress: string | null, userAgent: string | null): Promise<void> {
  if (!dbReady) return;
  const [delivery] = await db
    .select({ engagementLetterId: s.engagementLetterDelivery.engagementLetterId, tenantId: s.engagementLetterDelivery.tenantId })
    .from(s.engagementLetterDelivery)
    .where(eq(s.engagementLetterDelivery.viewToken, token))
    .limit(1);
  if (!delivery) return;
  await db
    .update(s.engagementLetters)
    .set({ status: "viewed", viewedAt: new Date(), clientIp: ipAddress ?? undefined, clientUserAgent: userAgent ?? undefined })
    .where(
      and(
        eq(s.engagementLetters.id, delivery.engagementLetterId),
        eq(s.engagementLetters.status, "sent"),
      ),
    );
  await db.insert(s.auditLog).values({
    tenantId: delivery.tenantId,
    action: "engagement_letter_viewed",
    entityKind: "engagement_letter",
    entityId: delivery.engagementLetterId,
    ipAddress: ipAddress ?? undefined,
    userAgent: userAgent ?? undefined,
  });
}

/** Client signs the letter. Generates a tamper-evident certificate hash. */
export async function publicClientSign(
  token: string,
  args: { signerName: string; ipAddress: string | null; userAgent: string | null },
): Promise<{ ok: true } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };
  const [delivery] = await db
    .select({ engagementLetterId: s.engagementLetterDelivery.engagementLetterId, tenantId: s.engagementLetterDelivery.tenantId })
    .from(s.engagementLetterDelivery)
    .where(eq(s.engagementLetterDelivery.viewToken, token))
    .limit(1);
  if (!delivery) return { error: "not_found" };

  const [eng] = await db.select().from(s.engagementLetters).where(eq(s.engagementLetters.id, delivery.engagementLetterId)).limit(1);
  if (!eng) return { error: "not_found" };
  if (eng.status === "executed" || eng.status === "declined") return { error: "already_finalised" };

  const now = new Date();
  const certInput = `${eng.id}|${args.signerName}|${args.ipAddress ?? ""}|${args.userAgent ?? ""}|${now.toISOString()}|${eng.bodyMd}`;
  const certHash = createHash("sha256").update(certInput).digest("hex");

  await db
    .update(s.engagementLetters)
    .set({
      status: "countersigned",
      signedByClientAt: now,
      clientIp: args.ipAddress ?? undefined,
      clientUserAgent: args.userAgent ?? undefined,
      signatureCertHash: certHash,
    })
    .where(eq(s.engagementLetters.id, eng.id));

  await db.insert(s.auditLog).values({
    tenantId: delivery.tenantId,
    action: "engagement_letter_client_signed",
    entityKind: "engagement_letter",
    entityId: eng.id,
    afterJson: { signerName: args.signerName, certHash } as never,
    ipAddress: args.ipAddress ?? undefined,
    userAgent: args.userAgent ?? undefined,
  });

  return { ok: true };
}

export async function publicClientDecline(
  token: string,
  args: { reason: string; ipAddress: string | null; userAgent: string | null },
): Promise<{ ok: true } | { error: string }> {
  if (!dbReady) return { error: "db_unavailable" };
  const [delivery] = await db
    .select({ engagementLetterId: s.engagementLetterDelivery.engagementLetterId, tenantId: s.engagementLetterDelivery.tenantId })
    .from(s.engagementLetterDelivery)
    .where(eq(s.engagementLetterDelivery.viewToken, token))
    .limit(1);
  if (!delivery) return { error: "not_found" };
  await db
    .update(s.engagementLetters)
    .set({ status: "declined", declinedAt: new Date() })
    .where(eq(s.engagementLetters.id, delivery.engagementLetterId));
  await db.insert(s.auditLog).values({
    tenantId: delivery.tenantId,
    action: "engagement_letter_declined",
    entityKind: "engagement_letter",
    entityId: delivery.engagementLetterId,
    afterJson: { reason: args.reason } as never,
    ipAddress: args.ipAddress ?? undefined,
    userAgent: args.userAgent ?? undefined,
  });
  return { ok: true };
}
