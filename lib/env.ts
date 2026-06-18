/**
 * Env validation + secret accessors.
 *
 * In production (NODE_ENV=production) the secret accessors THROW if the
 * variable is missing. That fails the request hard instead of silently
 * accepting a known fallback value (which would let anyone with the source
 * code forge cookies, challenge tokens, or call cron endpoints).
 *
 * In development the same accessors return a stable dev fallback so the
 * app boots without a .env. The dev fallback is intentionally well-known —
 * it MUST NOT match a value an attacker would expect to work in prod.
 *
 * Edge-runtime-safe: no node:* imports, only process.env.
 */

const DEV_AUTH_FALLBACK = "lexoni-dev-secret-rotate-me-in-production";

export const isProd = (): boolean => process.env.NODE_ENV === "production";

/**
 * The signing secret for session cookies + honeypot challenges + any other
 * HMAC. Required in production.
 */
export function authSecret(): string {
  const v = process.env.AUTH_SECRET;
  if (v && v.length >= 16) return v;
  if (isProd()) {
    throw new Error(
      "AUTH_SECRET is not set (or is too short). Set it in Vercel Project → " +
      "Settings → Environment Variables. Generate one with `openssl rand -base64 32`.",
    );
  }
  return DEV_AUTH_FALLBACK;
}

/**
 * The Vercel cron Bearer token. When missing in production, cron endpoints
 * must reject every request (treat as misconfigured). When missing in dev,
 * cron endpoints accept any caller so local triggering still works.
 */
export function cronSecret(): string | null {
  const v = process.env.CRON_SECRET;
  if (v && v.length >= 16) return v;
  if (isProd()) {
    // In prod we return null and the caller MUST refuse the request.
    return null;
  }
  return null;
}

/**
 * Public base URL — used for emailed links (reset password, magic links,
 * activation, invoices). Required in production so links point to the right
 * host; dev defaults to localhost.
 */
export function appUrl(): string {
  const v = process.env.NEXT_PUBLIC_APP_URL;
  if (v && /^https?:\/\//i.test(v)) return v.replace(/\/$/, "");
  if (isProd()) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set. Set it to the production origin (e.g. https://lexoni.ai).");
  }
  return "http://localhost:3000";
}

/**
 * Hard guard against accidentally shipping with the dashboard publicly
 * exposed. LEXONI_PUBLIC=1 only takes effect outside of production.
 * In production it is silently ignored.
 */
export function isOpenBypass(): boolean {
  if (isProd()) return false;
  return process.env.LEXONI_PUBLIC === "1";
}

/**
 * Boot-time env summary. Logged once from a server entry point so deploy
 * logs make it obvious whether the deploy is fully configured.
 */
export function envHealth(): { ok: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) missing.push("AUTH_SECRET");
  if (!process.env.NEXT_PUBLIC_APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
  if (!process.env.DATABASE_URL) warnings.push("DATABASE_URL not set — running on mock data only");
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 16) warnings.push("CRON_SECRET not set — cron endpoints will reject every request in production");
  if (!process.env.ANTHROPIC_API_KEY) warnings.push("ANTHROPIC_API_KEY not set — AI features use deterministic fallbacks");
  if (!process.env.RESEND_API_KEY) warnings.push("RESEND_API_KEY not set — transactional email sends are no-ops");
  if (!process.env.TURNSTILE_SECRET_KEY) warnings.push("TURNSTILE_SECRET_KEY not set — public forms rely on honeypot + rate-limit only");

  return { ok: missing.length === 0, missing, warnings };
}
