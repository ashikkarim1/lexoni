# Deployment guide — GitHub + Vercel

End-to-end deployment for **Lexoni.ai** to Vercel under the `ashikkarim1`
GitHub account. Follow top to bottom; each step is independent so if
something fails, fix it in place and resume.

---

## 1. Push the repo to GitHub (`ashikkarim1`)

```bash
# from /Users/test/Documents/Claude/Projects/LegalAI/legalos
git init                                      # if not already a repo
git add .
git commit -m "Initial commit - Lexoni.ai"

# create an empty repo on github.com/ashikkarim1 named "lexoni" first
git remote add origin git@github.com:ashikkarim1/lexoni.git
git branch -M main
git push -u origin main
```

If SSH isn't set up, use HTTPS with a personal access token instead:
`git remote add origin https://github.com/ashikkarim1/lexoni.git`

---

## 2. Provision the database (Neon)

Free tier is enough for the first pilots.

1. Sign up at <https://neon.tech> with the same Google account you use for
   GitHub.
2. Create project **`lexoni-prod`** → region **`eu-central-1`** (Frankfurt;
   closest free region to GCC) or **`me-central-1`** if it shows up.
3. From the dashboard, copy the **pooled** connection string. Looks like:
   ```
   postgres://USER:PASS@HOST/lexoni?sslmode=require&pgbouncer=true
   ```
4. Save it; you'll paste it into Vercel in step 4.
5. From your local machine, push the schema:
   ```bash
   DATABASE_URL='<paste-the-pooled-string>' npm run db:push
   DATABASE_URL='<paste-the-pooled-string>' npm run seed       # demo data
   DATABASE_URL='<paste-the-pooled-string>' npm run seed:packs # process packs
   ```

---

## 3. Connect Vercel to the repo

1. Sign in at <https://vercel.com> with the same GitHub account
   (`ashikkarim1`). Vercel will offer GitHub OAuth — accept.
2. Click **Add New → Project**.
3. Pick `ashikkarim1/lexoni` from the import list.
4. Framework preset auto-detects **Next.js**. Build command and output dir
   are correct by default. **Do not change them.**
5. Region is set by `vercel.json` to **`fra1`** (Frankfurt). Lowest latency
   to the GCC for both the Anthropic API and Neon. Don't override.
6. Click **Deploy** with empty env vars; the first deploy will fail at
   runtime due to missing env, but the project will exist for the next
   steps.

---

## 4. Set environment variables

Project → **Settings → Environment Variables**. Add all to **Production**
(tick **Preview** + **Development** for the non-secret ones).

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | the Neon pooled string from step 2 | Required |
| `ANTHROPIC_API_KEY` | from <https://console.anthropic.com> | Required for live Copilot / Memory / Regulatory / classifier |
| `RESEND_API_KEY` | from <https://resend.com/api-keys> | Required for all transactional email |
| `RESEND_FROM` | `Lexoni.ai <noreply@lexoni.ai>` | Verified domain (step 5) |
| `AUTH_SECRET` | `openssl rand -base64 32` output | Required. Rotates all sessions when changed |
| `NEXT_PUBLIC_APP_URL` | `https://lexoni.ai` | Used in emails + SEO canonicals |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | from <https://www.cloudflare.com/products/turnstile/> | Optional but recommended |
| `TURNSTILE_SECRET_KEY` | from Cloudflare | Optional, paired with the above |
| `CRON_SECRET` | `openssl rand -base64 32` output | Required for cron auth |

Click **Save** for each. Vercel will offer to redeploy at the end.

---

## 5. Verify your domain in Resend

This is what makes `noreply@lexoni.ai` send instead of bouncing.

1. <https://resend.com> → **Domains → Add Domain** → `lexoni.ai`.
2. Resend gives you a set of DNS records (`MX`, `SPF`, `DKIM`, `DMARC`).
3. Add them at your DNS provider for `lexoni.ai`.
4. Click **Verify** in Resend. Takes 1-5 minutes after DNS propagates.
5. Once verified, the `RESEND_FROM=Lexoni.ai <noreply@lexoni.ai>` env var
   actually sends.

---

## 6. Attach the custom domain

Vercel **Project → Settings → Domains** → add `lexoni.ai` and `www.lexoni.ai`.

Vercel gives you either two `A` records or one `CNAME` to add at your DNS
provider. Add them. SSL provisions automatically within a couple of
minutes.

After DNS resolves, hit `https://lexoni.ai` — should land on the landing
page with valid SSL.

---

## 7. Redeploy to pick up env + domain

Project → **Deployments → ⋯ → Redeploy** (or push a tiny commit to `main`).
After the build finishes:

- Visit `https://lexoni.ai/` — should 200.
- Visit `https://lexoni.ai/sitemap.xml` — should return XML.
- Visit `https://lexoni.ai/robots.txt` — should return the allow/disallow list.
- Sign in at `https://lexoni.ai/signin` with one of the demo accounts:
  - `ceo@theupcapital.com` / `Lexoniworks1`
  - `firm@lexoni.ai` / `Lexoniworks1`
  - `lawyer@lexoni.ai` / `Lexoniworks1`

---

## 8. Confirm cron jobs are scheduled

Vercel **Project → Settings → Crons**. You should see three rows from
`vercel.json`:

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/reap-tokens` | `0 3 * * *` | Daily 03:00 UTC. Delete expired auth tokens. |
| `/api/cron/compliance-reconcile` | `30 6 * * *` | Daily 06:30 UTC (10:30 Dubai). Mark overdue filings. |
| `/api/cron/reindex-knowledge` | `0 4 * * 0` | Weekly Sundays 04:00 UTC. Reindex chunks. |

Manually trigger each once from the Vercel UI to confirm they work. Should
return `{ "ok": true, ... }`.

---

## 9. Submit to Google + Bing (optional but do it day 1)

Follow the earlier walkthrough or:

- Google Search Console → add property → DNS TXT verify → submit
  `https://lexoni.ai/sitemap.xml`.
- Bing Webmaster Tools → import from Search Console.

---

## What costs what

The full stack runs at ~$0/month for the first 90 days of pilots:

| Service | Tier | Cost |
|---|---|---|
| Vercel | Hobby (until you outgrow it) | $0 |
| Neon Postgres | Free | $0 (3 GB) |
| Resend | Free | $0 (3k emails/mo) |
| Cloudflare Turnstile | Free | $0 |
| Anthropic API | Pay-as-you-go | ~$50-150/mo for 3 pilot firms |
| Domain `lexoni.ai` | Annual | $10-20/year |

**Watch the Anthropic bill.** Memory + Copilot + Regulatory all call the
model on demand. Set a monthly cap in the Anthropic console.

Upgrade to Vercel **Pro** ($20/mo) once you have a paying firm — Pro
unlocks fra1 priority + better function limits.

---

## Things to monitor weekly (5 minutes)

- Vercel dashboard → **Usage**. Watch function invocations + bandwidth.
- Neon → **Compute hours** + **Storage**. Free tier auto-suspends idle.
- Anthropic → **Usage** chart. Set a spend alert at $100.
- Resend → **Analytics** → bounces + complaints.
- Google Search Console → **Pages indexed** + **Queries** report.

---

## Rollback

Any deploy can be reverted instantly. Project → **Deployments** → find a
previous good build → **⋯ → Promote to Production**. SSL keeps working.

---

## Pre-deployment hardening checklist

Run this before every production deploy. Most items are enforced by the code
(missing env → app fails to start). Treat the rest as deploy-time discipline.

### Secrets (enforced by `lib/env.ts`)

The app refuses to boot in production if these are missing or too short:

- [ ] **AUTH_SECRET** — `openssl rand -base64 32`. Signs session cookies and
      honeypot challenges. **Rotating this invalidates every session.**
- [ ] **NEXT_PUBLIC_APP_URL** — set to `https://lexoni.ai` (no trailing slash).
      Used in every emailed link.
- [ ] **CRON_SECRET** — `openssl rand -base64 32`. Vercel sends this as a
      Bearer token on every `/api/cron/*` invocation. **Missing in production
      = every cron request is rejected** (intentional — better to silently
      not reap tokens than to let the internet trigger reaps).

Strongly recommended:

- [ ] **DATABASE_URL** — Neon pooled connection string (host ends in
      `-pooler`). Without it the app runs on mock data only.
- [ ] **ANTHROPIC_API_KEY** — Copilot / Memory / Regulatory / Document
      classifier all fall back to deterministic stubs without it.
- [ ] **RESEND_API_KEY** + **RESEND_FROM** — invites, password resets,
      activation links, invoice emails. Without these every send is a silent
      no-op. Verify `lexoni.ai` as a sending domain (SPF + DKIM + DMARC).
- [ ] **TURNSTILE_SECRET_KEY** + **NEXT_PUBLIC_TURNSTILE_SITE_KEY** — bot
      protection on every public form. Without these the layered defences
      (signed honeypot + rate-limit) still run.

Optional / DO NOT SET:

- [ ] **LEXONI_PUBLIC** — opens dashboard routes without authentication.
      `lib/env.ts` ignores this in production regardless of the value.
      Use only for screenshot automation in dev/preview environments.

### Code-level checks

- [ ] `npm run typecheck` clean
- [ ] `npm test` passes (tenant scope + wall enforcement)
- [ ] No new entries under `app/api/cron/*` skip `isAuthorisedCron(req)`
- [ ] No `process.env.AUTH_SECRET` references with a `??` fallback —
      always go through `authSecret()` in `lib/env.ts`
- [ ] No new `writeAudit(STUB_SESSION, ...)` calls — every audit row must
      be credited to a real session

### Headers + indexing

Verified on first deploy by hitting the production URL:

- [ ] `curl -I https://lexoni.ai/` shows `Strict-Transport-Security`,
      `Content-Security-Policy`, `X-Frame-Options: DENY`, and a 200
- [ ] `curl -I https://lexoni.ai/signin` returns
      `X-Robots-Tag: noindex, nofollow`
- [ ] `https://lexoni.ai/sitemap.xml` lists only public marketing routes
      (`/`, `/investors`, `/privacy`, `/terms`, `/apply`)
- [ ] `https://lexoni.ai/robots.txt` disallows `/api/`, `/desk`, etc.

### Cron sanity

- [ ] After deploy, hit `https://lexoni.ai/api/cron/reap-tokens` with no
      auth header — expect `401 unauthorised`
- [ ] Watch Vercel function logs the morning after the first deploy;
      `reap-tokens` (03:00 UTC) and `compliance-reconcile` (06:30 UTC)
      should fire and return 200

### Rate-limit caveat

The token-bucket lives in process memory (`lib/security/ratelimit.ts`). On
Vercel each lambda instance has its own store, so the configured "5 per hour
per IP" effectively scales with concurrency. The signed honeypot, Turnstile,
and per-IP rate-limit still mitigate brute force; they just don't aggregate
across instances. For strict global per-IP enforcement, wire Upstash Redis
or Vercel KV into the `STORE` initialiser.

A `console.warn` fires once per cold-start in production so this isn't
forgotten.

---

## Things I cannot wire for you

- Bank account / Stripe linkage for actual paid subscriptions. The platform
  invoices via HTML/PDF and accepts bank transfer until you wire Stripe.
- Real OAuth for Outlook / Gmail email capture. Requires Microsoft and
  Google partner account approvals.

Both are documented in [BUILD_BACKLOG.md](docs/BUILD_BACKLOG.md) for later
sprints.
