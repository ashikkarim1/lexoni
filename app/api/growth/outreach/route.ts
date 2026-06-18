import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { draftOutreachLetter } from "@/lib/ai/outreach";
import { draftOutreach, sendOutreach, markOutreach } from "@/lib/data/outreach";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getSession();
  const body = await req.json();
  try {
    if (body?.draftForProspectId) {
      const out = await draftFor(session, body.draftForProspectId, body.targetKind ?? "licensing_regulatory", body.hookUpdateId ?? null);
      return NextResponse.json(out);
    }
    if (body?.sendId) {
      const out = await sendOutreach(session, body.sendId);
      return NextResponse.json(out);
    }
    return NextResponse.json({ error: "no action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id + status required" }, { status: 400 });
  try {
    await markOutreach(session, id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

async function draftFor(session: Awaited<ReturnType<typeof getSession>>, prospectId: string, targetKind: string, hookUpdateId: string | null) {
  if (!dbReady) throw new Error("DATABASE_URL not configured");
  const [prospect] = await db
    .select({
      legalName: s.bdProspects.legalName,
      industry: s.bdProspects.industry,
      region: s.bdProspects.region,
      contactName: s.bdProspects.contactName,
      contactRole: s.bdProspects.contactRole,
    })
    .from(s.bdProspects)
    .where(eq(s.bdProspects.id, prospectId))
    .limit(1);
  if (!prospect) throw new Error("prospect not found");

  let hook = null as Awaited<ReturnType<typeof draftOutreachLetter>>["grounding"]["hook"] extends infer T ? T : never;
  let hookObj: Parameters<typeof draftOutreachLetter>[1]["hook"] = null;
  if (hookUpdateId) {
    const [u] = await db.select().from(s.regulatoryUpdates).where(eq(s.regulatoryUpdates.id, hookUpdateId)).limit(1);
    if (u) {
      const days = (u.extractedJson as { deadlineDays?: number } | null)?.deadlineDays;
      hookObj = { regulator: u.regulator, title: u.title, publishedAt: u.publishedAt, deadlineDays: days };
    }
  }

  const drafted = await draftOutreachLetter(session, {
    prospect: { legalName: prospect.legalName, industry: prospect.industry, region: prospect.region, contactName: prospect.contactName, contactRole: prospect.contactRole },
    hook: hookObj,
    targetKind,
  });

  const out = await draftOutreach(session, {
    prospectId,
    subject: drafted.subject,
    bodyText: drafted.bodyText,
    bodyHtml: drafted.bodyHtml,
    groundingJson: drafted.grounding,
  });
  void hook;
  return { id: out.id, draft: drafted };
}
