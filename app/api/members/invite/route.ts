import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-server";
import { inviteMember, type MemberRole } from "@/lib/data/members";

export const runtime = "nodejs";

const ROLES: MemberRole[] = ["firm_admin", "lawyer", "lawyer_helper", "client_admin", "client_member", "client_viewer"];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string; fullName?: string; role?: string; reportsToUserId?: string; hourlyRateCents?: number } | null;
  if (!body?.email || !ROLES.includes(body.role as MemberRole)) {
    return NextResponse.json({ error: "email + valid role required" }, { status: 400 });
  }
  const session = await getSession();
  const result = await inviteMember(session, {
    email: body.email,
    fullName: body.fullName,
    role: body.role as MemberRole,
    reportsToUserId: body.reportsToUserId,
    hourlyRateCents: body.hourlyRateCents,
  });
  if ("error" in result) return NextResponse.json(result, { status: result.error === "already_member" ? 409 : 400 });
  return NextResponse.json({ id: result.id });
}
