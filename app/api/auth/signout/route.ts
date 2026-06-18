import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, cookieAttributes } from "@/lib/auth/cookie";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/signin?signedout=1", req.url));
  res.headers.append("Set-Cookie", `${COOKIE_NAME}=; ${cookieAttributes(0)}`);
  return res;
}
export async function GET(req: NextRequest) { return POST(req); }
