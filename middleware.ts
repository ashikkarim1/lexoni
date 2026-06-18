/**
 * Route guard.
 *
 * The marketing routes (/, /apply, /signin, /engagement/*, /sign/*,
 * /accept-invite) and Next.js internals stay public. Every dashboard
 * route requires a valid signed session cookie OR a demo-account
 * cookie. Anonymous requests redirect to /signin.
 *
 * Anti-pattern guard: NEVER skip auth based on whether DATABASE_URL is
 * set. The demo accounts in `lib/auth/demo-accounts.ts` provide a
 * DB-free way to authenticate; demo mode is no excuse to leave the
 * site open.
 *
 * Set `LEXONI_PUBLIC=1` only if you genuinely want to open the
 * dashboards (e.g. for an automated screenshot run). The default is
 * locked.
 */
import { NextRequest, NextResponse } from "next/server";
// Relative import (not @/lib/...): Vercel's Edge bundler trips on the
// path alias when collecting middleware's module graph.
import { COOKIE_NAME, unpackSessionCookie } from "./lib/auth/cookie";

const PROTECTED_PREFIXES = [
  "/desk", "/matters", "/firm-dashboard", "/conflicts",
  "/intake", "/engagement-letters", "/cases", "/billing", "/collaborators",
  "/ai", "/contracts", "/compliance", "/companies", "/captable", "/governance",
  "/marketplace", "/ma", "/portal", "/integrations", "/gdpr", "/templates",
  "/knowledge", "/document-automation", "/settings", "/pricing",
  "/documents", "/precedents", "/copilot", "/memory", "/growth", "/my",
];

/**
 * Inlined for the Edge runtime (Vercel's middleware analyser rejects deep
 * imports across path aliases). Same behaviour as lib/env.isOpenBypass:
 * LEXONI_PUBLIC=1 is silently ignored in production so we can never ship
 * with the dashboard accidentally exposed.
 */
function openBypass(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.LEXONI_PUBLIC === "1";
}

export async function middleware(req: NextRequest) {
  // Middleware MUST NOT throw — an uncaught exception in middleware takes
  // down every request, including public marketing pages, and the user
  // sees MIDDLEWARE_INVOCATION_FAILED. Wrap the whole body. Worst-case
  // we let the request through and let the page-level guards handle it.
  try {
    const { pathname } = req.nextUrl;
    if (openBypass()) return NextResponse.next();

    if (!PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }

    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    const unpacked = await unpackSessionCookie(cookie).catch(() => null);
    if (unpacked) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[middleware] unexpected error", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next|icon.svg|.*\\..*).*)"],
};
