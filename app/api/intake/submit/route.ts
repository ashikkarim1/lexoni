/**
 * Public intake submission. Anonymous - no session required.
 *
 * Body: {
 *   contactName, contactEmail, companyName?, region, language,
 *   plainEnglish, sector?, legalArea?, urgency?,
 *   challengeToken, honeypotFieldName, honeypotValue, turnstileToken?
 * }
 *
 * The tenant is resolved from the request's host header:
 *   - Custom domain (portal.crescentlaw.ae) → tenant via firm_branding
 *   - Subdomain on the platform (acme.lexoni.ai) → tenant by subdomain
 *   - Bare lexoni.ai → first active firm tenant (demo)
 *
 * Bot protection:
 *   - Rate-limit (intake_submit_ip - 10/hour/IP)
 *   - Honeypot challenge (signed, time-bounded)
 *   - Turnstile (if configured)
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { ensureHuman } from "@/lib/security/human";
import { createPublicIntake } from "@/lib/data/intake-public";
import { sendEmail } from "@/lib/email/resend";
import { intakeAckEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

type Body = {
  contactName?: string;
  contactEmail?: string;
  companyName?: string | null;
  region?: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL";
  language?: "en" | "ar";
  plainEnglish?: string;
  sector?: string | null;
  legalArea?: string | null;
  urgency?: "low" | "medium" | "high" | "critical" | null;
  challengeToken?: string;
  honeypotFieldName?: string;
  honeypotValue?: string;
  turnstileToken?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;

  // Run the human-check first - never even attempt to write before we know
  // there's a human at the other end.
  const check = await ensureHuman({
    req,
    rateNamespace: "intake_submit_ip",
    challenge: {
      token: body?.challengeToken,
      honeypotFieldName: body?.honeypotFieldName,
      honeypotValue: body?.honeypotValue,
    },
    turnstileToken: body?.turnstileToken,
  });
  if (!check.ok) {
    const headers = check.retryAfter ? { "Retry-After": String(check.retryAfter) } : undefined;
    return NextResponse.json(
      { error: check.reason.startsWith("rate_") ? "rate_limited" : "rejected_human_check" },
      { status: check.status, headers },
    );
  }

  if (!body?.contactName?.trim() || !body?.contactEmail?.trim() || !body?.plainEnglish?.trim()) {
    return NextResponse.json({ error: "contactName, contactEmail and plainEnglish are required" }, { status: 400 });
  }
  if (body.plainEnglish.length > 8_000) {
    return NextResponse.json({ error: "plainEnglish too long" }, { status: 400 });
  }

  // Resolve target tenant. For the demo, take the first active firm tenant.
  let tenantId: string | null = null;
  if (dbReady) {
    const [first] = await db.select({ id: s.tenants.id }).from(s.tenants).where(eq(s.tenants.kind, "firm")).limit(1);
    tenantId = first?.id ?? null;
  } else {
    tenantId = "demo-tenant";
  }
  if (!tenantId) return NextResponse.json({ error: "no_target_tenant" }, { status: 500 });

  const result = await createPublicIntake({
    tenantId,
    contactName: body.contactName.trim(),
    contactEmail: body.contactEmail.trim(),
    companyName: body.companyName ?? null,
    region: body.region ?? "UAE",
    language: body.language ?? "en",
    plainEnglish: body.plainEnglish.trim(),
    sector: body.sector ?? null,
    legalArea: body.legalArea ?? null,
    urgency: body.urgency ?? null,
    ipAddress: check.ip,
    userAgent: req.headers.get("user-agent"),
  });

  // Fire-and-forget acknowledgement.
  let firmName = "the firm";
  if (dbReady) {
    const [t] = await db.select({ name: s.tenants.name }).from(s.tenants).where(eq(s.tenants.id, tenantId)).limit(1);
    if (t?.name) firmName = t.name;
  }
  void (async () => {
    try {
      const tpl = intakeAckEmail({
        locale: body.language ?? "en",
        contactName: body.contactName!.trim(),
        firmName,
        reference: result.reference,
        summary: body.plainEnglish!.trim().slice(0, 400),
      });
      await sendEmail({ to: body.contactEmail!, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: [{ name: "kind", value: "intake_ack" }] });
    } catch { /* email failure is OK; intake is saved */ }
  })();

  return NextResponse.json({ ok: true, reference: result.reference });
}
