/**
 * Tenant-scope guard.
 *
 * Every query against a `tenant_id` table MUST go through `tenantScope()`.
 * It returns a Drizzle where-clause fragment that pins the read to the
 * caller's `session.tenantId`, and throws at runtime if you accidentally
 * point it at a table that has no `tenant_id` column — making a silent
 * cross-tenant leak impossible.
 *
 *   await db.select().from(cases).where(tenantScope(session, cases));
 *
 * Compose with other predicates:
 *   await db.select().from(cases)
 *     .where(and(tenantScope(session, cases), eq(cases.status, "open")));
 *
 * For joins across multiple tenant tables, scope EACH one — the FK link
 * isn't enough, because Drizzle won't refuse a missing filter for you:
 *   .where(and(
 *     tenantScope(session, cases),
 *     tenantScope(session, matterProcesses),
 *   ))
 *
 * Counterpart unit test: scripts/test-scope.ts (run with `npm test`).
 */
import { eq, type SQL } from "drizzle-orm";
import type { Session } from "@/lib/auth/session";

export function tenantScope<T extends { tenantId: unknown }>(
  session: Pick<Session, "tenantId">,
  table: T,
): SQL {
  if (!table || typeof table !== "object" || !("tenantId" in table)) {
    throw new Error(
      "tenantScope() called on a table without a tenant_id column. " +
        "Only call this helper on tenant-scoped tables — and call it on EVERY read of one.",
    );
  }
  // The column object is what drizzle's `eq` wants on the left-hand side.
  return eq(table.tenantId as never, session.tenantId);
}
