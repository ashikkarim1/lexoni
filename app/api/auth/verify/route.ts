/**
 * GET /api/auth/verify?token=...
 * Click target of the magic-link email. Verifies + sets the session cookie
 * + redirects to /desk. Errors land on /signin?error=...
 */
import { NextRequest, NextResponse } from "next/server";
import { verifySignInToken } from "@/lib/auth/magic-link";
import { COOKIE_NAME, cookieAttributes, packSessionCookie } from "@/lib/auth/cookie";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token) return NextResponse.redirect(new URL("/signin?error=missing", req.url));

  const result = await verifySignInToken(token);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/signin?error=${result.reason}`, req.url));
  }

  const cookieValue = await packSessionCookie(result.userId, result.tenantId);
  const res = NextResponse.redirect(new URL("/desk", req.url));
  res.headers.append("Set-Cookie", `${COOKIE_NAME}=${cookieValue}; ${cookieAttributes()}`);
  return res;
}
