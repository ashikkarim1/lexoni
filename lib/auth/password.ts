/**
 * Password hashing + verification.
 *
 * PBKDF2-SHA256 with 100k iterations + 16-byte random salt. Same Web
 * Crypto API as `lib/auth/cookie.ts` so it works in both Edge and Node
 * runtimes (no `node:` imports).
 *
 * Stored format:  `pbkdf2$100000$<salt-b64url>$<hash-b64url>`
 */

const ITERATIONS = 100_000;
const HASH_BITS = 256;
const SALT_BYTES = 16;

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(plain, salt, ITERATIONS, HASH_BITS);
  return `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iters = Number(parts[1]);
  if (!Number.isFinite(iters) || iters < 1000) return false;
  const salt = fromB64url(parts[2]);
  const expected = fromB64url(parts[3]);
  const got = await pbkdf2(plain, salt, iters, expected.length * 8);
  return constantTimeEquals(expected, got);
}

async function pbkdf2(plain: string, salt: Uint8Array, iters: number, bits: number): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plain),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const buf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: iters, hash: "SHA-256" },
    baseKey,
    bits,
  );
  return new Uint8Array(buf);
}

function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array {
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
