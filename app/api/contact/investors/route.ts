/**
 * POST /api/contact/investors  { intent, name, email, firm?, note? }
 *
 * Sends the message to the founder via Resend.
 *   intent in {investor, trial, advisor}
 *
 * Always replies 200 unless the form is malformed, so the public form
 * does not leak whether Resend is configured.
 */
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

const OWNER_EMAIL = "ceo@theupcapital.com";
const OWNER_NAME = "Ashik Karim";

type Body = {
  intent: "investor" | "trial" | "advisor";
  name: string;
  email: string;
  firm?: string;
  note?: string;
};

const SUBJECT: Record<Body["intent"], string> = {
  investor: "Lexoni - investor enquiry",
  trial:    "Lexoni - 14-day trial enquiry",
  advisor:  "Lexoni - advisory council enquiry",
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.email?.includes("@") || !body?.name?.trim() || !body?.intent) {
    return NextResponse.json({ error: "name, email, intent required" }, { status: 400 });
  }

  const headline = body.intent === "investor"
    ? "Investor reach-out via lexoni.ai/investors"
    : body.intent === "trial"
      ? "Trial enquiry via lexoni.ai/investors"
      : "Advisory council reach-out via lexoni.ai/investors";

  const text = [
    headline,
    "",
    `Name: ${body.name.trim()}`,
    `Email: ${body.email.trim()}`,
    body.firm?.trim() ? `Firm / fund: ${body.firm.trim()}` : null,
    "",
    "Note:",
    (body.note?.trim() || "(no note)"),
  ].filter(Boolean).join("\n");

  const html = `
<p>${headline}</p>
<p><strong>Name:</strong> ${escapeHtml(body.name.trim())}<br/>
<strong>Email:</strong> <a href="mailto:${escapeHtml(body.email.trim())}">${escapeHtml(body.email.trim())}</a>
${body.firm?.trim() ? `<br/><strong>Firm / fund:</strong> ${escapeHtml(body.firm.trim())}` : ""}</p>
<p><strong>Note:</strong></p>
<blockquote style="border-left:3px solid #6366f1;padding:6px 12px;color:#475569;">
  ${escapeHtml(body.note?.trim() || "(no note)")}
</blockquote>
<p style="color:#94a3b8;font-size:12px;">From the investors page. Reply directly to the sender; this routes through Resend on behalf of noreply@lexoni.ai.</p>`;

  await sendEmail({
    to: OWNER_EMAIL,
    subject: SUBJECT[body.intent],
    text, html,
    replyTo: body.email.trim(),
    tags: [{ name: "kind", value: `investor_reach_${body.intent}` }],
  });

  return NextResponse.json({ ok: true, owner: OWNER_NAME });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" :
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === "\"" ? "&quot;" : "&#39;");
}
