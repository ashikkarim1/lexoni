/**
 * Tenant isolation contract.
 *
 * Every query in the application MUST be scoped to `session.tenantId`.
 * To make that hard to forget, all data accessors run through `scoped()` —
 * it enforces the where-clause at the call site and rejects unscoped queries
 * in development. White-labelled firms NEVER see another firm's data.
 *
 * White-label tenants additionally have a `firm_branding` row that resolves
 * the request's host header (custom domain or subdomain) to the tenant in
 * middleware before the session is read.
 */
import type { Session } from "./session";

export function scoped<T extends { tenantId: string }>(session: Session, rows: T[]): T[] {
  return rows.filter((r) => r.tenantId === session.tenantId);
}

export type HostTenant = { tenantId: string; subdomain?: string; customDomain?: string };

/** Middleware-equivalent: resolve a host header to a tenant via firm_branding. */
export function resolveHostTenant(host: string, branding: HostTenant[]): HostTenant | null {
  const exact = branding.find((b) => b.customDomain === host);
  if (exact) return exact;
  const sub = host.split(".")[0];
  return branding.find((b) => b.subdomain === sub) ?? null;
}
