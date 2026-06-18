/**
 * Cron-route authorisation helper.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` on scheduled invocations
 * of `/api/cron/*`. Every cron handler must call this and refuse the request
 * if it returns false.
 *
 * Behaviour:
 * - Production: REQUIRE CRON_SECRET. Missing → return false (deny). Mismatch
 *   → return false. Constant-time comparison to avoid timing oracles.
 * - Development: if CRON_SECRET is unset, allow any caller so local manual
 *   triggering works. If it is set, require it.
 *
 * Never silently allow in production. Prior behaviour returned `true` when
 * CRON_SECRET was unset — that meant any anonymous internet caller could
 * trigger token reaping, knowledge reindex, etc.
 */
import { cronSecret, isProd } from "@/lib/env";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function isAuthorisedCron(req: Request): boolean {
  const secret = cronSecret();
  if (!secret) {
    if (isProd()) {
      console.error("[cron] refusing request: CRON_SECRET is not configured");
      return false;
    }
    return true; // dev convenience
  }
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return constantTimeEqual(auth, expected);
}
