import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { askMemory } from "@/lib/ai/memory";
import { writeAudit } from "@/lib/data/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  const { question } = (await req.json()) as { question: string };
  if (!question?.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  const answer = await askMemory(session, question);
  await writeAudit(session, {
    action: "memory_question",
    entityKind: "memory",
    afterJson: { question, citations: answer.citations.length, model: answer.modelLabel },
  });
  return NextResponse.json(answer);
}
