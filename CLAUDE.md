# CLAUDE.md — Lexoni.ai

> Operating guide for Claude Code working in this repo. Read this first, then `docs/BUILD_BACKLOG.md` for what to build next.

## What this is
A bilingual (EN/AR) **practice operating system for GCC law firms**, built around the **lawyer and the firm's health** — not the case. Next.js 14 (App Router) + TypeScript + Tailwind + Drizzle/Postgres. Region-aware for UAE & KSA.

The thesis, the candid product critique, and the full build spec live in `docs/`:
- `docs/MIZAN_BUILD_SPEC.md` — the master vision + cited GCC compliance requirements.
- `docs/MIZAN_ALIGNMENT_REVIEW.md` — gap analysis (scaffold vs vision) and the re-centering plan.
- `docs/SECURITY.md` — bot-protection model (Turnstile + signed honeypot + rate-limit) on every public POST.
- `docs/PHASE_2_VISION.md` — **the GCC Legal Operating System** positioning + the four defensible IP moats (Dynamic Workflow Gen, Knowledge Graph, Regulatory Impact, Outcome Prediction). Read this after BUILD_BACKLOG.
- `docs/BUILD_BACKLOG.md` — the sequenced, acceptance-criteria backlog. **Start here.** Phase 1 (Sprints 1–10) shipped; Phase 2 (Sprints 11–20) is the OS suite.

## The product in one line
The practice OS GCC lawyers open first and close last — encoding how good corporate work is done as ordered, jurisdiction-aware **processes**; capturing every minute legitimately earned; surfacing what's **blocking** each matter before it slips; and giving owners a live **pulse** of firm health, lawyer by lawyer. EN/AR, residency-pinned, with a provable ethical wall.

## Run it
```bash
npm install
cp .env.example .env.local        # DATABASE_URL + ANTHROPIC_API_KEY (both optional to boot)
npm run dev                        # http://localhost:3000  — boots on mock data, no DB needed
npm run typecheck                  # tsc --noEmit  (keep this clean — it is the CI gate here)
npm run db:push                    # sync Drizzle schema to Postgres when DATABASE_URL is set
```
The app renders entirely from `lib/mock` until you wire live queries. `tsc --noEmit` passing is the definition of "compiles."

## Architecture map
```
app/(dashboard)/        in-app pages (role-aware shell in layout.tsx)
  desk/                 ★ My Desk — the lawyer's daily open
  firm-dashboard/       ★ Firm Pulse — owner's daily open (Vitality Index)
  matters/[id]/         ★ Process-ordered matter workspace (drag-drop, autofill, wizard, smart-prompt)
  ... (corpsec, governance, contracts, compliance, cases, marketplace, M&A, gdpr, settings)
app/api/ai/draft/       AI drafting endpoint (suggestion-state, wall-aware, stubs without key)
components/ui/          Card, Kpi, Badge, DataTable, PageHeader  — use these, don't reinvent
components/nav/         Sidebar (persona-first), Topbar
lib/db/schema.ts        ~50 base tables  →  re-exports schema.process.ts
lib/db/schema.process.ts  the 4 lawyer-centric pillars + wall upgrade
lib/db/client.ts        Drizzle client (server-only; tenant-scope every query)
lib/mock/index.ts       demo data mirroring the schema (swap to live import-by-import)
lib/i18n/{en,ar}.json   all UI strings (never hardcode; logical CSS props only)
lib/auth/{session,tenant}.ts  getSession(), canSee(), resolveHostTenant()
```
★ = the lawyer-centric slice built most recently. The process/performance/delay tables are in `schema.process.ts`.

## The four pillars (what makes this not "another legal tool")
1. **Process engine** — `processes → process_steps → process_document_slots`, instantiated per matter as `matter_processes / matter_document_slots`. Documents are shown **in process order**; the lookup **narrows** by process+jurisdiction+language; drag-drop fills a slot; autofill merges the canonical client record with a confirm-diff.
2. **Passive time & leakage** — `activity_events` → end-of-day confirm sweep → `time_entries` (now has `source`/`confirmedAt`/`slotId`); `leakage_alerts` protect recoverable WIP. Frame as **zero-leakage**, never "bill more."
3. **Performance & firm vitality** — `performance_snapshots`, `promotion_signals` (decision-**support**, not a verdict), `firm_vitality_snapshots` (index with components stored — never a black box).
4. **Delay/gap engine** — `matter_blockers` typed off the process graph. The "what's blocking this" panel + firm-wide slip report. Strongest patent candidate.
+ **Ethical-wall upgrade** — `wall_groups` / `wall_memberships` / `wall_access_requests` / `conflict_checks`: default-deny isolation, cross-wall access by approved request only.

## Conventions (follow these — reviewers will check)
- **UI:** compose `Card`/`CardHeader`/`CardBody`, `Kpi`, `Badge` (tones: success/warning/danger/info/neutral), `DataTable<T extends {id}>`, `PageHeader`. Utility classes in `app/globals.css` (`btn-primary`, `btn-ghost`, `card`, `chip-*`, `sec-title`, `h1/h2`, `text-muted`, `bg-royal`, `bg-success/warning/danger`).
- **Icons:** `lucide-react` only.
- **i18n/RTL:** every string via `t(locale, "...")` with keys in BOTH `en.json` and `ar.json`. Use logical CSS properties (`ps-`/`pe-`/`inset-inline-*`/`text-end`) so Arabic mirrors. `dir` flips in `app/layout.tsx`.
- **Server vs client:** pages are server components by default; add `"use client"` only for interactivity (see `matters/[id]/MatterWorkspace.tsx`, `desk/ConfirmTime.tsx`). Pass data down as props from a thin server wrapper.
- **Mock → live:** swap `import { x } from "@/lib/mock"` for a Drizzle query in the server component. Keep the same shape so the UI doesn't change.

## Non-negotiable guardrails (legal product — get these wrong and a firm leaves)
- **Tenant isolation:** every query on a `tenant_id` table filters by `session.tenantId`. No cross-tenant read, ever. Add a `scoped()` helper and a CI test before wiring live reads.
- **Ethical wall:** enforce default-deny in the **data/retrieval layer**, including AI context — not just the UI. A non-member must not see, search, autofill-from, or know a walled matter exists.
- **AI is suggestion-state:** `/api/ai/draft` never finalises, sends, signs, or crosses a wall. A human with `final_review` accepts.
- **Audit everything:** every state change → `audit_log` (and matter access → `access_log`). Append-only.
- **Residency:** data is region-pinned (UAE/KSA); no cross-border movement without a logged lawful basis. Compliance rules are **configurable policy**, never hardcoded jurisdiction logic. See `docs/MIZAN_BUILD_SPEC.md §13` (cited).

## Definition of done (every feature)
Bilingual EN/AR + RTL verified · tenant-scoped · residency-pinned · audited · wall-respecting · numbers drillable to source · removes a step a lawyer does today (doesn't add one) · works on mobile for the relevant persona · reversible/confirm step for any legally-effective action · `npm run typecheck` clean.

## Working agreement
Build **one vertical slice fully** before widening (current reference slice: Company Formation, end-to-end). Keep `tsc` green. Update `docs/BUILD_BACKLOG.md` as you complete items. When you touch the schema, run `npm run db:generate` and commit the migration.
