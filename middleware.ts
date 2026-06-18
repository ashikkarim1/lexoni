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
import { COOKIE_NAME, unpackSessionCookie } from "@/lib/auth/cookie";
import { isOpenBypass } from "@/lib/env";

const PROTECTED_PREFIXES = [
  "/desk", "/matters", "/firm-dashboard", "/conflicts",
  "/intake", "/engagement-letters", "/cases", "/billing", "/collaborators",
  "/ai", "/contracts", "/compliance", "/companies", "/captable", "/governance",
  "/marketplace", "/ma", "/portal", "/integrations", "/gdpr", "/templates",
  "/knowledge", "/document-automation", "/settings", "/pricing",
  "/documents", "/precedents", "/copilot", "/memory", "/growth", "/my",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // isOpenBypass() returns false in production regardless of env, so the
  // dashboard cannot be accidentally opened to the public internet.
  if (isOpenBypass()) return NextResponse.next();

  if (!PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const unpacked = await unpackSessionCookie(cookie);
  if (unpacked) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/signin";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|icon.svg|.*\\..*).*)"],
};
