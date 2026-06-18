/**
 * Token-bucket rate limit.
 *
 * Default backend is process-local (Map<string, Bucket>). Works in single-
 * instance dev. For production behind multiple Next.js processes, replace
 * `STORE` with a Redis-backed adapter (slot below) — same interface.
 *
 * Buckets are keyed by namespace + identifier:
 *   - ipBucket("signin", req.ip)       — slow down per-IP brute force
 *   - emailBucket("signin", email)     — slow down per-target email bombing
 *   - actionBucket("intake_submit")    — global circuit-breaker
 *
 * Sliding window equivalent via leaky-bucket math: capacity tokens replenished
 * at refillPerSecond. A request consumes one token. If consume < 0 → rejected.
 */

export type Bucket = { tokens: number; updatedAt: number; capacity: number; refillPerSecond: number };

const STORE: Map<string, Bucket> = (() => {
  const g = globalThis as unknown as { __lexoniRateStore?: Map<string, Bucket>; __lexoniRateWarned?: boolean };
  if (!g.__lexoniRateStore) g.__lexoniRateStore = new Map();
  // Warn once per process so operators know the limiter is per-instance on
  // serverless. The signed honeypot + Turnstile still mitigate brute force;
  // the limiter just doesn't aggregate across lambda instances. Replace
  // STORE with a Redis/KV adapter for strict global enforcement.
  if (process.env.NODE_ENV === "production" && !g.__lexoniRateWarned) {
    g.__lexoniRateWarned = true;
    console.warn("[ratelimit] in-memory store. On Vercel each lambda has its own bucket; configured per-IP limits multiply by concurrent instance count. Wire Upstash/Vercel KV here for strict global enforcement.");
  }
  return g.__lexoniRateStore;
})();

export type RateLimitConfig = {
  capacity: number;          // max requests in a burst
  refillPerSecond: number;   // refill rate
};

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  /** Magic-link sign-in: 5 / hour per IP, 5 / hour per email. */
  signin_ip:        { capacity: 5,  refillPerSecond: 5 / 3600 },
  signin_email:     { capacity: 5,  refillPerSecond: 5 / 3600 },

  /** Public intake submissions: 10 / hour per IP. */
  intake_submit_ip: { capacity: 10, refillPerSecond: 10 / 3600 },

  /** Engagement / signature sign endpoints (token-gated but rate-cap anyway). */
  public_sign_ip:   { capacity: 30, refillPerSecond: 30 / 3600 },

  /** Invite acceptance: 10 / hour per IP. */
  invite_accept_ip: { capacity: 10, refillPerSecond: 10 / 3600 },

  /** Catch-all bot-check endpoint (challenge issuance): 60 / minute / IP. */
  challenge_ip:     { capacity: 60, refillPerSecond: 1 },
};

export function rateLimitCheck(namespace: keyof typeof RATE_LIMITS, identifier: string): { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number } {
  if (!identifier) return { ok: true, remaining: 0 };
  const cfg = RATE_LIMITS[namespace];
  if (!cfg) throw new Error(`unknown rate limit namespace: ${namespace}`);
  const key = `${namespace}:${identifier}`;
  const now = Date.now();
  let b = STORE.get(key);
  if (!b) {
    b = { tokens: cfg.capacity, updatedAt: now, capacity: cfg.capacity, refillPerSecond: cfg.refillPerSecond };
    STORE.set(key, b);
  } else {
    const elapsedS = (now - b.updatedAt) / 1000;
    b.tokens = Math.min(cfg.capacity, b.tokens + elapsedS * cfg.refillPerSecond);
    b.updatedAt = now;
  }
  if (b.tokens < 1) {
    const need = 1 - b.tokens;
    return { ok: false, retryAfterSeconds: Math.ceil(need / cfg.refillPerSecond) };
  }
  b.tokens -= 1;
  return { ok: true, remaining: Math.floor(b.tokens) };
}

/** Best-effort IP extraction from a Next.js request. Returns "anon" when no
 *  trustworthy IP is available (which we still rate-limit, but on a shared
 *  bucket — better than no limit). */
export function ipFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() ?? "anon";
}
