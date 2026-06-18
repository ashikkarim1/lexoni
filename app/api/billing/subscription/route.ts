import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session-server";
import { setSubscriptionPlan } from "@/lib/data/billing";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { planId?: string } | null;
  if (!body?.planId) return NextResponse.json({ error: "planId required" }, { status: 400 });
  const session = await getSession();
  if (session.role !== "firm_admin" && session.role !== "platform_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await setSubscriptionPlan(session, body.planId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { subscriptionId?: string; reason?: string; note?: string } | null;
  if (!body?.subscriptionId) return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
  const session = await getSession();
  if (session.role !== "firm_admin" && session.role !== "platform_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!dbReady) {
    await writeAudit(session, {
      action: "subscription_cancellation_requested_offline",
      entityKind: "subscription",
      entityId: body.subscriptionId,
      afterJson: { reason: body.reason ?? null, note: body.note ?? null },
    });
    return NextResponse.json({ ok: true, offline: true });
  }
  await db
    .update(s.subscriptions)
    .set({ status: "cancelled" })
    .where(eq(s.subscriptions.id, body.subscriptionId));
  await writeAudit(session, {
    action: "subscription_cancelled",
    entityKind: "subscription",
    entityId: body.subscriptionId,
    afterJson: { reason: body.reason ?? null, note: body.note ?? null },
  });
  return NextResponse.json({ ok: true });
}
