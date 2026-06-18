import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { recordPayment } from "@/lib/data/billing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { invoiceId?: string; amountCents?: number; method?: string; reference?: string } | null;
  if (!body?.invoiceId || !body.amountCents || !body.method) {
    return NextResponse.json({ error: "invoiceId + amountCents + method required" }, { status: 400 });
  }
  const session = await getSession();
  const r = await recordPayment(session, body as { invoiceId: string; amountCents: number; method: string; reference?: string });
  if ("error" in r) return NextResponse.json(r, { status: 400 });
  return NextResponse.json(r);
}
