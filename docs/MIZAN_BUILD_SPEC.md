# MIZAN — Build Specification & Strategic Brief
### The operating system for GCC law firms. Built around lawyers, not cases.

> **Working codename:** *Mizan* (ميزان — "the scale / balance"). Rename freely.
> **Audience for this doc:** Claude Code (the builder) **and** the founder (Ashik).
> **How to read it:** Sections 1–3 are the *why* and the candid critique — read once, internalise.
> Sections 4–18 are the *what to build* — treat as the source of truth. Section 19+ is *how to build it* (stack, phasing, acceptance criteria).
> **Prime directive:** This is not "another legal tool." It is the daily pulse a lawyer and their team open first and close last. If a screen doesn't earn a daily open, it doesn't ship.

---

## 0. How Claude Code should use this file

1. Treat this as the root product spec. Generate a `CLAUDE.md`, an architecture decision record (ADR) folder, and a living `/docs` set from it.
2. Build **spec-first, vertical-slice**: one process (Company Formation) end-to-end through every layer (auth → matter → document engine → billing → dashboard) before widening. A thin slice that *works* beats ten half-features.
3. Every entity, event, and document action emits to an **append-only audit log** from commit #1. Retrofitting audit into a legal product is a rebuild. Do it first.
4. Bilingual (EN/AR) and RTL are **architectural, not a translation pass**. No hardcoded strings, ever. Logical CSS properties only. See §15.
5. When in doubt about a legal/compliance rule, **surface it as a configurable policy**, don't hardcode a jurisdiction's rule into logic. The moat is being multi-jurisdiction-aware; hardcoding kills it.

---

## 1. Founder thinking-partner: the candid read

You asked me to make sure we're the best of the best and to find the blindspots. Here's the honest version.

**What you've got right — and it's the whole game:**
- **Lawyer-centric, not case-centric, is the correct and contrarian bet.** Clio, Litify, LEAP, PracticePanther, even MyCase all organise around the matter. You're organising around the *human who bills and reports*. That reframes the product from a filing cabinet into a performance instrument. This is your wedge and your defensibility narrative. Protect it.
- **"The pulse the firm opens daily, like Auditus for auditors"** is the correct ambition. Audit software won because it embedded the *methodology*, not just stored the files. Your equivalent methodology is **process-as-template** (go-public, M&A, change-of-control) + **billing capture** + **firm-health telemetry**. Own the methodology, not the storage.
- **Process-driven document lookup that narrows as you pick** is genuinely good UX and maps to how transactional lawyers actually think ("I'm doing a company formation, give me the formation pack in order").

**Where I'd push back hard (your blindspots):**
1. **You're describing a transactional/corporate product but using "case" language.** Corporate/M&A/formation work is *deal/matter* work — documents, checklists, closings. Litigation is *case* work — deadlines, court rules, limitation periods, hearings. These are different products. **Pick transactional-first** (it's where your process-pack idea shines and where GCC corporate volume + billing is) and treat litigation as Phase 3. Trying to do both at launch is how legaltech startups die.
2. **"Maximise billing" is a double-edged sword and a reputational landmine.** Frame it as **"capture every minute you legitimately earned, and never write off recoverable work"** — not "bill more." Build *leakage prevention* (passive time capture, WIP that ages, unbilled-work alerts), not aggressive padding. Bar regulators and GCs notice the difference. Your award story is *integrity + efficiency*, not *extraction*.
3. **Adoption is the entire risk, not the tech.** Lawyers abandon tools that add clicks. The single most important design law in this doc: **every feature must remove a step a lawyer does today, or it must not exist.** Passive-by-default (auto-capture time, auto-suggest the next doc) beats active-by-request every time.
4. **The "Chinese wall" you mention is not a feature — it's the thing that gets you sued if it's wrong.** It has to be a first-class, enforced, auditable access-control primitive, not a checkbox. See §12. Get this wrong once and a firm leaves forever.
5. **Voice-to-draft and AI drafting are table stakes by 2026, not the moat.** Everyone will have it. Your moat is the **firm-specific, jurisdiction-aware template + clause library that improves with every matter** (a compounding data asset), plus the **billing/performance telemetry** nobody else structures. Lead with those.
6. **GDPR is not your compliance story in the GCC.** You'll meet GDPR because EU-linked clients demand it, but your *primary* regimes are **UAE PDPL, DIFC DPL 2020, ADGM DPR 2021, and Saudi PDPL/SDAIA** — and crucially **data residency**. Lead with local. (Cited in §13.)

**The one-line test for every decision:** *Does this make the firm owner trust the number on their dashboard more, or make the lawyer reach for us before reaching for Word/Outlook/WhatsApp?* If neither, cut it.

---

## 2. Positioning & product principles

**Positioning statement:**
> Mizan is the bilingual (EN/AR) practice operating system for GCC law firms. It runs the firm around its lawyers — how they work, what they bill, and how the firm performs — with jurisdiction-aware document automation for UAE & KSA corporate processes, and a real-time firm-health pulse for owners and partners.

**Ten product principles (enforce in code review):**
1. **Lawyer-first object model.** The home object is the *lawyer's day*, not the matter list.
2. **Passive capture beats active entry.** Time, activity, and document lineage are captured automatically; the human confirms, never re-enters.
3. **Process is the unit of automation.** Templates, checklists, and tasks are generated from a *process*, in order.
4. **Every artefact is billable-aware.** Each document action, edit, and AI draft can attach to time/value.
5. **Bilingual & RTL are native.** Arabic is a first-class citizen, not a setting.
6. **The wall is sacred.** Confidentiality and conflict isolation are enforced and audited, never advisory.
7. **The number must be trustworthy.** Every dashboard metric is drillable to its source events.
8. **Mobile is for the partner and the moment.** Owners approve, review, and read the pulse on phone; lawyers draft on desktop. Design for both, optimise each.
9. **Nothing leaves the region without a logged, lawful basis.** Residency and transfer are enforced at the data layer.
10. **The product teaches the methodology.** New lawyers get better because the system encodes how good work is done.

---

## 3. Target users & the firm hierarchy (this is the core model)

Build the org model to flex across all of these from day one. **Roles are capabilities, not titles.**

| Persona | What they need daily | Primary surface |
|---|---|---|
| **Sole practitioner (owner = lawyer)** | Do the work + see the whole firm in one glance | Unified desktop + mobile pulse |
| **Managing partner / firm owner** | Topline firm health: hours, WIP, realisation, files, utilisation, by-lawyer and global | Owner Pulse dashboard (mobile-first) |
| **Partner (with or without a team)** | Their book + their team's WIP, supervision queue, approvals | Partner dashboard + supervision |
| **Associate / lawyer** | Their matters, their drafting, their time, their targets | Lawyer workspace |
| **Legal assistant / paralegal / "legal aid"** | Tasks delegated, document prep, data entry, no privileged-billing rights | Assistant workspace (scoped) |
| **Client** | Status, documents to review/sign, invoices, secure messages | Client portal (white-labelled) |
| **Firm admin / compliance / finance** | Billing, conflicts, residency, audit, user management | Admin console |

**Hierarchy rules:**
- A **firm** has one or more **owners/partners**. A partner may have **0..n lawyers**; a lawyer may have **0..n assistants**. This is a graph, not a fixed tree — model **supervision edges** explicitly (`supervises`, `delegated_by`, `reviews`).
- **Capability sets** (not roles) gate every action: `bill_time`, `approve_invoice`, `final_review`, `unlock_matter`, `cross_wall_request`, `manage_users`, etc. Titles map to default capability bundles; everything is overridable per firm.
- **Work product flows up for review**: assistant → lawyer → partner. The system tracks who touched what, who reviewed, who signed off — feeding both supervision dashboards and the audit log.

---

## 4. Domain model (entities)

Core entities (build as the canonical schema; everything else is a view over these):

- **Firm** (tenant root) → branding, jurisdictions enabled, residency region, billing config, policy pack.
- **User** → person; has capability sets, language pref, bar/registration metadata, utilisation target.
- **SupervisionEdge** → directed relationship between users (supervises / delegates / reviews).
- **Client** (entity or individual) → KYC fields, stored *business name, address, registered details, contacts* (the canonical record that auto-fills templates — your "stored on file" data).
- **Matter** → the engagement. Belongs to a **Process type**. Has responsible lawyer, supervising partner, team, status, value, rate card, **wall group**, jurisdiction, language.
- **Process** (the methodology object) → e.g. *Company Formation, Go Public (IPO), Go Private, Change of Control, M&A, Bankruptcy/Insolvency, Joint Venture, Restructuring*. Defines the **ordered document set**, the **task/checklist template**, milestones, and default roles.
- **DocumentTemplate** → versioned, jurisdiction-tagged, language-tagged, with **merge fields** + **clause slots**. Belongs to one or more Processes; carries an **order index**.
- **DocumentInstance** → a template instantiated into a matter; tracks version lineage, merge source, edits, reviewer, sign status, billable events.
- **Clause** → reusable, tagged, jurisdiction-aware library unit (the compounding asset).
- **TimeEntry / ActivityEvent** → captured work (passive + manual), attributable to user, matter, document, billable flag.
- **WIPItem / Invoice / Disbursement** → the financial spine.
- **Task / Milestone** → generated from Process, assignable, with delay/gap detection.
- **WallGroup / ConflictRecord** → ethical-wall membership + conflict checks.
- **AuditEvent** → append-only, immutable, every state change.

Design every entity with: `firm_id` (tenant), `created_by`, `created_at`, `residency_region`, soft-delete + retention policy, and an audit hook.

---

## 5. The Document Engine — feedback on your idea + the spec

Your instinct is right. Here is the refined model. **This is the signature feature; over-invest here.**

### 5.1 Process-driven template lookup (your "narrowing" idea — keep it, sharpen it)
- The lawyer is *inside a matter* (already scoped to a Process and jurisdiction).
- A **command-bar / lookup** ("⌘K") lets them type a process or document; the candidate list **narrows live** by: current Process → jurisdiction → language → matter stage. So a Company Formation matter in DIFC, in Arabic, surfaces only the DIFC formation pack, in order.
- Show templates **in process order** with status chips (Not started / Drafting / In review / Signed). This *is* the checklist and the document list, unified. Do not separate "checklist" from "documents" — that duplication is a classic legaltech failure.

### 5.2 Drag-and-drop into the matter
- Lawyer drags a file (or picks from template library) onto the matter. On drop, run the **autofill prompt**:
  > *"Populate this document with [Client]'s stored details — business name, address, registered number, signatory, contract terms on file?"* → **Yes / Choose fields / No.**
- On **Yes**: merge canonical Client + Matter data into the template's merge fields; copy the file into the matter; **update the matter's core details** if the document introduces new canonical facts (with a confirm-diff step — never silently overwrite the system of record). Every merge is an audit event and a billable event candidate.

### 5.3 Two editing paths (offer both, always)
1. **Direct edit** — open the instance in the in-app editor (or round-trip to Word with tracked changes preserved). For lawyers who want control.
2. **Wizard** — section-by-section guided editing → **preview final** before commit. For speed, delegation to assistants, and consistency. The wizard edits **sections/clauses**, not raw text, so structure stays intact.

### 5.4 AI draft (smart prompt — typed or voice)
- A **smart prompt** box on every document: the lawyer types or **voice-dictates** ("add a 3-year non-compete limited to the Emirate of Dubai, mutual confidentiality, 30-day cure period") → Mizan drafts into the correct clause slots, **citing which template/clause library it pulled from**.
- Draft is **suggestion-state** until a human with `final_review` capability accepts. Assistant can prepare; lawyer/partner approves. The approval chain is logged.
- **Arabic drafting parity**: the AI prompt and output work in Arabic, including legal register, not just literal translation. Maintain parallel EN/AR clause pairs so a bilingual document stays consistent.
- **Guardrail:** AI never auto-finalises, never auto-sends to client, never crosses a wall. It drafts; humans decide. This is both an ethics and a liability boundary — bake it in.

### 5.5 The compounding asset (the real moat)
- Every accepted edit and clause can be **promoted to the firm clause library** (with partner approval). Over time the firm's own precedent bank grows, jurisdiction- and language-tagged. *This* is what competitors can't copy — it's the firm's accumulated judgement, structured.

---

## 6. Billing, time & WIP engine ("capture, don't pad")

The firm-health story lives or dies here. Reframe "maximise billing" as **"zero leakage."**

- **Passive time capture (default on, lawyer confirms):** track active work against the open matter/document — drafting time, document opens, AI-draft sessions, emails (opt-in), calls (opt-in). End-of-day **"confirm your time" sweep** turns activity into time entries in seconds. *Removing the after-the-fact timesheet is the single biggest adoption driver in legaltech.*
- **Multiple billing models per matter:** hourly, fixed-fee (with internal hour tracking for profitability), capped, retainer, value/milestone. Process packs ship with a **default fee model** (e.g. formation = fixed fee; M&A = hourly + milestones).
- **WIP that ages and nags:** unbilled WIP visibly ages; alerts at thresholds; "you have X hours of recoverable WIP older than N days" on the lawyer and partner dashboards.
- **Leakage alerts:** document finalised but no time captured; matter closed with open WIP; write-down patterns; rate-card mismatches.
- **Realisation & recovery** tracked at lawyer, partner, process, and firm level (billed ÷ worked, collected ÷ billed).
- **Multi-currency, VAT-aware** (UAE 5% VAT, KSA 15% VAT) invoicing; bilingual invoices; e-invoicing readiness (KSA **ZATCA Fatoora** is mandatory — design invoices to be ZATCA-compatible from the start).
- **Disbursements & trust/client-account handling** with strict segregation and audit (regulated money — treat with the same rigor as the wall).

---

## 7. Workflow & automation engine

- **Process templates generate tasks + milestones + documents in order** when a matter is opened. Owner picks "M&A — buy-side"; the matter is pre-populated with the standard sequence.
- **Conditional branches** (e.g. "regulated target → add regulatory-approval workstream").
- **Delay/gap detection** (the blindspot-killer — see §17): the engine knows the expected sequence, so it flags when a step is overdue, a dependency is unmet, a doc is unsigned past a closing date, or a matter has gone quiet.
- **Approvals & handoffs** as explicit workflow states with SLA timers and supervision routing.
- **Automation, not autopilot:** every automated action is reversible, logged, and (where it has legal effect) human-confirmed.

---

## 8. Dashboards — the "Firm Pulse"

Three altitudes, all drillable to source events. Mobile-first for the owner; desktop-dense for the lawyer.

**A. Owner / Managing-Partner Pulse (the daily-open screen):**
- Topline: **billable hours** (today / WTD / MTD / YTD vs target), **WIP** (total, aged buckets), **realisation & collection**, **active matters/files**, **utilisation by lawyer**, **revenue run-rate**, **cases/matters per month & per year**, **matters opened vs closed**.
- Firm-health composite: a single **"firm vitality" index** (utilisation × realisation × WIP-age × pipeline) — your signature glance.
- Heat by lawyer, by process type, by client, by jurisdiction.
- Alerts: leakage, aging WIP, overdue milestones, conflicts pending, residency exceptions.

**B. Partner / Supervisor view:** their book + team WIP, review queue, who's over/under-utilised, what's stuck.

**C. Lawyer workspace:** today's matters, drafting queue, time to confirm, targets vs actuals, **promotion-readiness** signals.

**Performance & promotion recommendations (do this carefully):**
- Surface objective signals: hours, realisation, matter complexity handled, supervision load carried, on-time milestone rate, client feedback. Present as **evidence for a human decision**, explicitly *not* an automated verdict. Frame it as "promotion-readiness dashboard," with bias-aware caveats. (This is also an award-worthy, ethically-defensible differentiator if done as decision-support, not decision-making.)

Every tile: tap → underlying entries. **No black-box numbers.**

---

## 9. Client portal (white-labelled)

- Secure, branded portal: matter status (lawyer-controlled visibility), documents to review/e-sign, invoices & online payment, secure messaging, intake/KYC forms.
- **Granular disclosure:** the lawyer controls exactly what the client sees per matter; default to minimal.
- **E-signature** built in and **legally valid** under UAE Federal Decree-Law 46/2021 (Electronic Transactions & Trust Services) and KSA equivalents — support simple/advanced/qualified signature tiers; use qualified/advanced for documents needing wet-ink equivalence. [See §13.]
- **Bilingual** end-to-end; client picks language.
- Mobile-first (clients live on phones).

---

## 10. White-label & multi-tenancy

- **Tenant = firm.** Hard data isolation per tenant (row-level security + per-tenant encryption keys; consider per-tenant schema for large firms).
- **White-label layers:** firm branding (logo, palette, domain/subdomain, email sender), client-portal theming, optionally a reseller/association tier (e.g. a bar association or network offering Mizan to members).
- **Per-tenant policy pack:** jurisdictions enabled, residency region, retention rules, capability bundles, fee models, template libraries.
- Build tenancy + RLS **before** any feature ships. Retrofitting isolation is a security incident waiting to happen.

---

## 11. Security architecture

- **Identity:** SSO/OIDC + SAML for firms, MFA mandatory, passkeys; SCIM for provisioning.
- **Authorization:** policy-based (capabilities + wall membership + tenant) evaluated centrally; deny-by-default. Every authz decision logged.
- **Encryption:** TLS 1.3 in transit; AES-256 at rest; **per-tenant keys**; field-level encryption for sensitive PII and privileged content; KMS/HSM-backed keys with rotation; consider customer-managed keys for enterprise.
- **Data residency enforced at the persistence layer** (region-pinned storage; see §13). No silent egress.
- **Audit:** immutable, append-only, tamper-evident (hash-chained) log of every access and mutation. Privileged content access is itself an audited event.
- **Tenant isolation** verified by automated tests in CI (no cross-tenant read, ever).
- **Secrets management, dependency scanning, SAST/DAST, pen-test readiness.** Target **ISO 27001** and **SOC 2 Type II** as the trust artefacts GCC enterprise/government clients will ask for.
- **AI boundary:** model providers must not train on firm data; route via region-appropriate endpoints; log every AI call as an audit event; redact privileged content from any telemetry.

---

## 12. The ethical wall / "Chinese wall" (first-class, enforced, audited)

This is a feature you can be *sued over*. Build it as a primitive.

- **WallGroup** isolates matters/clients/teams. Membership is explicit and time-stamped.
- **Default-deny across walls:** a user not in the wall group cannot see, search, surface, autofill from, or even know about walled matters/clients. It must be invisible, not merely locked.
- **Conflict checks at intake:** new client/matter runs against existing clients, adverse parties, and related entities; flags potential conflicts to compliance *before* the matter opens.
- **Cross-wall access requires an explicit, logged, approved request** (`cross_wall_request` capability) with reason and approver — never self-grant.
- **AI respects the wall absolutely:** drafting, search, and clause suggestions never pull from or leak across a wall. The wall boundary is enforced in the retrieval layer, not just the UI.
- **Every wall event is audited** and reportable to the firm's compliance officer and, if needed, a regulator.

---

## 13. Compliance & data architecture (cited — the high-stakes section)

Lead with **GCC local law + residency**; meet GDPR because EU-facing clients demand it. Build all of this as **configurable policy**, region-pinned, and auditable.

### UAE
- **Federal PDPL — Federal Decree-Law No. 45 of 2021**, effective **2 Jan 2022**; the UAE's first federal GDPR-style law. Cross-border transfer (Arts. 22–23) is permitted to jurisdictions the **UAE Data Office** deems "adequate"; note the law historically lacked a contractual-safeguards (SCC-style) mechanism, so transfers can be restrictive — **design for in-region processing by default.** Executive Regulations have been slower to land, so keep transfer logic configurable. ([Securiti overview](https://securiti.ai/uae-personal-data-protection-law/), [Bird & Bird vs GDPR](https://www.twobirds.com/en/insights/2021/uae/how-does-the-new-uae-federal-decree-law-on-personal-data-protection-compare-against-the-gdpr), [Pinsent Masons guide](https://www.pinsentmasons.com/out-law/guides/business-in-the-uae-navigating-data-protection-regime))
- **DIFC Data Protection Law No. 5 of 2020** — GDPR-aligned, **materially amended by DIFC Law No. 1 of 2025** (in force **8 July 2025**): expanded scope, **private right of action**, higher fines, simplified data-sharing. Applies to DIFC entities and processing carried out *in or from* the DIFC. ([Kennedys](https://www.kennedyslaw.com/en/thought-leadership/article/2025/the-dubai-international-financial-centre-amends-the-data-protection-law-emea/), [DIFC official](https://www.difc.com/business/laws-and-regulations/legal-database/difc-laws/data-protection-law-difc-law-no-5-2020), [Bird & Bird](https://www.twobirds.com/en/insights/2025/united-arab-emirates/uae-proposed-amendments-to-the-difc-data-protection-law))
- **ADGM Data Protection Regulations 2021** — GDPR-aligned. **DIFC, ADGM and QFC mutually recognise each other's frameworks**, easing inter-freezone flows. ([ICLG UAE 2025-26](https://iclg.com/practice-areas/data-protection-laws-and-regulations/uae), [Recording Law UAE guide](https://www.recordinglaw.com/world-laws/world-data-privacy-laws/uae-data-privacy-laws/))
- **Implication for Mizan:** a UAE firm may simultaneously touch **mainland PDPL** *and* a **freezone regime (DIFC/ADGM)** depending on where it's registered and where data is processed. Model the applicable regime **per firm and per matter**, and pin storage accordingly.

### Saudi Arabia (KSA)
- **PDPL** enacted **14 Sep 2023**, **fully enforceable 14 Sep 2024**; regulator is **SDAIA**. **Implementing Regulations** published **7 Sep 2023**. ([Morgan Lewis](https://www.morganlewis.com/pubs/2024/09/saudi-arabia-personal-data-protection-law-transition-period-ends-september-14), [IAPP first-anniversary](https://iapp.org/news/a/saudi-pdpl-s-first-anniversary-amendments-enforcement-and-ongoing-developments), [Clyde & Co](https://www.clydeco.com/en/insights/2023/09/saudi-arabia-issues-implementing-regulations))
- **Cross-border transfer:** **Transfer Regulations (Aug 2024)** permit outbound transfer only with conditions/safeguards — adequacy assessment, approved safeguards (SCC/BCR-style), explicit consent in some cases, and **mandatory risk assessment** for continuous/large-scale sensitive-data transfers; SDAIA issued a **Risk Assessment Guideline (Feb 2025)**. ([King & Spalding](https://www.kslaw.com/news-and-insights/international-personal-data-transfers-under-saudi-arabias-data-protection-law), [ITIF](https://itif.org/publications/2025/06/09/saudi-arabia-cross-border-data-transfer-regulation/), [DLA Piper](https://www.dlapiperdataprotection.com/?c=SA))
- **Implication:** for KSA clients/government work, default to **in-Kingdom data residency**; treat any egress as a gated, risk-assessed, logged event.

### E-signature / electronic transactions
- **UAE Federal Decree-Law No. 46 of 2021** (Electronic Transactions & Trust Services) gives electronic signatures the **same evidentiary weight as wet-ink** when reliability/authentication standards are met; recognises **simple / advanced / qualified** tiers (TDRA-overseen). Use **advanced/qualified** for execution-grade documents. ([UAE Gov platform](https://u.ae/en/about-the-uae/digital-uae/regulatory-framework/electronic-transactions-and-trust-services-law), [Taylor Wessing](https://www.taylorwessing.com/en/insights-and-events/insights/2023/09/unlocking-the-world-of-electronic-transactions-and-trust-services-in-the-uae)) KSA has an equivalent Electronic Transactions framework — support both.

### GDPR & global
- Meet **EU GDPR** as a *capability* (DSARs, lawful basis, DPIA, breach notification, RoPA) for firms with EU-linked clients — but present it as one selectable regime among PDPL/DIFC/ADGM/KSA, not the centre of gravity.

### Architecture mandates that fall out of the above
1. **Region-pinned storage** (UAE region, KSA region) selectable per tenant; data does not leave its region without a logged lawful basis.
2. **Regime-as-policy:** each firm/matter carries an applicable-regime tag driving residency, retention, consent, and transfer rules.
3. **Transfer gateway:** any cross-border movement passes a policy check (adequacy / safeguard / consent / risk-assessment) and is logged.
4. **Records of processing, consent ledger, DSAR tooling, breach-notification workflow** built in.
5. **Retention & legal hold** per matter/jurisdiction; defensible deletion.
6. **Compliance is configurable, not hardcoded** — laws change (DIFC already amended in 2025). Policy packs are versioned and updatable without redeploying logic.

> ⚠️ This section reflects sources as of June 2026 and is **engineering guidance, not legal advice.** Have GCC-qualified privacy counsel review the policy packs before go-live, and re-verify each regime at launch — these laws are actively evolving.

---

## 14. (reserved) — Notifications, e-invoicing, integrations

- **E-invoicing:** KSA **ZATCA / Fatoora** compliance for invoices is effectively mandatory — design invoice data model and formats to comply now.
- **Integrations:** email (Outlook/Gmail) for passive capture & filing, calendar, MoJ/court & registry portals where APIs exist (UAE MoJ, DIFC Courts, KSA Najiz), accounting (Zoho/QuickBooks/Xero), e-sign (native + DocuSign fallback), WhatsApp Business (the GCC client channel — huge adoption lever), and document storage.
- **Notifications:** in-app, email, push, and **WhatsApp** (clients) — bilingual, with quiet-hours and channel prefs.

---

## 15. Bilingual (EN / Arabic) & RTL — architectural requirements

- **i18n from line one:** zero hardcoded strings; ICU message format; EN + AR resource bundles; pluralisation and gender handling for Arabic.
- **RTL is structural:** logical CSS properties (`margin-inline-start`, not `margin-left`); mirror layouts, icons, progress, charts; bidi-safe rendering for mixed EN/AR text (common in GCC legal docs — Arabic body, English defined terms).
- **Bilingual documents:** templates and clauses stored as **parallel EN/AR pairs**; a document can be single-language or dual-column bilingual; AI drafting maintains parity.
- **Arabic legal register:** the AI must draft in formal legal Arabic, not literal MT. Maintain a curated Arabic legal lexicon and clause bank.
- **Numerals, dates, calendars:** support Hijri & Gregorian; Eastern/Western Arabic numerals as preference; currency formatting per locale.
- **Search works in both languages** (and across them — Arabic search returns relevant EN clauses and vice versa where mapped).
- **Per-user language**, switchable instantly; document language independent of UI language.

---

## 16. Mobile & app strategy

- **Responsive web app first** (works everywhere day one), then **native-feel mobile apps** (iOS/Android) for the owner/partner pulse, approvals, e-sign, secure messaging, and time confirmation. Consider one codebase (React Native / Expo or Flutter) for app reach.
- **Optimise per surface:** owners *read & approve* on mobile (dense glanceable pulse, push alerts, one-tap approve); lawyers *draft* on desktop (rich editor, multi-pane). Don't force the desktop UI onto a phone.
- **Offline-tolerant** time capture and reading.

---

## 17. Legal blindspots — what actually causes delays & gaps (your differentiator)

You asked what causes delays/gaps. Encode these as **detections** — this is the insight competitors miss because they store cases, they don't *understand process*.

1. **Missing/incomplete intake data** → documents can't autofill, work stalls. *Detect:* matter opened with required canonical fields blank → block-or-warn.
2. **Unsequenced dependencies** → step B started before step A signed (e.g. share transfer before board approval). *Detect:* process-graph dependency violation.
3. **Signature bottlenecks** → docs sit unsigned; closings slip. *Detect:* unsigned-past-target alerts; chase automation.
4. **Approval/supervision queue stalls** → associate done, partner hasn't reviewed. *Detect:* SLA timers on review states.
5. **Conflict found late** → matter unwinds. *Detect:* conflict check *at intake*, not after.
6. **Regulatory/registry waiting** (MoJ, DIFC, ADGM, ZATCA, central bank approvals) treated as invisible dead time. *Detect:* model external-dependency states with expected SLAs and chase reminders.
7. **WIP leakage** → work done, never billed. *Detect:* finalised doc with no time; closed matter with open WIP.
8. **Knowledge loss** → the lawyer who knew the matter is unavailable. *Mitigate:* the matter *is* the knowledge — structured, not in someone's inbox.
9. **Language gaps** → bilingual doc versions drift out of sync. *Detect:* parity check between EN/AR pairs.
10. **Residency/transfer slips** → data moved unlawfully. *Detect:* transfer gateway blocks + logs.

Surface these as a per-matter **"what's blocking this"** panel and a firm-level **delay/leakage report**. *This is genuinely award-worthy and patent-adjacent (see §18).*

---

## 18. IP / patent / awards strategy

You want to win on IP, patents, process, usability. Realistic angles (validate with IP counsel — novelty and jurisdiction matter):

- **Patent-candidate processes (method/system claims):**
  - *Process-graph-driven legal delay & leakage detection* — using an encoded transactional process model to predict/flag stalls and unbilled work (§17). This is your strongest novel-system candidate.
  - *Wall-aware AI retrieval* — clause/precedent suggestion that provably enforces ethical-wall isolation in the retrieval layer (§12).
  - *Bilingual parallel-clause drafting with parity enforcement* (§15) — maintaining legally-consistent EN/AR document pairs via AI.
  - *Passive activity-to-billable reconciliation* — method for converting captured activity into confirmed time with leakage detection (§6).
- **Defensive/strategic:** file provisionals on the above *methods* early; keep the **clause-library data asset** and **process packs** as trade secrets (the compounding moat that doesn't need patenting).
- **Trademarks & brand:** secure name + Arabic mark across GCC classes.
- **Awards positioning:** target legaltech/regtech and GovTech awards in UAE/KSA (GITEX, LEAP, regional legal-innovation awards). The award narrative: *"the first practice OS built bilingually for GCC corporate law, that prevents delay and leakage by encoding process — not just storing files."* Usability + measurable efficiency + local-compliance-by-design is the trifecta judges reward.

---

## 19. Recommended tech stack (for Claude Code)

Optimise for: multi-tenancy, residency, audit, RTL, AI, and GCC cloud regions.

- **Frontend:** TypeScript + React (Next.js) web; design system with logical-properties/RTL baked in; Tailwind (with RTL plugin) or a tokens system; TanStack Query. Charts via a lib with RTL support. Native: React Native/Expo sharing logic.
- **Backend:** TypeScript (NestJS) **or** Go for the core services; PostgreSQL with **row-level security** for tenancy; an append-only **audit/event store** (Postgres + hash-chaining, or an event-sourced log). Redis for queues/cache.
- **AI layer:** provider-abstracted (so you can route to region-appropriate / non-training endpoints); retrieval layer that is **wall-aware and tenant-scoped**; embeddings store with strict tenant + wall partitioning; **no firm data used for training**.
- **Documents:** server-side DOCX templating with merge fields + clause slots; tracked-changes round-trip; PDF render; e-sign integration.
- **Infra:** cloud with **UAE and KSA regions** (e.g. providers with Dubai/Riyadh/Jeddah regions); per-tenant region pinning; IaC; per-tenant KMS keys; full observability with PII-safe logging.
- **Compliance posture:** ISO 27001 + SOC 2 controls from day one; data-residency tests and tenant-isolation tests in CI as blocking checks.

(Stack is a recommendation — Claude Code may propose alternatives in an ADR, but must preserve: tenancy isolation, residency pinning, audit-from-commit-1, RTL-native, wall-aware AI.)

---

## 20. Build roadmap & vertical slices

**Phase 0 — Foundations (non-negotiable, build first):**
Multi-tenancy + RLS, identity/MFA, capability-based authz, append-only audit, region-pinned storage, i18n/RTL scaffolding, policy-pack engine. *No product feature ships before these.*

**Phase 1 — The vertical slice: Company Formation, end-to-end (UAE mainland + DIFC):**
Firm/user/client/matter model → Process pack (Formation) with ordered templates → ⌘K narrowing lookup → drag-drop + autofill from canonical Client record → direct edit + wizard + AI smart-prompt (EN/AR) → passive time capture + WIP → Owner Pulse dashboard (real numbers from real events) → client portal with e-sign. **Definition of done: a sole practitioner can run a real formation from intake to signed docs to invoice, in Arabic or English, with the owner watching live WIP.**

**Phase 2 — Widen processes & firm scale:**
Add Change-of-Control, M&A (buy/sell-side), JV, Restructuring packs. Partner/supervision hierarchy + review queues. Ethical-wall + conflicts engine. Leakage/delay detection (§17). KSA region + Saudi PDPL policy pack + ZATCA invoicing.

**Phase 3 — Depth & moat:**
Promotion-readiness analytics, firm-vitality index, white-label/reseller tier, deeper integrations (registries, WhatsApp, accounting), clause-library promotion & analytics, native mobile apps, litigation/case module (deadlines, court rules) as a *separate* product line.

**Phase 4 — Scale & trust artefacts:**
ISO 27001 / SOC 2 certification, customer-managed keys, advanced reporting, marketplace of process packs, association/white-label partnerships.

---

## 21. Definition of done (apply every phase)

A feature is done only when: bilingual EN/AR + RTL verified · tenant-isolated (CI test proves no cross-tenant read) · residency-pinned · every state change audited · wall-respecting · drillable to source (no black-box number) · removes a step a lawyer does today (not adds one) · works on mobile for the relevant persona · has a reversible/confirm step for any legally-effective action.

---

## 22. What you're still missing to win the GCC (the punch list)

1. **A named design-partner firm in each market (one UAE, one KSA) before you build Phase 2.** Co-build the formation slice with a real firm. Adoption proof beats features.
2. **Arabic legal-content depth.** Your clause/template bank in formal Arabic is a hire/partnership, not a translation job. This is a moat *and* a bottleneck — start now.
3. **Government & enterprise trust artefacts early** (ISO 27001/SOC 2, in-region hosting) — GCC government and large-firm procurement will gate on these.
4. **WhatsApp as a first-class client channel.** In the GCC this is how clients actually communicate. Competitors treat it as an afterthought; make it native (compliantly).
5. **ZATCA/e-invoicing and VAT correctness** — boring, mandatory, and a reason firms switch *to* you.
6. **A migration story** off Clio/LEAP/Word-folders — importers + white-glove onboarding. Switching cost is the enemy; you must lower *theirs* and raise the *next vendor's*.
7. **Ethical-wall and conflicts done provably right** — this is what makes a top-tier firm trust you with their whole practice.
8. **Sole-practitioner self-serve + firm-tier sales** as two motions — the sole practitioner is your viral bottom-up wedge; the multi-partner firm is your revenue.
9. **A measurable efficiency claim** ("firms recover X% more WIP, close formations Y days faster") — instrument it from day one so your award submissions and sales deck have real numbers.
10. **Legal-advice disclaimer & professional-responsibility posture** — Mizan automates *process and drafting*, the lawyer provides *judgement*. Keep that line bright in product copy, AI behaviour, and liability terms.

---

*End of spec. Sources for the compliance section are linked inline in §13. Re-verify all regime details with GCC-qualified counsel at launch — these laws are evolving (DIFC was amended mid-2025; KSA transfer rules and guidelines landed 2024–2025).*
