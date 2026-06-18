/**
 * Composite "is the actor a human" check used by every public POST.
 *
 * Order of operations (cheapest → most expensive):
 *   1. Rate-limit (per IP, per optional secondary identifier like email)
 *   2. Honeypot challenge verification (no network call)
 *   3. Cloudflare Turnstile verification (one network call)
 *
 * Any failure short-circuits. Every check writes a structured `reason` so
 * the audit log + the API client get the same explanation.
 */
import { ipFromRequest, rateLimitCheck, type RATE_LIMITS } from "@/lib/security/ratelimit";
import { verifyHoneypot } from "@/lib/security/honeypot";
import { verifyTurnstile, turnstileConfigured } from "@/lib/security/turnstile";

export type HumanCheckInput = {
  /** The Next.js Request — used for IP extraction. */
  req: Request;
  /** Which rate-limit namespace to charge. */
  rateNamespace: keyof typeof RATE_LIMITS;
  /** Optional secondary identifier (an email, a tenant id, a token) to
   *  cap per-target abuse. When provided, both ip and identifier are
   *  charged so the limit is the lower of the two. */
  identifier?: string | null;
  /** Honeypot bundle delivered by the client. */
  challenge: {
    token?: string | null;
    honeypotValue?: string | null;
    honeypotFieldName?: string | null;
  };
  /** Cloudflare Turnstile token (`cf-turnstile-response`) — optional when
   *  Turnstile is unconfigured. */
  turnstileToken?: string | null;
};

export type HumanCheckResult =
  | { ok: true; ip: string }
  | { ok: false; reason: string; status: number; retryAfter?: number };

export async function ensureHuman(input: HumanCheckInput): Promise<HumanCheckResult> {
  const ip = ipFromRequest(input.req);

  // 1. Per-IP rate-limit.
  const ipCheck = rateLimitCheck(input.rateNamespace, ip);
  if (!ipCheck.ok) {
    return { ok: false, reason: "rate_limit_ip", status: 429, retryAfter: ipCheck.retryAfterSeconds };
  }
  // Per-identifier rate-limit if there's a secondary key (e.g. email for signin).
  if (input.identifier) {
    const idKey: keyof typeof RATE_LIMITS | null =
      input.rateNamespace === "signin_ip" ? "signin_email" : null;
    if (idKey) {
      const idCheck = rateLimitCheck(idKey, input.identifier.toLowerCase().trim());
      if (!idCheck.ok) {
        return { ok: false, reason: "rate_limit_identifier", status: 429, retryAfter: idCheck.retryAfterSeconds };
      }
    }
  }

  // 2. Honeypot.
  const hp = await verifyHoneypot({
    token: input.challenge.token,
    honeypotValue: input.challenge.honeypotValue,
    honeypotFieldName: input.challenge.honeypotFieldName,
  });
  if (!hp.ok) {
    return { ok: false, reason: `honeypot_${hp.reason}`, status: 400 };
  }

  // 3. Turnstile.
  if (turnstileConfigured()) {
    const ts = await verifyTurnstile(input.turnstileToken ?? null, { ip });
    if (!ts.ok) {
      return { ok: false, reason: `turnstile_${ts.mode}`, status: ts.mode === "missing_token" ? 400 : 403 };
    }
  }

  return { ok: true, ip };
}
