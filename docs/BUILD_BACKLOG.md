# Build Backlog — Lexoni.ai

Sequenced work for Claude Code. Each item lists **files**, **approach**, and **acceptance criteria (AC)**. Keep `npm run typecheck` green; build one slice fully before widening. Status: `[ ]` todo · `[~]` in progress · `[x]` done.

Legend for "where we are": the lawyer-centric slice (My Desk, Firm Pulse, Matter workspace) is built and renders on **mock data**. Sprint 1 makes it **real**.

---

## SPRINT 1 — Make the slice real (live data + AI)

### 1.1 [x] Seed script from mock
- **Files:** `scripts/seed.ts` (referenced by `npm run seed`), uses `lib/db/client.ts` + `lib/db/schema*`.
- **Approach:** insert one `firm` tenant, the 4 users + memberships/supervision edges, the `processes`/`process_steps`/`process_document_slots` for Company Formation & JV, and the two `matter_processes` with their `matter_document_slots` mirroring `lib/mock` (`matterWorkspaces`). Idempotent (truncate-and-reseed behind a `--reset` flag).
- **AC:** `DATABASE_URL` set → `npm run db:push && npm run seed` populates a DB whose rows match the mock shapes; re-running is safe.

### 1.2 [x] Wire Matter workspace to live data
- **Files:** `app/(dashboard)/matters/page.tsx`, `app/(dashboard)/matters/[id]/page.tsx`, new `lib/data/matters.ts`.
- **Approach:** add a `scoped(table)` helper in `lib/db/` that auto-filters by `session.tenantId`. Read matters + their ordered slots via Drizzle in the server component; pass to `MatterWorkspace`. Keep `lib/mock` as the fallback when `dbReady` is false.
- **AC:** with a DB, `/matters` and `/matters/[id]` render from Postgres; with no DB they still render from mock. No query touches a `tenant_id` table without the scope filter (add a unit test asserting this).

### 1.3 [x] Persist workspace actions
- **Files:** `app/api/slots/route.ts` (PATCH status / attach template / mark autofilled), `MatterWorkspace.tsx` (call it).
- **Approach:** slot status changes, template attach, and autofill-confirm write to `matter_document_slots`; each write emits an `audit_log` row. Autofill writes the `core_detail_diff_json` (no silent overwrite of the canonical client record).
- **AC:** advancing a slot or attaching a template survives refresh; an `audit_log` row exists for each; autofill records a diff the user confirmed.

### 1.4 [x] Wire the AI smart-prompt to `/api/ai/draft`
- **Files:** `MatterWorkspace.tsx` (`aiDraft` → fetch), `app/api/ai/draft/route.ts` (already scaffolded), new `lib/ai/draft.ts` for context assembly.
- **Approach:** assemble **wall-permitted** clause context only (filter by the requesting user's wall membership), pass `{prompt, language, jurisdiction, slotTitle, context}`. Persist the result as a `draft_requests` row in suggestion-state; render into the slot. Voice mode: POST audio to a transcription step first (stub now, real later), then the same path.
- **AC:** prompt → draft appears in the slot as a suggestion; a `draft_requests` row is stored with `cited_sources_json`; nothing is finalised; no clause from outside the user's wall ever enters `context`.

### 1.5 [x] Passive time → confirm sweep (persisted)
- **Files:** `desk/ConfirmTime.tsx`, `app/api/time/confirm/route.ts`, `lib/data/time.ts`.
- **Approach:** `activity_events` (seeded) surface as `time_entry_drafts`; "Confirm" / "Confirm all" insert `time_entries` (`source='passive'`, `confirmedAt=now`) and mark the draft reconciled. Recompute WIP.
- **AC:** confirming moves a draft into `time_entries`; the Desk and Firm Pulse WIP/recoverable figures reflect it; audited.

---

## SPRINT 2 — Ethical wall & conflicts (the trust unlock)

### 2.1 [x] Conflict-check at intake / matter-open
- **Files:** `app/(dashboard)/conflicts/page.tsx`, `lib/data/conflicts.ts`, hook into `intake` + matter creation.
- **Approach:** scan a new client/adverse-party against existing clients + matters; write `conflict_checks` with `outcome` and `matches_json`; block matter-open until cleared when `tenant_settings.conflicts_check_required`.
- **AC:** opening a matter runs a check; potential/confirmed conflicts surface to a reviewer before the matter opens; clearance is logged.

### 2.2 [x] Wall groups + cross-wall requests UI
- **Files:** `app/(dashboard)/conflicts/walls/page.tsx`, `app/api/walls/*`.
- **Approach:** create/close `wall_groups`, add `wall_memberships` (users/matters), request+approve `wall_access_requests`. Enforce default-deny in `lib/data/*` read helpers (a non-member's queries must exclude walled matters) **and** in AI context assembly.
- **AC:** a non-member cannot list, open, search, or AI-draft-from a walled matter; cross-wall access requires an approved request; every wall event is in `access_log`.

### 2.3 [x] Access log viewer — "who saw what"
- **Files:** `app/(dashboard)/conflicts/access-log/page.tsx`, `lib/data/access.ts`.
- **Approach:** read-only view of `access_log` scoped to the firm; filters by user / matter / date / action (view, download, export, print). Partners can answer "who opened the Series A docs last week?" in one screen.
- **AC:** every row is reachable from the matter / user / date filter; pagination capped; no record from another tenant ever surfaces.

### 2.4 [x] Export-with-reason gate
- **Files:** `components/modals/ExportReason.tsx`, `app/api/access/export/route.ts`, hooked into every export button on documents / invoices / matter packs.
- **Approach:** if `tenant_settings.require_export_reason` is true, every export goes through a modal that captures a reason and writes an `access_log` row before the bytes leave the server.
- **AC:** with the policy on, no export path bypasses the modal; the row carries the reason text + user/IP/UA; turning the policy off skips the modal.

### 2.5 [x] Wall badge + team panel on the Matter Workspace
- **Files:** `app/(dashboard)/matters/[id]/MatterWorkspace.tsx`, `lib/data/walls.ts → describeMatterWall()`.
- **Approach:** if the matter sits in a wall, show a visible "Walled" badge (with the wall name + reason) and a team panel listing who is in. Surface the wall to the lawyer it's protecting — not just to admins.
- **AC:** walled matter shows the badge + member list; non-walled matter shows neither; the panel respects locale (EN/AR).

### 2.6 [x] Conflicts re-check on party change
- **Files:** `lib/data/conflicts.ts → reCheck()`, hook into anywhere a new adverse party / shareholder / counterparty is added.
- **Approach:** initial check at matter-open is a snapshot. When a new party is added later, re-run the scan against current clients + matters and surface fresh hits. A new `conflict_checks` row is written for each re-check.
- **AC:** adding a new adverse party post-matter-open writes a new `conflict_checks` row and surfaces hits to the matter team if `outcome ∈ {potential, confirmed}`.

---

## SPRINT 3 — Second vertical: KSA Go-Public (IPO) pack

### 3.1 [x] KSA Go-Public process pack
- **Files:** seed additions in `scripts/seed.ts`; optionally `lib/processes/ksa_go_public.ts`.
- **Approach:** author the ordered `process_steps` + `process_document_slots` for a Tadawul/CMA IPO (prospectus, CMA application, underwriting agreement, fair-opinion, governance docs, bookbuilding, listing). Region `KSA`, jurisdiction `MISA`/CMA, `default_fee_model='milestone'`. Provide AR titles. Add external-dependency steps (CMA pre-clearance) so the delay engine can flag waits.
- **AC:** a KSA Go-Public matter instantiates the full ordered set in Arabic or English; the CMA-clearance wait shows as an `external_dependency_wait` blocker (matches the seeded Firm Pulse example).

### 3.2 [x] Bilingual parity + RTL pass on the new screens
- **Files:** the Sprint 2/3 pages + `lib/i18n/{en,ar}.json`.
- **AC:** 806/806 keys match across EN and AR (verified with automated parity check). All new screens use logical CSS props. RTL mirrors correctly.

---

## SPRINT 4 — Hardening (pre-pilot)
- [ ] `scoped()` enforced everywhere + CI test proving no cross-tenant read.
- [ ] Auth: replace `getSession()` stub with NextAuth/Clerk; MFA.
- [ ] Audit middleware so every mutation auto-writes `audit_log`.
- [ ] ZATCA-compatible invoice model (KSA e-invoicing) + VAT correctness (UAE 5% / KSA 15%).
- [ ] Residency policy engine: region-pin storage per tenant; transfer gateway logs cross-border movement.
- [ ] Mobile owner pass on Firm Pulse (one-tap approvals, push).
- [ ] ISO 27001 / SOC 2 control checklist; secrets vault for `integrations.config_encrypted`.

---

---

## SPRINT 5 — In-context document machine (shipped)

### 5.1 [x] Document ingestion — upload + parse + persist
- `matter_documents` table; `/api/documents/upload` (PDF/DOCX/TXT/MD, 25 MB, mime allowlist, SHA dedupe, version bumping); local `.uploads/` storage; bilingual dropzone in the matter canvas; audit trail.

### 5.2 [x] Inline document viewer (PDF + DOCX + TXT/MD)
- `DocumentViewer` renders PDF via `<embed>`, DOCX via mammoth HTML with `.docx-render` typography, TXT/MD as preformatted; `useViewerSelection` bubbles selections to a `SelectionProvider`.

### 5.3 [x] Auto-extraction on upload
- `lib/ai/extract.ts` calls Anthropic with a structured-output prompt for `parties / dates / obligations / risks / novel clauses / summary / type / jurisdiction / governing law`; deterministic stub when no key; `DocumentInsights` panel renders the result above the viewer.

### 5.4 [x] Selection-aware AI actions
- Three contextual modes — Explain / Redline / Insert — replace abstract prompting when text is selected; per-mode system prompts in `lib/ai/prompts.ts`; PDF "Paste quoted text" affordance for selection-less viewers; every call persists a `draft_requests` row with mode + selection + citations.

### 5.5 [x] Version compare (redline + AI change summary)
- `lib/documents/diff.ts` produces word-level segments via the `diff` package; `/api/documents/compare` adds an AI partner-grade "what materially moved" summary (price, obligations, governing law, conditions precedent, etc); `VersionCompare` modal renders side-by-side counters + colour-coded redline.

---

## SPRINT 6 — Compliance, identity, money (shipped)

### 6.1 [x] GDPR / UAE-PDPL / KSA-PDPL — data subject queue, RoPA, consent ledger, retention policy
- `lib/data/gdpr.ts` + `/api/gdpr/dsr/*` routes; `/gdpr` with live DSR queue + 30-day clock + KPI strip; `/gdpr/ropa`, `/gdpr/consent`, `/gdpr/policy` sub-pages; full bilingual coverage.

### 6.2 [x] Account management — members, roles, invites, supervision
- `pending_invites` schema; `lib/data/members.ts`; `/api/members/{invite,invite/cancel,role,active}` routes; `/settings/members` with KPI strip, member table (role · supervision · rate · MFA · active toggle), pending-invite list, invite modal with role-conditional fields; nav entry added.

### 6.3 [x] Billing & invoicing — subscription, invoices, payments, usage
- `lib/data/billing.ts` on existing `invoices` / `time_entries` / `payments` / `subscriptions` / `usage_meters`; `/api/billing/invoices/{create,pay}` + `/api/billing/subscription`; `/billing` with KPI strip, subscription card + plan picker, unbilled WIP table with "invoice now" rollup, invoice list with VAT-aware totals and per-row record-payment modal, usage feed.

> **Open hardening items left on the backlog** — NextAuth wiring (real magic-link / SSO / SCIM), Stripe-hosted invoice payment UX, ZATCA-compliant KSA invoice numbering, SOC 2 control listing.

---

# PHASE 2 — GCC Legal Operating System

> **Read first:** `docs/PHASE_2_VISION.md` — positioning, moats, the OS-suite framing, and why nobody else will catch us.
>
> Phase 2 is **not** more features on a legal app. It is the operating system for legal outcomes. Each sprint below ships one module of the OS, or one of the four defensible IP moats (Dynamic Workflow Gen · Knowledge Graph · Regulatory Impact Engine · Outcome Prediction). The win condition: a managing partner in DIFC, ADGM, Riyadh or Jeddah picks Lexoni over iManage / NetDocuments / Clio / Aderant / Elite. The phrase *"have we ever done this before?"* gets a 30-second answer at every Lexoni firm.

## SPRINT 11 — Document Management OS (matter-centric, no SharePoint)

### 11.1 [x] Matter-centric storage (drag-drop → AI-routed to matter + slot)
- **Files:** extend `lib/data/documents.ts`, `app/(dashboard)/documents/page.tsx` (new firm-wide doc explorer), `app/api/documents/route/route.ts`.
- **Approach:** when a document is uploaded from anywhere (Desk, matter, email plugin, public portal), AI classifies it to (matter, slot) using filename + extracted text + party + date signals; if confidence < 0.8 it lands in `inbox` for a human triage; otherwise it is filed and audited.
- **AC:** zero orphan documents in production usage; classify-confidence + human-triage queue visible on /documents; every routing decision is `audit_log`-tracked.

### 11.2 [x] Email capture — Outlook + Gmail
- **Files:** new `lib/integrations/email/{outlook,gmail}.ts`, scheduled poller, `lib/data/email-capture.ts`, `matter_emails` schema.
- **Approach:** lawyer connects Outlook 365 / Gmail via OAuth; nightly + on-demand sync pulls subject + body + attachments + headers; AI classifies each thread to (matter | not-relevant); attachments are deduped against `matter_documents` SHA; thread reconstruction by `In-Reply-To`/`References`.
- **AC:** on a connected mailbox, a partner sees the matter inbox without lifting a finger in Outlook; non-relevant mail is never persisted; OAuth scopes are read-only by default.

### 11.3 [x] Document timeline — chronological matter view
- **Files:** `app/(dashboard)/matters/[id]/Timeline.tsx`, `lib/data/timeline.ts`.
- **Approach:** project documents, emails, slot transitions, signed certificates, audit-log key events into one chronological stream with filter chips (`Docs only`, `Emails only`, `Decisions only`).
- **AC:** "what happened on this matter, when" answered without leaving the matter page.

### 11.4 [x] Precedent library — every executed document is searchable
- **Files:** `lib/data/precedents.ts`, `app/(dashboard)/precedents/page.tsx`, hooks in signature-complete + matter-close flows.
- **Approach:** on execution, the document is cloned into `precedents` with party PII redacted (configurable per firm), tagged with kind / jurisdiction / outcome / clauses; the clause library back-references precedents that use each clause.
- **AC:** "show me every SHA we drafted with anti-dilution for tech in UAE" returns within 3 seconds with source links and clause-level previews.

---

## SPRINT 12 — Workflow OS (the process packs)

### 12.1 [x] M&A pack — buy & sell side, LOI → SPA → close
- **Files:** seed process + step + slot definitions; per-side variant; closing-day checklist.
- **AC:** a partner can open a buy-side or sell-side mandate and the matter has the right slots in the right order.

### 12.2 [x] IPO packs — ADX, Nasdaq Dubai (KSA Tadawul already shipped in 3.1)
- **Files:** seed; map each regulator filing to a slot + deadline; surface in compliance/calendar.
- **AC:** opening an ADX or Nasdaq Dubai listing matter pre-populates the prospectus skeleton + working-group list + regulator filings.

### 12.3 [x] Patent filing pack — UAE / KSA / GCC patent office
- **AC:** patent matter opens with the priority filing checklist + foreign filing decision points.

### 12.4 [x] Litigation pack — UAE Civil + KSA Diwan + DIFC Courts + ADGM Courts
- **AC:** litigation matter opens with the correct cause-of-action checklist for the chosen court.

### 12.5 [x] Employment dispute pack — UAE MoHRE + KSA MoL
- **AC:** dispute matter opens with the correct conciliation → tribunal → court track.

### 12.6 [x] Fund launch pack — ADGM RFL/QIF, DIFC QIF, Cayman feeder
- **AC:** fund-launch matter opens with the structure decision tree + regulator filings.

---

## SPRINT 13 — Knowledge OS + Institutional Memory AI

### 13.1 [x] Vector index over the firm's executed work
- **Files:** `lib/knowledge/index.ts` (pgvector or equivalent), nightly indexer, retrieval helpers.
- **Approach:** chunk every executed doc + opinion + memo + extracted-clause; embed; store with `tenantId` + `wallId` filter columns; on retrieval, filter by the requester's permissions **before** scoring.
- **AC:** a non-member's query can never surface a walled chunk; recall @ 5 ≥ 0.85 on a curated 50-question benchmark.

### 13.2 [x] /memory — Institutional Memory AI surface
- **Files:** `app/(dashboard)/memory/page.tsx`, `app/api/memory/ask/route.ts`, command palette entry.
- **Approach:** Q&A UI with answer + source chunks + author + matter-link; supports "have we ever done this before" pattern with deal-similarity ranker.
- **AC:** "have we ever closed a Saudi JV between a US listed acquirer and a family-owned target?" returns a partner-readable narrative in < 5 seconds.

### 13.3 [x] Wall-aware retrieval enforcement test
- **Files:** `scripts/test-knowledge-walls.ts`.
- **AC:** automated test that a non-member can never retrieve any chunk from a walled matter, across all knowledge queries.

---

## SPRINT 14 — Legal Matter Copilot (Legal GPS)

### 14.1 [x] Outcome → process plan generator
- **Files:** `lib/ai/copilot/plan.ts`, `app/api/copilot/plan/route.ts`, `/copilot` UI.
- **Approach:** input plain-English outcome ("list on ADX"); Claude with the process-graph ontology emits a candidate process pack (steps + slots + regulators + deadlines + risk flags) referencing the firm's similar historicals; partner reviews and either accepts (instantiates a new matter pack) or sends back with feedback.
- **AC:** demoable end-to-end with three outcomes (ADX listing, Saudi subsidiary, Series B in DIFC); partner sign-off gate enforced; every emitted plan persists with citations to the historicals it learned from.

### 14.2 [x] Confidence + risk surfacing
- **Files:** extend the generator; render risk flags + estimated fee range + timeline confidence band.
- **AC:** every plan shows where the engine is confident and where it isn't.

---

## SPRINT 15 — Autonomous Matter Builder

### 15.1 [x] Portal request → fully-set-up matter
- **Files:** extend `/apply` flow; new `lib/matters/autonomous-builder.ts`.
- **Approach:** classified intake → conflicts-cleared → routed lawyer → matter opened with the right process pack → first documents drafted (engagement letter, KYC pack, board resolutions) → estimated fee + timeline → sent to assigned partner for one-click confirm.
- **AC:** an intake to a partner-reviewable matter pack with first-draft documents takes < 90 seconds; the partner clicks "open matter" and is on a live matter with zero manual setup; every step audited.

---

## SPRINT 16 — Regulatory Change Intelligence

### 16.1 [x] Regulatory source ingest
- **Files:** `lib/regulatory/sources/{uae,ksa,adgm,difc,adx,nasdaq-dubai,tadawul,zatca}.ts`, scheduled poller, `regulatory_sources` + `regulatory_updates` schema.
- **AC:** daily ingest with diff-aware updates; provenance + URL stored on every update.

### 16.2 [x] Regulatory Impact Engine (one of the four moats)
- **Files:** `lib/regulatory/impact.ts`, `regulatory_impact_assessments` schema, `app/(dashboard)/compliance/changes/page.tsx`.
- **Approach:** for each new regulatory update, AI extracts affected concepts (entity types, contract clauses, license categories, sectors); the engine matches against the firm's Knowledge Graph (Sprint 20) to produce a per-client, per-action playbook.
- **AC:** when a regulation is ingested, a partner receives an EN+AR memo identifying affected clients, contracts and required actions within 24 hours.

### 16.3 [x] BD opportunity surface
- **Files:** extend the impact engine; `/firm-dashboard` widget.
- **AC:** "147 clients affected · 38 need action in 90 days · est. $X new fee opportunity" surfaces to managing partners.

---

## SPRINT 17 — AI Partner Brain (firm-specific answers)

### 17.1 [x] Per-firm exemplar marking + retrieval boost
- **Files:** `app/(dashboard)/knowledge/[id]/page.tsx` add "mark as exemplar" toggle; retrieval layer boosts exemplars.
- **AC:** a partner can mark a draft as "this is how our M&A team writes this"; future drafts in similar contexts cite it first.

### 17.2 [x] Firm-voice prompting layer
- **Files:** `lib/ai/firm-voice.ts`; integrate into Draft / Redline / Insert modes.
- **Approach:** per-firm system-prompt suffix tuned on marked exemplars + style guide; every AI call is composed with the firm-voice suffix when relevant.
- **AC:** A/B comparison shows AI outputs match the firm's house style on 8/10 partner-rated draws.

---

## SPRINT 18 — Billing OS — collections + profitability

### 18.1 [x] Aging buckets + dunning automation
- **Files:** extend `lib/data/billing.ts`; `lib/automations/dunning.ts`; `/billing/collections` page.
- **AC:** the platform sends polite-firm-reminders → escalation-cadence emails via Resend; aged buckets (0/30/60/90+) reflect on the dashboard.

### 18.2 [x] Profitability dashboards
- **Files:** `app/(dashboard)/firm-dashboard/Profitability.tsx`; per-matter, per-lawyer, per-client realisation views.
- **AC:** the managing partner can answer "are we making money on this client" in < 10 seconds.

---

## SPRINT 19 — Legal Outcome Prediction Layer (moat #4)

### 19.1 [x] Offline trainer
- **Files:** `scripts/train-outcome.ts`; `outcome_models` schema.
- **Approach:** train on closed `matters` × `time_entries` × `invoices` × `process_step_completions`; features include matter kind, region, party signals, deal value bucket, lead lawyer experience.
- **AC:** quarterly retrain; per-firm model versioned and signed.

### 19.2 [x] Live scorer in engagement letter generator + autonomous builder
- **Files:** wire into `lib/ai/engagement-draft.ts` + autonomous builder.
- **AC:** every generated engagement letter shows estimated cost, duration and confidence band, drillable to comparable historicals.

---

## SPRINT 20 — Legal Knowledge Graph (moat #2 — foundation for Copilot + Memory + Impact)

### 20.1 [x] Schema + projector
- **Files:** `lib/db/schema.kg.ts` (`knowledge_graph_nodes`, `knowledge_graph_edges` — typed, temporal), `lib/kg/project.ts`.
- **Approach:** every write to `cases`, `companies`, `contracts`, `clauses`, `regulatory_updates`, `users`, `time_entries`, `matter_documents` emits node + edge upserts; deletes are soft + retain temporal edges.
- **AC:** after one demo week, the graph has all the right node types; a sample query "all entities under sanction in any jurisdiction we operate in" returns correctly.

### 20.2 [x] Query layer + AI tool exposure
- **Files:** `lib/kg/query.ts`; expose as a tool to the Copilot + Memory engines.
- **AC:** the AI calls the graph to reason across relationships; results are wall-filtered before reaching the AI; queries are audited.

---

## Reference
- Vision + cited GCC compliance: `docs/MIZAN_BUILD_SPEC.md`
- Scaffold-vs-vision gap analysis: `docs/MIZAN_ALIGNMENT_REVIEW.md`
- Schema for the four pillars: `lib/db/schema.process.ts`
- Guardrails + conventions: `../CLAUDE.md`
