/**
 * Drizzle client (server-only). Import `db` in server components / route
 * handlers to run live queries against Postgres.
 *
 * IMPORTANT - every query MUST be tenant-scoped. Never query a table that
 * has a `tenant_id` without filtering on the session's tenantId.
 *
 * Serverless connection strategy:
 *   - Vercel functions are stateless. Each cold start opens a new postgres
 *     connection. To avoid pool exhaustion under load we cap each function
 *     to one connection.
 *   - `prepare: false` is required for poolers like PgBouncer / Supabase
 *     transaction pooling. Even on direct connections it's cheap to leave
 *     off; the cost is only a 1-2ms parse per query.
 *   - `idle_timeout: 20` closes idle connections quickly so an idle
 *     function instance doesn't hold a slot.
 *   - `connect_timeout: 10` fails fast on bad DNS / firewall, rather than
 *     hanging the function until Vercel's 10/15/60s timeout kills it.
 *   - Hot-reload-safe: dev keeps the connection on globalThis so HMR
 *     doesn't fork a fresh socket every save.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const url = process.env.DATABASE_URL;

function buildClient() {
  if (!url) return null;
  return postgres(url, {
    prepare: false,           // PgBouncer / pooler compatible
    max: 1,                   // single connection per function instance
    idle_timeout: 20,         // free up pool slots quickly
    connect_timeout: 10,      // fail fast on networking issues
  });
}

// Reuse one connection across hot-reloads in dev. In prod each function
// instance gets its own, capped to a single connection above.
const g = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };
const sql = g.__pg ?? buildClient();
if (process.env.NODE_ENV !== "production" && url && sql) g.__pg = sql;

/**
 * Drizzle handle. Typed as a connected DB so call sites get full inference,
 * but is actually null at runtime when DATABASE_URL is unset - gate every
 * call site on `dbReady` first (server components fall back to lib/mock).
 */
export const db: DB = sql ? drizzle(sql, { schema }) : (null as unknown as DB);
export const dbReady = Boolean(url);
