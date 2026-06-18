import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { sendReminder } from "@/lib/data/collections";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  const { invoiceId } = (await req.json()) as { invoiceId: string };
  if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
  try {
    const out = await sendReminder(session, invoiceId);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
