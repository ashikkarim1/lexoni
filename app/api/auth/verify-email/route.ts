/**
 * GET /api/auth/verify-email?token=...
 *
 * Validates the activation token, marks the email verified, and
 * redirects to /signin with a success flag the form can show.
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const url = req.nextUrl.clone();
  if (!token) {
    url.pathname = "/signin";
    url.searchParams.set("verify", "missing");
    return NextResponse.redirect(url);
  }
  if (!dbReady) {
    // Demo: no DB, accept any token; show success page.
    url.pathname = "/signin"; url.searchParams.set("verify", "ok");
    return NextResponse.redirect(url);
  }
  const tokenHash = await hashToken(token);
  const [row] = await db
    .select({ id: s.accountActivations.id, email: s.accountActivations.email, expiresAt: s.accountActivations.expiresAt })
    .from(s.accountActivations)
    .where(and(eq(s.accountActivations.tokenHash, tokenHash), isNull(s.accountActivations.verifiedAt)))
    .limit(1);
  if (!row) {
    url.pathname = "/signin"; url.searchParams.set("verify", "invalid");
    return NextResponse.redirect(url);
  }
  if (row.expiresAt.getTime() < Date.now()) {
    await db.update(s.accountActivations).set({ status: "expired" }).where(eq(s.accountActivations.id, row.id));
    url.pathname = "/signin"; url.searchParams.set("verify", "expired");
    return NextResponse.redirect(url);
  }
  await db.update(s.accountActivations).set({ verifiedAt: new Date(), status: "verified" }).where(eq(s.accountActivations.id, row.id));
  // The activation row carries the email + verifiedAt. We deliberately do
  // NOT write to audit_log here because the verifier has no session yet
  // (no userId/tenantId), and crediting STUB_SESSION would be misleading.
  // The downstream sign-in or invite-accept flow records the authenticated
  // user_login event with full attribution.
  url.pathname = "/signin"; url.searchParams.set("verify", "ok");
  return NextResponse.redirect(url);
}
