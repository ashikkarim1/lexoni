import { desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type IntakeRow = {
  id: string;
  reference: string;
  contactName: string;
  contactEmail: string;
  companyName: string | null;
  region: string;
  language: string;
  plainEnglish: string;
  aiSector: string | null;
  aiFunction: string | null;
  aiConfidence: number | null;
  aiUrgency: string | null;
  status: string;
  routedToName: string | null;
  createdAt: Date;
};

export async function listIntakes(session: Session): Promise<IntakeRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.intakeRequests.id,
      reference: s.intakeRequests.reference,
      contactName: s.intakeRequests.contactName,
      contactEmail: s.intakeRequests.contactEmail,
      companyName: s.intakeRequests.companyName,
      region: s.intakeRequests.region,
      language: s.intakeRequests.language,
      plainEnglish: s.intakeRequests.plainEnglish,
      aiSector: s.intakeRequests.aiSector,
      aiFunction: s.intakeRequests.aiFunction,
      aiConfidence: s.intakeRequests.aiConfidence,
      aiUrgency: s.intakeRequests.aiUrgency,
      status: s.intakeRequests.status,
      routedToName: s.users.fullName,
      createdAt: s.intakeRequests.createdAt,
    })
    .from(s.intakeRequests)
    .leftJoin(s.users, eq(s.users.id, s.intakeRequests.routedToUserId))
    .where(tenantScope(session, s.intakeRequests))
    .orderBy(desc(s.intakeRequests.createdAt));
}
