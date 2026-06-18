/**
 * Route guard.
 *
 * Marketing routes (/, /apply, /signin, /verify-email, /reset-password,
 * /engagement/*, /sign/*, /accept-invite) and Next internals stay public.
 * Dashboard routes require a session cookie; anonymous requests redirect
 * to /signin with a `next=` param so the user lands back where they tried
 * to go after signing in.
 *
 * Security note: this layer only checks the cookie's PRESENCE. The HMAC
 * verification happens at the page layer via lib/auth/cookie.unpackSession,
 * called from lib/auth/session-server.getSession() in every dashboard
 * route's server component. A forged or tampered cookie passes this
 * middleware check but is rejected at the page layer with a session
 * resolution error — the dashboard never renders without a valid session.
 *
 * The middleware bundle is intentionally kept dependency-free (only
 * `next/server`) to avoid Vercel Edge runtime bundling issues we hit when
 * pulling in lib/ modules.
 */
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "lexoni_session";

const PROTECTED_PREFIXES = [
  "/desk", "/matters", "/firm-dashboard", "/conflicts",
  "/intake", "/engagement-letters", "/cases", "/billing", "/collaborators",
  "/ai", "/contracts", "/compliance", "/companies", "/captable", "/governance",
  "/marketplace", "/ma", "/portal", "/integrations", "/gdpr", "/templates",
  "/knowledge", "/document-automation", "/settings", "/pricing",
  "/documents", "/precedents", "/copilot", "/memory", "/growth", "/my",
];

export function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    if (!PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }
    const hasCookie = req.cookies.get(COOKIE_NAME)?.value;
    if (hasCookie) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next|icon.svg|.*\\..*).*)"],
};
