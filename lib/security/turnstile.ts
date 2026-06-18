/**
 * Cloudflare Turnstile — server-side verification.
 *
 * Turnstile is Cloudflare's CAPTCHA replacement: invisible by default, only
 * shows a challenge when behaviour looks bot-like. The client widget posts
 * back a single-use token; we verify it against
 * https://challenges.cloudflare.com/turnstile/v0/siteverify with the secret.
 *
 * Env keys (set in .env.local in prod):
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — public, embedded in the page
 *   TURNSTILE_SECRET_KEY            — private, server-only
 *
 * If keys are not set (dev / open-source contributors), this helper returns
 * { ok: true, mode: "unconfigured" } so the demo still works. The other
 * layers (honeypot + rate-limit) still run, so the site is never fully open.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true; mode: "verified" | "unconfigured"; hostname?: string }
  | { ok: false; mode: "missing_token" | "rejected" | "network_error"; reason?: string };

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;
}

export function turnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export async function verifyTurnstile(token: string | null | undefined, opts: { ip?: string | null } = {}): Promise<TurnstileResult> {
  if (!turnstileConfigured()) return { ok: true, mode: "unconfigured" };
  if (!token) return { ok: false, mode: "missing_token" };
  try {
    const form = new URLSearchParams();
    form.set("secret", process.env.TURNSTILE_SECRET_KEY!);
    form.set("response", token);
    if (opts.ip) form.set("remoteip", opts.ip);
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      // Don't hang the request indefinitely; Cloudflare is normally < 200 ms.
      signal: AbortSignal.timeout(5000),
    });
    const json = (await res.json()) as { success: boolean; hostname?: string; "error-codes"?: string[] };
    if (json.success) return { ok: true, mode: "verified", hostname: json.hostname };
    return { ok: false, mode: "rejected", reason: (json["error-codes"] ?? []).join(",") || "rejected" };
  } catch (e) {
    return { ok: false, mode: "network_error", reason: e instanceof Error ? e.message : "unknown" };
  }
}
