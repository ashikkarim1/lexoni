# Lexoni.ai

**The practice operating system for GCC law firms — UAE, Saudi Arabia, and the wider region.**

Matters · Document automation · Time & billing · Engagement letters · Client portal · Compliance · Marketplace · Knowledge base — in one bilingual (EN/AR), residency-pinned workspace, built around the lawyer and the firm's health.

---

## What this scaffold contains

A runnable Next.js 14 + Tailwind + Drizzle scaffold of Lexoni.ai. Every nav item has a page, every entity is in the data model, every module has wired mock data so the UI boots immediately.

```
legalos/
├── app/
│   ├── (dashboard)/              # all in-app pages
│   │   ├── dashboard/            # KPIs, compliance calendar, risk dashboard
│   │   ├── companies | directors | officers | shareholders | captable | ownership
│   │   ├── governance/board | resolutions | agm | voting | approvals
│   │   ├── ai/draft | review | compare | clauses | research
│   │   ├── contracts | contracts/signatures | renewals | obligations | risk
│   │   ├── compliance/uae | saudi | calendar | licenses | regulatory
│   │   ├── cases                 # NEW — case management
│   │   ├── billing               # NEW — time tracking + invoices
│   │   ├── firm-dashboard        # NEW — law-firm cockpit
│   │   ├── portal                # NEW — client portal w/ structured info requests
│   │   ├── gdpr                  # NEW — GDPR / UAE PDPL / KSA PDPL
│   │   ├── marketplace/*
│   │   ├── funds/* | ma/*
│   │   └── settings
│   ├── layout.tsx                # RTL + i18n + theme
│   └── globals.css
├── components/
│   ├── nav/{Sidebar, Topbar}.tsx # role-aware
│   ├── ui/{Card, Kpi, Table, Badge, PageHeader}.tsx
│   └── modules/StubPage.tsx
├── lib/
│   ├── auth/session.ts           # role + tenant-kind aware
│   ├── db/schema.ts              # full Drizzle schema (~30 tables)
│   ├── i18n/{en.json, ar.json, index.ts}
│   ├── mock/index.ts             # demo data for every module
│   └── utils/cn.ts
├── drizzle.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## Run it

```bash
cd legalos
cp .env.example .env.local
npm install
npm run dev         # http://localhost:3000
```

Mock data renders immediately — no DB needed to explore the UI. For real data:

```bash
npm run db:push     # syncs schema to your Postgres
```

## Design system

| Token        | Value      |
|--------------|------------|
| Primary      | `#0F172A` (Midnight) |
| Brand        | `#2563EB` (Royal Blue) |
| Success      | `#16A34A` |
| Warning      | `#F59E0B` |
| Danger       | `#DC2626` |
| Background   | `#F8FAFC` |
| Radius       | `12px`     |
| Type         | Inter (Latin) + IBM Plex Sans Arabic |

Same density, card grammar, and dashboard hierarchy as Auditus (layout/framework reference only — branding, colours, and graphics are original).

## Multi-tenant model

| `tenant_kind` | Who                    | Sees                                            |
|---------------|------------------------|-------------------------------------------------|
| `firm`        | Law firm               | Cases, billing, firm-dashboard, all corp-sec    |
| `client`      | Operating company / FO | Their entities, contracts, compliance, portal   |
| `ops`         | Platform staff         | Everything (audit + support)                    |

**One firm has many lawyers**, lawyers can have helpers:

| Role             | What they can do                                                  |
|------------------|-------------------------------------------------------------------|
| `firm_admin`     | Manage the firm — billing, reports, team, rates, integrations     |
| `lawyer`         | Run matters, draft, sign, bill time                               |
| `lawyer_helper`  | Assist a specific lawyer (paralegal/assistant). Cannot see firm-wide billing reports. |
| `client_admin`   | Client-side legal-ops lead                                         |
| `client_member`  | Client team member                                                 |
| `client_viewer`  | Read-only (e.g. board observer)                                    |

The sidebar hides modules a role shouldn't see (see `lib/auth/session.ts → canSee`).

## Case management

`cases` table covers litigation, advisory, regulatory, IP, M&A, employment, tax, and real estate. Each matter has:

- Conflicts check + clearance timestamp
- Lead lawyer + multi-party assignments (`case_assignments`) with billing splits
- Budget, fee arrangement (hourly / fixed / retainer / contingency)
- Versioned documents (`case_documents.version` + `is_current`)
- Event log (hearings, filings due, calls, status changes)

## Billing & time

- `time_entries` — minute-level tracking, billable flag, rate snapshot
- `expenses` — disbursements
- `invoices` — VAT-aware (UAE & KSA 5%), multi-currency, drafted from unbilled time
- `payments` — partial payments, escrow, card, bank

Realization, utilization, A/R aging, and per-lawyer dashboards in `/billing` and `/firm-dashboard`.

## Compliance (region-aware)

| UAE                        | KSA                       |
|----------------------------|----------------------------|
| ADGM, DIFC, DMCC, IFZA, DED, RAKEZ | MISA, Qiwa, Muqeem, ZATCA  |

`compliance_tasks` carries `region` and `regulator` so the dashboard, calendar, and AI auto-context the right templates.

## Data & Privacy (GDPR + PDPL)

`gdpr/` module covers:

- **Article 30 RoPA** — `data_processing_activities`
- **Lawful basis** — enum: consent · contract · legal obligation · vital interest · public task · legitimate interest
- **Consent register** — `consent_records` with grant/revoke evidence
- **DSRs** — access · rectification · erasure · restriction · portability · objection (30-day statutory clock)
- **Data residency** — UAE primary, KSA replica, EU DR
- **Append-only audit log** — `audit_log` records every view/create/update/delete/export/sign

## Client portal (replaces email)

`info_requests` lets a firm send a typed form to a client. The client fills it in the portal; responses save into the matter with full audit. No more "can you send us the UBO declaration" email loops.

## Versioning

`contracts` / `clauses` / `resolutions` / `case_documents` / `deal_room_docs` all use `(parent_id, version, is_current)` so every change is preserved.

## i18n / RTL

`<html dir>` flips on locale; Tailwind logical properties (`ps-` / `pe-` / `border-s-` / `border-e-`) are used throughout so the entire UI mirrors cleanly in Arabic. Strings in `lib/i18n/{en,ar}.json`.

## White-label

Every firm tenant gets its own brand at its own domain:

- **Custom domain** — `portal.<firm>.com`, CNAME to `cname.lexoni.ai`, SSL auto-provisioned.
- **Subdomain fallback** — `<firm>.lexoni.ai` if no custom domain.
- **Logo, colours, font, "Powered by" toggle.**
- **Verified sender identity** — SPF + DKIM + DMARC on the firm's domain so welcome emails, engagement letters, and reminders go out from `no-reply@<firm>.com`, not from Lexoni.ai.
- **Custom intake slug** — `lexoni.ai/intake/<slug>` for direct linking.

Configured in [/settings/branding](legalos/app/(dashboard)/settings/branding/page.tsx), backed by `firm_branding` in [the schema](legalos/lib/db/schema.ts).

### Strict tenant isolation

A request to a white-labelled domain resolves to exactly one tenant before any session is read — see [`lib/auth/tenant.ts → resolveHostTenant`](legalos/lib/auth/tenant.ts). All Drizzle queries are scoped to `session.tenantId` via the `scoped()` helper. **A firm never sees another firm's data, period.**

## New-client intake (plain English → routed lawyer)

The public-facing intake page ([app/(portal)/intake/page.tsx](legalos/app/(portal)/intake/page.tsx)) lets a prospect describe their need in plain English. AI classifies the (sector, legal function, urgency, language), then the routing engine picks the best-fit lawyer.

**Flow:**
1. Prospect submits intake → `intake_requests` row created with `ai_sector`, `ai_function`, `ai_confidence`, `ai_urgency`.
2. **Welcome-email automation** fires (`on_intake_received`) — branded with the firm's logo + sender identity.
3. **Routing engine** ([`lib/ai/routing.ts`](legalos/lib/ai/routing.ts)) evaluates rules top-down by priority; first match wins, with the top-3 expertise-scored lawyers as alternates.
4. Triage queue surfaces in [/intake](legalos/app/(dashboard)/intake/page.tsx); partner confirms or re-routes.
5. On assignment, an **engagement letter** is auto-drafted by [`lib/ai/engagement.ts`](legalos/lib/ai/engagement.ts) using the firm's template, region, fee matrix, and the intake summary.
6. Partner countersigns → letter sent to client for e-signature → on execution, a `cases` row is opened and billing starts.

### Routing rules

Configurable in [/settings/routing](legalos/app/(dashboard)/settings/routing/page.tsx). Each rule matches on **sector × legal function × region** and assigns to a specific lawyer (with optional fallback). Example shipped rules:

| Priority | Rule | Sector | Function | Region | → |
|---|---|---|---|---|---|
| 10 | Fintech fundraising → Sara          | fintech                    | fundraising, vc_pe       | UAE | Sara |
| 20 | Real-estate disputes → Mohammed     | real_estate                | litigation, arbitration  | UAE | Mohammed |
| 30 | KSA healthcare M&A → Aisha          | healthcare                 | ma, regulatory           | KSA | Aisha |
| 40 | Fund formation → Sara               | fund_gp, fund_lp           | fundraising, regulatory  | UAE+KSA | Sara |
| 50 | KSA tax / ZATCA → Aisha             | energy, mfg, logistics     | tax, regulatory          | KSA | Aisha |
| 999| Default fallback                    | any                        | any                      | any | Sara |

If no rule matches, the engine scores lawyers from `lawyer_expertise` on (sector +35, function +35, region +20, language +10) and returns the top match plus the next three as alternates.

## Automations

Configurable in [/settings/automations](legalos/app/(dashboard)/settings/automations/page.tsx). Shipped recipes:

| Trigger | Kind | What it does |
|---|---|---|
| `on_intake_received` | `welcome_email`      | Branded welcome to the prospect within 60 seconds |
| `on_intake_received` | `intake_ack`         | Internal Slack/email to on-duty partner |
| `on_matter_opened`   | `engagement_letter`  | AI-drafts the engagement letter from the intake + firm template |
| `on_filing_due`      | `filing_reminder`    | 7-day reminder to the assignee with the regulator's checklist |
| `on_contract_renewal`| `renewal_alert`      | 60/30/14-day alerts before notice deadline |
| `on_invoice_overdue` | `invoice_dunning`    | 7/14/30-day chase with branded template |
| `on_dsr_received`    | `dsr_acknowledgement`| Immediate ack to the data subject with the 30-day clock start |

Each run is logged to `automation_runs` so you can audit every email and reminder that ever fired.

## E-signature

Engagement letters use the built-in e-signature flow (`engagement_letters.signature_cert_hash` + `client_ip` + `client_user_agent`) which is ADGM ETC-compliant and produces an audit certificate. Same flow available for contracts and resolutions via the `signatures` table.

## What's next

This scaffold renders. To take it to production:

1. **Connect Postgres** — point `DATABASE_URL`, run `npm run db:push`.
2. **Replace mock store** — swap `lib/mock` imports for Drizzle queries (server components only).
3. **Wire AI** — `app/api/ai/*` with `@anthropic-ai/sdk` for `/ai/draft` and `/ai/review` (region-aware system prompts already drafted).
4. **Auth** — drop in NextAuth or Clerk and replace `getSession()` with the real reader.
5. **E-sign** — DocuSign / Adobe Sign / built-in ECDSA with hash anchoring.
6. **Marketplace messaging** — encrypted channel per provider.

— Built to be the most trusted legal and governance platform in the GCC.
