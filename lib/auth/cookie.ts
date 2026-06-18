/**
 * Signed-cookie helpers. The cookie value is
 *   base64url(userId|tenantId|exp|HMAC(SHA-256, secret, "userId|tenantId|exp"))
 *
 * Cookie name: lexoni_session, HttpOnly, SameSite=Lax, Secure in production.
 * Expiry: 30 days.
 *
 * Uses the Web Crypto API (`crypto.subtle`) which is available in both the
 * Edge runtime (middleware.ts) and the Node runtime (server components,
 * route handlers). Tampering is detected by recomputing the HMAC; mismatch
 * → null session.
 */

import { authSecret } from "@/lib/env";

export const COOKIE_NAME = "lexoni_session";
const COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60;

function secret(): string {
  return authSecret();
}

async function hmacSha256(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return base64UrlFromBytes(new Uint8Array(sig));
}

export async function packSessionCookie(userId: string, tenantId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_S;
  const payload = `${userId}|${tenantId}|${exp}`;
  const sig = await hmacSha256(payload);
  return base64UrlFromBytes(new TextEncoder().encode(`${payload}|${sig}`));
}

export type UnpackedSession = { userId: string; tenantId: string; exp: number };

export async function unpackSessionCookie(cookie: string | undefined): Promise<UnpackedSession | null> {
  if (!cookie) return null;
  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(cookie));
    const parts = decoded.split("|");
    if (parts.length !== 4) return null;
    const [userId, tenantId, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!Number.isFinite(exp)) return null;
    if (exp * 1000 < Date.now()) return null;
    const recomputed = await hmacSha256(`${userId}|${tenantId}|${exp}`);
    if (recomputed !== sig) return null;
    return { userId, tenantId, exp };
  } catch {
    return null;
  }
}

export function cookieAttributes(maxAgeSeconds: number = COOKIE_MAX_AGE_S): string {
  const parts = [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

// ────────────────────────────────────────────────────────────────
// base64url helpers — work on both Edge and Node without polyfills
// ────────────────────────────────────────────────────────────────
function base64UrlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  // btoa is available in both Edge and Node 16+
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
