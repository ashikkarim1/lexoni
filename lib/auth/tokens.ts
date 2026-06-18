/**
 * Short-lived single-use auth tokens (password reset + account activation).
 *
 * Same security pattern as the magic-link tokens:
 *   - 32 random bytes encoded base64url -> the URL token
 *   - SHA-256 of the URL token stored in the DB (we never persist the live token)
 *   - On verify: hash the submitted token, look up by hash, check expiry, mark used
 *
 * Pure Web Crypto API so this works in both Edge and Node runtimes.
 */

export const ACTIVATION_TTL_S = 24 * 60 * 60;      // 24 hours
export const PASSWORD_RESET_TTL_S = 60 * 60;       // 1 hour

export type IssuedToken = { token: string; tokenHash: string; expiresAt: Date };

export async function issueToken(ttlSeconds: number): Promise<IssuedToken> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = b64url(bytes);
  const tokenHash = await sha256Hex(token);
  return { token, tokenHash, expiresAt: new Date(Date.now() + ttlSeconds * 1000) };
}

export async function hashToken(token: string): Promise<string> {
  return sha256Hex(token);
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
