/**
 * One-shot graph warm-up - sweep the firm's matters, companies and
 * contracts into the knowledge_graph_{nodes,edges} tables. Idempotent.
 *
 *   POST /api/kg/project
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { projectAll } from "@/lib/kg/project";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const session = await getSession();
  const result = await projectAll(session);
  await writeAudit(session, {
    action: "kg_projected_all",
    entityKind: "kg",
    afterJson: result,
  });
  return NextResponse.json(result);
}
