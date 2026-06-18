/**
 * Append-only audit_log writer.
 *
 * Every mutation in a server route or data helper SHOULD call this so the
 * who/what/when trail is complete (GDPR/UAE-PDPL/KSA-PDPL/SOX-friendly).
 * No-op in mock mode (`dbReady === false`) so the demo UI still works.
 */
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import type { Session } from "@/lib/auth/session";

export async function writeAudit(
  session: Session,
  args: {
    action: string;
    entityKind: string;
    entityId?: string;
    beforeJson?: unknown;
    afterJson?: unknown;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<void> {
  if (!dbReady) return;
  await db.insert(s.auditLog).values({
    tenantId: session.tenantId,
    userId: session.userId,
    action: args.action,
    entityKind: args.entityKind,
    entityId: args.entityId,
    beforeJson: (args.beforeJson ?? null) as never,
    afterJson: (args.afterJson ?? null) as never,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });
}
