/**
 * GET /api/cron/reap-tokens
 * Vercel cron. Gated by CRON_SECRET (Bearer header injected by Vercel).
 *
 * Reaps expired sign-in, password-reset and activation tokens so the DB
 * doesn't accumulate dead rows. Single nightly run is enough.
 */
import { NextResponse } from "next/server";
import { lt } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { isAuthorisedCron } from "@/lib/security/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAuthorisedCron(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!dbReady) return NextResponse.json({ ok: true, skipped: "no_db" });

  const now = new Date();
  const [signIn, reset, activation] = await Promise.all([
    db.delete(s.signInTokens).where(lt(s.signInTokens.expiresAt, now)).returning({ id: s.signInTokens.id }),
    db.delete(s.passwordResetTokens).where(lt(s.passwordResetTokens.expiresAt, now)).returning({ id: s.passwordResetTokens.id }),
    db.delete(s.accountActivations).where(lt(s.accountActivations.expiresAt, now)).returning({ id: s.accountActivations.id }),
  ]);
  return NextResponse.json({
    ok: true,
    reaped: { signIn: signIn.length, passwordReset: reset.length, activation: activation.length },
    at: now.toISOString(),
  });
}
