/**
 * Server-issued honeypot challenge — works without any third-party service.
 *
 * The challenge is a base64url-encoded JSON {issuedAt, nonce} signed with
 * an HMAC keyed on AUTH_SECRET. The client form embeds:
 *   - the challenge token in a visible hidden field (the server checks the HMAC)
 *   - a honeypot field with a randomised name that humans never see; bots
 *     filling every form field will populate it
 *
 * The server verifies on submission:
 *   1. The challenge token's HMAC validates → no replay across sessions.
 *   2. The token isn't older than MAX_AGE_S (5 min) and not newer than NOW
 *      (clock skew tolerance: 5 s).
 *   3. The form was submitted ≥ MIN_AGE_S after issuance — humans take time
 *      to fill a form; head-bots submit instantly.
 *   4. The honeypot field is empty.
 *
 * Same Web Crypto API as lib/auth/cookie.ts so it works in both Edge and
 * Node runtimes. No node:* imports.
 */

const MAX_AGE_S = 5 * 60;
const MIN_AGE_S = 2;          // human reaction floor
const CLOCK_SKEW_S = 5;

const DEV_FALLBACK = "lexoni-dev-secret-rotate-me-in-production";

/**
 * Inlined for Edge-runtime compatibility (see lib/auth/cookie.ts). Same
 * behaviour as lib/env.authSecret: missing-in-prod is fatal.
 */
function secret(): string {
  const v = process.env.AUTH_SECRET;
  if (v && v.length >= 16) return v;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not set in production.");
  }
  return DEV_FALLBACK;
}

async function hmacSha256(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64UrlFromBytes(new Uint8Array(sig));
}

export type HoneypotChallenge = {
  token: string;            // signed token to submit back
  honeypotFieldName: string; // randomised field name; bots fill it, humans don't
};

/** Generate a fresh challenge. Used by the server component renderer + the
 *  /api/security/challenge route for client-side dynamic forms. */
export async function generateChallenge(): Promise<HoneypotChallenge> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const nonce = b64UrlFromBytes(crypto.getRandomValues(new Uint8Array(12)));
  const payload = `${issuedAt}.${nonce}`;
  const sig = await hmacSha256(payload);
  const token = `${payload}.${sig}`;
  // Field name is deterministic from the nonce so client + server see the same name.
  const honeypotFieldName = `cf_${nonce.replace(/[-_]/g, "").slice(0, 10)}`;
  return { token, honeypotFieldName };
}

export type VerifyHoneypotInput = {
  token: string | null | undefined;
  honeypotValue: string | null | undefined;
  honeypotFieldName: string | null | undefined;
};

export type VerifyHoneypotResult =
  | { ok: true }
  | { ok: false; reason: "missing_token" | "malformed_token" | "bad_signature" | "expired" | "too_fast" | "honeypot_filled" | "field_name_mismatch" };

export async function verifyHoneypot(input: VerifyHoneypotInput): Promise<VerifyHoneypotResult> {
  if (!input.token) return { ok: false, reason: "missing_token" };
  const parts = input.token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed_token" };
  const [issuedAtStr, nonce, sig] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return { ok: false, reason: "malformed_token" };
  const expected = await hmacSha256(`${issuedAtStr}.${nonce}`);
  if (expected !== sig) return { ok: false, reason: "bad_signature" };

  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAt > MAX_AGE_S || now - issuedAt < -CLOCK_SKEW_S) return { ok: false, reason: "expired" };
  if (now - issuedAt < MIN_AGE_S) return { ok: false, reason: "too_fast" };

  // Field-name binding — proves the client read the issued challenge.
  const expectedFieldName = `cf_${nonce.replace(/[-_]/g, "").slice(0, 10)}`;
  if (input.honeypotFieldName && input.honeypotFieldName !== expectedFieldName) {
    return { ok: false, reason: "field_name_mismatch" };
  }
  if (input.honeypotValue && input.honeypotValue.length > 0) {
    return { ok: false, reason: "honeypot_filled" };
  }
  return { ok: true };
}

function b64UrlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
