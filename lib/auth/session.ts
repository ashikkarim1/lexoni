/**
 * Session types + role helpers. CLIENT-SAFE: this file must NEVER import
 * server-only modules (Drizzle, postgres, env-dependent code) because it is
 * pulled into client components (Sidebar/Topbar) via `canSee` and the
 * `Session` type. The DB-resolving `getSession()` lives in
 * `lib/auth/session-server.ts` and is imported only from server components
 * and route handlers.
 */
import type { Locale } from "@/lib/i18n";

export type Role =
  | "platform_admin"
  | "firm_admin"
  | "lawyer"
  | "lawyer_helper"
  | "client_admin"
  | "client_member"
  | "client_viewer";

export type TenantKind = "firm" | "client" | "ops";

export type Session = {
  userId: string;
  fullName: string;
  email: string;
  locale: Locale;
  tenantId: string;
  tenantName: string;
  tenantKind: TenantKind;
  role: Role;
  region: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL";
};

export const STUB_SESSION: Session = {
  userId: "u_demo",
  fullName: "Sara Al-Mansoori",
  email: "sara@levant-legal.ae",
  locale: "en",
  tenantId: "t_levant",
  tenantName: "Levant Legal Partners",
  tenantKind: "firm",
  role: "firm_admin",
  region: "UAE",
};

export const canSee = (session: Session, path: string): boolean => {
  if (session.role === "platform_admin") return true;
  const firmOnly = ["/firm-dashboard", "/billing", "/cases", "/marketplace"];
  if (session.tenantKind === "client" && firmOnly.some((p) => path.startsWith(p))) return false;
  if (session.role === "lawyer_helper" && path.startsWith("/billing/reports")) return false;
  return true;
};
