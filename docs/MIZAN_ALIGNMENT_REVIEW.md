# Lexoni.ai — Alignment Review & Extension Plan
### Candid review of the existing scaffold against the lawyer-centric thesis

> **For:** Ashik (founder thinking-partner read).
> **Verdict up front:** **Do NOT start from scratch.** The scaffold is ~70% of a great product and the schema is genuinely strong. But it's built around the **matter** and the firm-as-vendor-to-companies. Your thesis is to build around the **lawyer** and the firm's own health. That's a *re-centering*, not a rebuild — and it's mostly additive. This doc says exactly what to keep, what to re-frame, and what to add.

---

## 1. What you already have (and should keep — it's good)

The `legalos` scaffold is more complete than most seed-stage legaltech. Keep all of it:

- **Multi-tenant model** (`firm` / `client` / `ops`) with per-tenant isolation and a `scoped()` helper. Solid.
- **White-label** done properly: custom domain + subdomain + verified email identity (SPF/DKIM) + intake slug + attribution toggle. This is ahead of most competitors.
- **Ethical-wall foundations**: `tenantSettings.partnerVisibility = assigned_only`, `matterCollaborators` with per-firm permission flags, `accessLog` with export-reason prompts. Good bones (we upgrade it in §4.5).
- **Document automation engine** (`templates` → `documentGenerations` → `signatureWorkflows`) with a 3-level template library (personal/firm/marketplace) and `estimatedMinutesSaved` ROI tracking.
- **Intake → AI classify → routing rules → engagement letter → matter** pipeline. This is a real, differentiated flow.
- **Billing spine** (`timeEntries`, `expenses`, `invoices` VAT-aware, `payments`), **compliance** (region/regulator-aware tasks, licenses), **GDPR/PDPL** (RoPA, consent, DSRs, append-only `auditLog`), **knowledge base** with `approved`/`learnFromThis` AI-training gates, **marketplace**, **M&A deal rooms**, **e-signature** with cert hashes.
- **i18n/RTL** via logical properties + `en/ar.json`. Bilingual is architectural, as it should be.

**Bottom line:** the plumbing is excellent. The problem is the *center of gravity*, not the parts.

---

## 2. The core misalignment (the one thing to fix)

You said it plainly: *"This system is not going to be designed around the case, but around lawyers."*

Right now the scaffold is designed around the case. Evidence:
- **The navigation is a feature catalogue** (Corp-Sec · Governance · Legal AI · Contracts · Compliance · Cases · Doc-Auto · Marketplace · M&A · Settings). It's a *module list*, not a *lawyer's day*.
- **The home is a generic `/dashboard`**, not "my desk."
- **The README's headline is "the operating system for running companies legally"** — that's the *client company's* OS. Your vision is the *lawyer's and firm's* OS.
- **`firm-dashboard` is shallow** — 4 KPIs, a roster, workload bars. It's a team list, not the *firm pulse* (WIP aging, realisation, throughput per month/year, promotion-readiness, a vitality index).
- **The doc engine is template-at-a-time** — it doesn't yet know about **processes** (go-public, formation, change-of-control, M&A, bankruptcy) as an **ordered set of documents** that narrows by type. Your signature idea isn't modelled yet.

None of this means the work is wrong. It means the **organising principle** needs to flip from *"here are our modules"* to *"here is your day, your book, your numbers — and the modules serve them."*

---

## 3. The re-centering (cheap, high-impact, mostly IA + 2 screens)

Re-frame the product around the lawyer and the owner without throwing anything away:

**3.1 New home: "My Desk" (the lawyer's daily open).**
Replace the generic dashboard as the default landing for `lawyer` / `lawyer_helper` / `firm_admin` with a persona-aware desk:
- *Today:* matters needing me, drafts in progress, time to confirm, approvals waiting, what's blocking my matters (from the new delay engine, §4.4).
- *My book:* my matters by process/stage, my WIP, my targets vs actuals, my promotion-readiness signals.
- The existing modules become **tools the desk reaches into**, not the top-level map.

**3.2 New owner home: "Firm Pulse" (the partner's daily open, mobile-first).**
Upgrade `firm-dashboard` into the real pulse (spec in §4.3): topline hours/WIP/realisation/files, throughput (matters/month & /year), utilisation heat by lawyer/process/client, leakage and delay alerts, and a single **Firm Vitality Index**.

**3.3 Re-group the sidebar persona-first.**
From module-first → role-first: **My Desk · My Matters · Drafting · Time & Billing · Firm Pulse (owners) · Clients & Portal · Knowledge & Templates · Compliance · Admin.** Corp-sec/governance/M&A become *matter workspaces* opened from a matter, not standalone top-level silos (they stay in the codebase; they move in the IA).

**3.4 Reposition the one-liner.**
From *"run companies legally"* → *"the practice OS GCC lawyers open first and close last — built around how lawyers work, bill, and grow."* Keep the client-facing corporate features as the **value the lawyer delivers**, not the product's spine.

---

## 4. The four missing pillars (the real extension — now in code)

These are what's genuinely *not yet modelled* and what your vision is actually about. I've added all of them to the schema as `legalos/lib/db/schema.process.ts` (composes with the existing `schema.ts`). Summary of each:

### 4.1 Process engine (your signature idea — "lookup by process, ordered documents")
- **`processes`** — the catalogue: *company_formation, go_public, go_private, change_of_control, ma_buyside, ma_sellside, jv, restructuring, bankruptcy*, etc. Firm-scoped or global, region- and language-tagged.
- **`processSteps`** — the *ordered* workstream within a process (ordinal, dependsOn, expected duration, owner role, optional flag). This is the methodology — the thing that makes you "Auditus for lawyers."
- **`processDocumentSlots`** — the *ordered document set* per process (ordinal, expected template kind, required, stage). This is the "list of files in the order of the process" you described.
- **`matterProcesses` / `matterDocumentSlots`** — when a lawyer opens a matter on a process, it instantiates the ordered slots with live status (`not_started → drafting → in_review → signed`). The "narrowing lookup" is just: filter slots/templates by the matter's process + jurisdiction + language. **Drag-drop a file onto a slot** fills it; the autofill-from-client-record + "update core details?" confirm runs here (see `documentGenerations.contextJson` already exists — we add the slot link + the confirm/diff event).

### 4.2 Passive time capture & leakage (re-frame "maximise billing" → "zero leakage")
- **`activityEvents`** — passive capture of work against a matter/document (drafting, opens, AI-draft sessions, calls/emails opt-in), with source and duration.
- **`timeEntries` gains `source` (passive | manual | ai_suggested) + `confirmedAt`** — the end-of-day "confirm your time" sweep turns activity into confirmed entries in seconds. *Removing the timesheet is the #1 adoption lever.*
- **`leakageAlerts`** — finalised doc with no time; matter closed with open WIP; rate-card mismatch; aged unbilled WIP. This is the "maximise billing" outcome done *defensibly*.

### 4.3 Performance, promotion & firm vitality (your "performance metrics, promotion recommendations, cases per month/year")
- **`performanceSnapshots`** — per lawyer per period: billable hours, realisation, collection, matters opened/closed, utilisation, on-time-milestone %, supervision load. Drillable to source.
- **`promotionSignals`** — composite *promotion-readiness* with an **evidence JSON** and a `reviewedByUserId`. Framed explicitly as **decision-support for a human**, never an automated verdict (this is the ethically-defensible, award-worthy framing).
- **`firmVitalitySnapshots`** — the single owner glance: utilisation × realisation × WIP-age × pipeline → one **Firm Vitality Index**, with components stored so it's never a black box.

### 4.4 Delay & gap detection (the "legal blindspots" you asked about — your patent-candidate)
- **`matterBlockers`** — typed detections off the process graph: `missing_intake_data, dependency_violation, signature_bottleneck, review_sla_breach, conflict_pending, external_dependency_wait` (MoJ/DIFC/ZATCA), `wip_leakage, language_parity_drift, residency_exception`. Severity, detectedAt, resolvedAt.
- Surfaces as a per-matter **"what's blocking this"** panel and a firm-level **delay/leakage report**. Because the system knows the *expected* process sequence, it can flag stalls competitors can't see. **This is your strongest novel-system / patent claim.**

### 4.5 Upgrade the ethical wall from "assigned-only" to a first-class primitive
The current `assigned_only` visibility + `accessLog` is a good start but it's *visibility*, not *isolation*. Added:
- **`wallGroups` + `wallMemberships`** — explicit, time-stamped isolation groups. Default-deny across walls: a non-member can't see, search, autofill-from, or even know a walled matter exists.
- **`wallAccessRequests`** — cross-wall access is an explicit, logged, *approved* request (never self-grant), with reason + approver.
- **`conflictChecks`** — conflict scan at intake/matter-open against existing clients + adverse parties, recorded before the matter opens.
- **AI must respect the wall in the retrieval layer**, not just the UI — enforce when wiring `knowledgeItems` retrieval and `ai/draft`.

---

## 5. Two more gaps worth closing soon (not new pillars)

- **Voice-to-draft.** Your "voice text into the smart AI prompt" isn't in `ai/draft` yet. Add an input-mode (`text | voice`) to the draft request and a transcription step. Cheap, and you explicitly asked for it.
- **The Wizard (edit sections → preview final).** The doc engine generates whole documents; add the **section-by-section guided editor** path (edit clause slots → preview final) alongside direct-edit, so assistants can safely prep and lawyers approve. The `processDocumentSlots` + `templates.variables` already give you the structure to build it on.

---

## 6. Sequencing — do this in order

1. **Re-center IA** (My Desk + persona-first sidebar) and reposition the one-liner. ~Low effort, highest perception impact.
2. **Land the Process engine** (§4.1) and rebuild `document-automation` around process-ordered slots + drag-drop + autofill-confirm + wizard. This is the signature demo.
3. **Passive time + leakage** (§4.2) and **Firm Pulse** rebuild (§4.3). This is what makes the owner open it daily.
4. **Delay/gap engine** (§4.4) — the differentiator and IP story.
5. **Wall upgrade + conflicts** (§4.5) — the trust unlock for top-tier firms.
6. Voice-to-draft + Wizard (§5).

Run it as **one vertical slice first: Company Formation, end-to-end**, through the new process engine → drag-drop draft → passive time → firm pulse. Prove the loop, then widen to M&A / change-of-control / bankruptcy.

---

## 7. What this does to the thesis (the new one-liner to test)

> **LegalOS GCC is the bilingual practice operating system GCC lawyers open first and close last.** It runs the firm around its lawyers — encoding how good corporate work is done as ordered, jurisdiction-aware processes; capturing every minute legitimately earned; surfacing what's blocking each matter before it slips; and giving owners a live pulse of firm health, lawyer by lawyer. Built EN/AR, residency-pinned to the UAE & KSA, with an ethical wall you can prove.

That keeps everything you've built, and finally points it at the lawyer.

---

*Companion artifact: `legalos/lib/db/schema.process.ts` — the four-pillar schema extension, ready to merge. Re-verify compliance specifics (PDPL/DIFC/ADGM/KSA) with GCC counsel before go-live; see `MIZAN_BUILD_SPEC.md §13` for cited sources.*
