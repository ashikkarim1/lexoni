import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { indexAll } from "@/lib/knowledge";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const session = await getSession();
  const result = await indexAll(session);
  await writeAudit(session, {
    action: "memory_reindex",
    entityKind: "memory",
    afterJson: result,
  });
  return NextResponse.json(result);
}
