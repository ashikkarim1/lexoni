# Security — bot protection on public surfaces

> Public POST endpoints — intake, sign-in, engagement signing, signature
> signing, invite acceptance — are protected by **three independent layers**.
> A bot has to defeat all three to reach the data layer. The site is never
> fully open to anonymous traffic, even when Turnstile isn't configured.

## The three layers

### 1. Rate limit (always on)
[lib/security/ratelimit.ts](../lib/security/ratelimit.ts) implements an
in-memory token-bucket. Keyed buckets:

| Namespace          | Capacity | Refill              | Used by                       |
|--------------------|----------|---------------------|-------------------------------|
| `signin_ip`        | 5        | 5 / hour            | `/api/auth/signin`            |
| `signin_email`     | 5        | 5 / hour            | `/api/auth/signin` (per email) |
| `intake_submit_ip` | 10       | 10 / hour           | `/api/intake/submit`          |
| `public_sign_ip`   | 30       | 30 / hour           | `/api/engagement/client-sign`, `/api/signatures/sign` |
| `invite_accept_ip` | 10       | 10 / hour           | `/api/invites/accept`         |
| `challenge_ip`     | 60       | 60 / minute         | `/api/security/challenge`     |

The bucket is process-local. For multi-instance prod, swap `STORE` for a
Redis adapter (same interface) — every limit value carries through
untouched.

### 2. Signed honeypot challenge (always on)
[lib/security/honeypot.ts](../lib/security/honeypot.ts) issues a short-lived
HMAC-signed token via `/api/security/challenge`. Clients embed the token in
their form. The server verifies on submit that:
- the HMAC validates against `AUTH_SECRET`
- the token is **≤ 5 minutes old**
- the form was submitted **≥ 2 seconds after issuance** (humans take time
  to fill a form; head-bots submit instantly)
- a hidden honeypot field with a randomised name is **empty** (bots that
  auto-fill every named input populate it)

This works with no third-party service and no JavaScript on the client
beyond a `fetch` to retrieve the challenge.

### 3. Cloudflare Turnstile (when configured)
[lib/security/turnstile.ts](../lib/security/turnstile.ts) verifies the
`cf-turnstile-response` token server-side against
`challenges.cloudflare.com/turnstile/v0/siteverify`.

Turnstile is **invisible by default** — most legitimate users never see
a challenge. When traffic looks bot-like, Turnstile escalates to a
non-interactive challenge or, last-resort, a click-the-image puzzle.

Configure with:
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...   # public, embedded in the page
TURNSTILE_SECRET_KEY=...             # server-only
```

Sign up: <https://www.cloudflare.com/products/turnstile/> — free, no card.

When EITHER key is missing, the widget is skipped and layers (1) and (2)
still gate everything. There is no path through the front door without
clearing rate-limit + honeypot.

## The composite check

[lib/security/human.ts](../lib/security/human.ts) is the only function the
API routes call:

```ts
const check = await ensureHuman({
  req,
  rateNamespace: "signin_ip",
  identifier: body.email,   // optional secondary bucket
  challenge: { token, honeypotFieldName, honeypotValue },
  turnstileToken,
});
if (!check.ok) {
  return NextResponse.json(
    { error: check.reason.startsWith("rate_") ? "rate_limited" : "rejected_human_check" },
    { status: check.status, headers: check.retryAfter ? { "Retry-After": String(check.retryAfter) } : undefined },
  );
}
```

Order of operations (cheapest → most expensive):
1. Rate-limit per IP and per optional secondary identifier
2. Honeypot verification (no network call)
3. Turnstile verification (one network call, ≤ 5 s timeout)

## Where it's wired

| Public surface              | Form component                              | API route                              |
|-----------------------------|---------------------------------------------|----------------------------------------|
| `/apply` (intake)           | `app/(portal)/apply/ApplyForm.tsx`          | `/api/intake/submit`                   |
| `/signin` (magic link)      | `app/signin/SignInForm.tsx`                 | `/api/auth/signin`                     |
| `/engagement/[token]`       | `app/engagement/[token]/SignActions.tsx`    | `/api/engagement/client-sign`          |
| `/sign/[token]`             | `app/sign/[token]/PartySignActions.tsx`     | `/api/signatures/sign`                 |
| `/accept-invite`            | `app/accept-invite/AcceptForm.tsx`          | `/api/invites/accept`                  |

Every form imports `<HumanCheck>` from `components/security/HumanCheck.tsx`
and submits the bundle alongside the form payload. Every API route calls
`ensureHuman` BEFORE touching the data layer.

## What a bot sees today

- POST `/api/auth/signin` with no challenge → **400 rejected_human_check**
- POST with a bad-signature challenge → **400 rejected_human_check**
- POST with an expired challenge → **400 rejected_human_check**
- Same IP burst on `/api/auth/signin` → **429 with Retry-After** after 5 attempts/hour
- Same email targeted from many IPs → **429** after 5 / hour on the email bucket
- Same IP burst on `/api/intake/submit` → **429** after 10 / hour
- Filled hidden honeypot field → **400 rejected_human_check (honeypot_filled)**
- Form submitted within 2 s of page load → **400 rejected_human_check (too_fast)**

## Tuning

Adjust limits in `lib/security/ratelimit.ts`. The honeypot timing constants
live at the top of `lib/security/honeypot.ts` (`MAX_AGE_S`, `MIN_AGE_S`).
Turn off Turnstile by unsetting either env var. Restart needed when the
secret changes; bucket state survives module reloads via `globalThis`.

## Future hardening

- Swap `STORE` for Redis when there's > 1 server instance
- Add a `severity` bump in the rate-limit when prior attempts on the same
  IP/email have been rejected (currently every attempt costs one token)
- Wire CSP + Permissions-Policy headers in `middleware.ts` to cut down
  XSS attack surface for the few public pages
- Add bot.management heuristics (UA reputation, IP-ASN scoring) at the
  rate-limit layer once we move to Cloudflare Workers
