/**
 * Resend transactional email layer.
 *
 *   - Reads the API key from RESEND_API_KEY. **Never** hard-coded.
 *   - From-address defaults to `Lexoni.ai <noreply@lexoni.ai>` unless
 *     RESEND_FROM is set. While your domain is still pending verification in
 *     Resend, set `RESEND_FROM="onboarding@resend.dev"` so messages go out
 *     under Resend's verified sandbox sender.
 *   - When the key is absent (e.g. local dev with no key), `sendEmail()`
 *     no-ops and returns `{ skipped: true }` — every caller treats email as
 *     best-effort; the underlying business mutation succeeds regardless.
 */
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const client = apiKey ? new Resend(apiKey) : null;

const DEFAULT_FROM = process.env.RESEND_FROM ?? "Lexoni.ai <noreply@lexoni.ai>";

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | { skipped: true; reason: "no_api_key" };

export async function sendEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<SendResult> {
  if (!client) return { skipped: true, reason: "no_api_key" };
  try {
    const result = await client.emails.send({
      from: args.from ?? DEFAULT_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
      tags: args.tags,
    });
    if (result.error) return { ok: false, error: result.error.message ?? "send_failed" };
    return { ok: true, id: result.data?.id ?? "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send_failed" };
  }
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}
