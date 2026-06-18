/**
 * Public-facing intake submit. Lives in its own helper because the caller is
 * anonymous — there is no Session. Resolves the target tenant from the
 * request's Host header via lib/auth/tenant.ts in the route layer.
 */
import { randomUUID } from "node:crypto";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export type PublicIntakeInput = {
  tenantId: string;
  contactName: string;
  contactEmail: string;
  companyName?: string | null;
  region: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL";
  language: "en" | "ar";
  plainEnglish: string;
  sector?: string | null;
  legalArea?: string | null;
  urgency?: "low" | "medium" | "high" | "critical" | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type PublicIntakeResult = { id: string; reference: string };

export async function createPublicIntake(input: PublicIntakeInput): Promise<PublicIntakeResult> {
  if (!dbReady) {
    // Demo-mode echo so the form still works on the open-source build.
    return { id: "demo", reference: `INT-DEMO-${Date.now().toString(36).slice(-6).toUpperCase()}` };
  }
  const reference = `INT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const [inserted] = await db.insert(s.intakeRequests).values({
    tenantId: input.tenantId,
    reference,
    contactName: input.contactName,
    contactEmail: input.contactEmail.toLowerCase().trim(),
    companyName: input.companyName ?? null,
    region: input.region,
    language: input.language,
    plainEnglish: input.plainEnglish,
    // Sector / legal area / urgency self-classification arrives later from
    // the AI classifier; the public form only captures free text.
    aiUrgency: input.urgency ?? null,
    consentToContact: true,
    status: "new",
  }).returning({ id: s.intakeRequests.id });
  const id = inserted.id;
  await db.insert(s.auditLog).values({
    tenantId: input.tenantId,
    action: "public_intake_submitted",
    entityKind: "intake",
    entityId: id,
    afterJson: { reference, contactEmail: input.contactEmail } as never,
    ipAddress: input.ipAddress ?? undefined,
    userAgent: input.userAgent ?? undefined,
  });
  return { id, reference };
}
