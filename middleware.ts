/**
 * Minimal middleware — used to isolate whether MIDDLEWARE_INVOCATION_FAILED
 * is caused by our cookie/auth logic or by something deeper in the build.
 *
 * No external imports beyond next/server. No cookie parsing. No env reads.
 * Just check the protected prefix list and redirect anonymous requests to
 * /signin based on a single cookie name. If this still 500s, the issue is
 * not in our code at all.
 *
 * Auth correctness is preserved: dashboard routes still redirect to /signin
 * if no session cookie is present. We're just not verifying the HMAC at the
 * middleware layer for now — the page-level getSession() does that.
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
