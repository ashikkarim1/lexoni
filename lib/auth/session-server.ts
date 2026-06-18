/**
 * Server-only session resolver. Three sources, in priority order:
 *   1. Signed `lexoni_session` cookie (real auth from Sprint 10).
 *   2. Cached `__session` on globalThis (dev convenience).
 *   3. The hard-coded demo STUB_SESSION, with seeded user/tenant UUIDs
 *      resolved from the DB so writes hit valid FKs.
 *
 * The cookie path is preferred whenever it's present — protected routes
 * redirect anonymous requests to /signin (see middleware.ts). Demo mode
 * remains useful when the DB has been seeded but no user has signed in yet.
 *
 * DO NOT import this from a "use client" file — it pulls in postgres-js.
 */
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { COOKIE_NAME, unpackSessionCookie } from "@/lib/auth/cookie";
import { STUB_SESSION, type Session } from "./session";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { isProd } from "@/lib/env";

/**
 * In production the STUB_SESSION fallback is fatal — it would credit a real
 * audit log entry to the demo user, or worse, let a missing-cookie request
 * pretend to be a real lawyer in a tenant they don't belong to. The middleware
 * blocks dashboard routes by signed-cookie, but API routes also call
 * getSession() and they must be just as strict.
 */
function refuseAnonymousInProd(): Session {
  if (isProd()) {
    throw new Error("getSession: no valid session cookie. The caller must be authenticated in production.");
  }
  return STUB_SESSION;
}

export async function getSession(): Promise<Session> {
  // 1. Cookie-backed session (real auth).
  const jar = cookies();
  const cookie = jar.get(COOKIE_NAME)?.value;
  const unpacked = await unpackSessionCookie(cookie);
  if (unpacked) {
    // 1a. Demo account session — works without DB.
    const demo = DEMO_ACCOUNTS.find((a) => a.userId === unpacked.userId);
    if (demo) {
      return {
        userId: demo.userId,
        fullName: demo.fullName,
        email: demo.email,
        locale: "en",
        tenantId: demo.tenantId,
        tenantName: "Levant Legal Partners",
        tenantKind: "firm",
        region: "UAE",
        role: demo.role,
      };
    }
    if (dbReady) {
      const resolved = await loadSessionForUser(unpacked.userId, unpacked.tenantId);
      if (resolved) return resolved;
    }
  }

  // 2. Dev cache. In production we never fall through to STUB_SESSION.
  if (!dbReady) return refuseAnonymousInProd();
  const g = globalThis as { __session?: Session };
  if (g.__session) return g.__session;

  // 3. Demo stub resolved against the seed (dev convenience only).
  if (isProd()) return refuseAnonymousInProd();

  const [user] = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(eq(s.users.email, STUB_SESSION.email))
    .limit(1);
  const [tenant] = await db
    .select({ id: s.tenants.id })
    .from(s.tenants)
    .where(eq(s.tenants.name, STUB_SESSION.tenantName))
    .limit(1);

  if (!user || !tenant) return STUB_SESSION;
  const resolved: Session = { ...STUB_SESSION, userId: user.id, tenantId: tenant.id };
  g.__session = resolved;
  return resolved;
}

async function loadSessionForUser(userId: string, tenantId: string): Promise<Session | null> {
  const [user] = await db
    .select({ id: s.users.id, fullName: s.users.fullName, email: s.users.email, locale: s.users.locale })
    .from(s.users)
    .where(eq(s.users.id, userId))
    .limit(1);
  if (!user) return null;
  const [tenant] = await db
    .select({ id: s.tenants.id, name: s.tenants.name, kind: s.tenants.kind, region: s.tenants.region })
    .from(s.tenants)
    .where(eq(s.tenants.id, tenantId))
    .limit(1);
  if (!tenant) return null;
  const [membership] = await db
    .select({ role: s.memberships.role })
    .from(s.memberships)
    .where(eq(s.memberships.userId, userId))
    .limit(1);
  return {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    locale: (user.locale === "ar" ? "ar" : "en"),
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantKind: tenant.kind as Session["tenantKind"],
    region: tenant.region as Session["region"],
    role: (membership?.role ?? "lawyer") as Session["role"],
  };
}
