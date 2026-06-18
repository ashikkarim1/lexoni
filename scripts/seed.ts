/* eslint-disable no-console */
/**
 * Sprint 1.1 — seed the demo data that mirrors lib/mock.
 *
 *   DATABASE_URL=postgres://...  npm run db:push && npm run seed
 *
 * Idempotent: re-running without --reset is a no-op when the seed tenant
 * already exists; pass `--reset` to drop the seeded tenant + users and
 * recreate from scratch.
 *
 * What lands in the DB (mirroring lib/mock.matterWorkspaces):
 *   - one firm tenant (Levant Legal Partners)
 *   - five users + memberships, with the two helper supervision edges
 *   - two processes (Company Formation / DIFC, Joint Venture / DMCC)
 *     each with steps (one per stage) + ordered document slots
 *   - two cases instantiating those processes (Meridian Tech, Falcon × Nimbus)
 *   - the matter_document_slots in their mock statuses/assignees
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** Tsx doesn't auto-load .env.local; do it here so `npm run seed` Just Works. */
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local and re-run.");
  process.exit(1);
}

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import * as s from "../lib/db/schema";
import { matterWorkspaces, timeToConfirm } from "../lib/mock";
import { KSA_GO_PUBLIC_META, KSA_GO_PUBLIC_SLOTS, KSA_GO_PUBLIC_STEPS } from "../lib/processes/ksa_go_public";

const RESET = process.argv.includes("--reset");
const TENANT_NAME = "Levant Legal Partners";

type UserSpec = {
  email: string;
  fullName: string;
  locale: string;
  role: (typeof s.userRoleEnum.enumValues)[number];
  reportsToEmail?: string;
  hourlyRateCents?: number;
};

const USERS: UserSpec[] = [
  { email: "sara@levant-legal.ae",     fullName: "Sara Al-Mansoori", locale: "en", role: "firm_admin",    hourlyRateCents: 650_00 },
  { email: "mohammed@levant-legal.ae", fullName: "Mohammed Khan",    locale: "en", role: "lawyer",        hourlyRateCents: 450_00 },
  { email: "aisha@levant-legal.ae",    fullName: "Aisha Al-Otaibi",  locale: "en", role: "lawyer",        hourlyRateCents: 420_00 },
  { email: "yusuf@levant-legal.ae",    fullName: "Yusuf Ibrahim",    locale: "en", role: "lawyer_helper", reportsToEmail: "mohammed@levant-legal.ae", hourlyRateCents: 150_00 },
  { email: "hala@levant-legal.ae",     fullName: "Hala Mahmoud",     locale: "en", role: "lawyer_helper", reportsToEmail: "sara@levant-legal.ae",     hourlyRateCents: 140_00 },
];

const PROCESSES_TO_SEED = [
  {
    mockId: "pr_form",
    kind: "company_formation" as const,
    title: "Company Formation",
    titleAr: "تأسيس شركة",
    region: "UAE" as const,
    jurisdiction: "DIFC",
    defaultFeeModel: "fixed",
    expectedDurationDays: 21,
  },
  {
    mockId: "pr_jv",
    kind: "joint_venture" as const,
    title: "Joint Venture",
    titleAr: "مشروع مشترك",
    region: "UAE" as const,
    jurisdiction: "DMCC",
    defaultFeeModel: "fixed",
    expectedDurationDays: 60,
  },
];

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  const db = drizzle(client, { schema: s });

  try {
    const existing = await db
      .select({ id: s.tenants.id })
      .from(s.tenants)
      .where(eq(s.tenants.name, TENANT_NAME));

    if (existing.length > 0) {
      if (!RESET) {
        console.log(`Tenant "${TENANT_NAME}" already exists. Pass --reset to re-seed.`);
        return;
      }
      console.log(`Resetting: dropping tenant "${TENANT_NAME}" + seeded users…`);
      await db.delete(s.tenants).where(eq(s.tenants.id, existing[0].id));
    }

    // Clear any orphan seeded users (covers partial prior runs even without --reset).
    await db.delete(s.users).where(inArray(s.users.email, USERS.map((u) => u.email)));

    // ── 1. Tenant ───────────────────────────────────────────────────────
    const [tenant] = await db
      .insert(s.tenants)
      .values({
        kind: "firm",
        name: TENANT_NAME,
        region: "UAE",
        locale: "en",
        dataResidency: "UAE",
        brand: { primary: "#2563EB" },
      })
      .returning({ id: s.tenants.id });
    console.log(`✓ tenant ${tenant.id}`);

    // ── 2. Users + memberships (with supervision edges) ────────────────
    const userByEmail = new Map<string, string>();
    for (const u of USERS) {
      const [row] = await db
        .insert(s.users)
        .values({ email: u.email, fullName: u.fullName, locale: u.locale })
        .returning({ id: s.users.id });
      userByEmail.set(u.email, row.id);
    }
    for (const u of USERS) {
      await db.insert(s.memberships).values({
        userId: userByEmail.get(u.email)!,
        tenantId: tenant.id,
        role: u.role,
        reportsToUserId: u.reportsToEmail ? userByEmail.get(u.reportsToEmail) : undefined,
        hourlyRateCents: u.hourlyRateCents,
      });
    }
    console.log(`✓ ${USERS.length} users + memberships`);

    // ── 3. Processes + steps + slots, derived from the mock workspaces ─
    const procByMockId = new Map<string, { processId: string; slotIdsByOrdinal: Map<number, string> }>();

    for (const p of PROCESSES_TO_SEED) {
      const [proc] = await db
        .insert(s.processes)
        .values({
          tenantId: tenant.id,
          kind: p.kind,
          title: p.title,
          titleAr: p.titleAr,
          region: p.region,
          jurisdiction: p.jurisdiction,
          language: "en",
          defaultFeeModel: p.defaultFeeModel,
          expectedDurationDays: p.expectedDurationDays,
          version: 1,
          isCurrent: true,
          active: true,
        })
        .returning({ id: s.processes.id });

      const source = matterWorkspaces.find((m) => m.processId === p.mockId);
      if (!source) throw new Error(`No mock workspace for process ${p.mockId}`);

      // One step per unique stage, in first-seen order. Each step depends on the prior.
      const stages = Array.from(new Set(source.slots.map((sl) => sl.stage)));
      const stepByStage = new Map<string, string>();
      for (const [ix, stage] of stages.entries()) {
        const [step] = await db
          .insert(s.processSteps)
          .values({
            processId: proc.id,
            ordinal: ix + 1,
            name: stage,
            ownerRole: "lawyer",
            dependsOnOrdinals: ix > 0 ? [ix] : [],
            isMilestone: stage === "Closing",
          })
          .returning({ id: s.processSteps.id });
        stepByStage.set(stage, step.id);
      }

      const slotIdsByOrdinal = new Map<number, string>();
      for (const sl of source.slots) {
        const [slot] = await db
          .insert(s.processDocumentSlots)
          .values({
            processId: proc.id,
            stepId: stepByStage.get(sl.stage),
            ordinal: sl.ordinal,
            title: sl.title,
            expectedKind: sl.expectedKind,
            required: sl.required,
            stage: sl.stage,
          })
          .returning({ id: s.processDocumentSlots.id });
        slotIdsByOrdinal.set(sl.ordinal, slot.id);
      }

      procByMockId.set(p.mockId, { processId: proc.id, slotIdsByOrdinal });
    }
    console.log(`✓ ${PROCESSES_TO_SEED.length} processes + steps + slots`);

    // ── 4. Cases + matter_processes + matter_document_slots ────────────
    const userByName = new Map<string, string>();
    for (const u of USERS) userByName.set(u.fullName, userByEmail.get(u.email)!);

    for (const mw of matterWorkspaces) {
      const procEntry = procByMockId.get(mw.processId);
      if (!procEntry) continue;

      const [caseRow] = await db
        .insert(s.cases)
        .values({
          tenantId: tenant.id,
          matterNumber: mw.matterNumber,
          title: mw.title,
          matterType: "corporate",
          status: "open",
          region: mw.region,
          jurisdiction: mw.jurisdiction,
          description: `${mw.client} · ${mw.feeModel}`,
          leadLawyerId: userByName.get(mw.lead),
          openedAt: new Date(),
        })
        .returning({ id: s.cases.id });

      const [mp] = await db
        .insert(s.matterProcesses)
        .values({
          tenantId: tenant.id,
          caseId: caseRow.id,
          processId: procEntry.processId,
          processVersion: 1,
          targetCloseAt: new Date(mw.targetCloseAt),
          progressPct: mw.progressPct,
        })
        .returning({ id: s.matterProcesses.id });

      for (const sl of mw.slots) {
        await db.insert(s.matterDocumentSlots).values({
          tenantId: tenant.id,
          matterProcessId: mp.id,
          slotId: procEntry.slotIdsByOrdinal.get(sl.ordinal),
          ordinal: sl.ordinal,
          title: sl.title,
          status: sl.status,
          autofilledFromClient: sl.autofilled,
          assignedToUserId: userByName.get(sl.assignee),
          dueAt: new Date(sl.dueAt),
        });
      }
    }
    console.log(`✓ ${matterWorkspaces.length} matters + matter_processes + matter_document_slots`);

    // ── 5. Firm clause library (EN + AR) — AI smart-prompt context ────
    // Wall-permitted clauses surfaced into /api/ai/draft when a lawyer prompts.
    const CLAUSES = [
      { title: "ADGM arbitration seat — preferred wording",
        bodyMd: "Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration under the Arbitration Rules of the Abu Dhabi Global Market Arbitration Centre, which Rules are deemed to be incorporated by reference. The seat of the arbitration shall be the Abu Dhabi Global Market. The language of the arbitration shall be English.",
        region: "UAE" as const, language: "en", tags: ["arbitration", "ADGM"] },
      { title: "DIFC drag-along — Series A standard",
        bodyMd: "If holders of a majority of the Series A Preferred Shares (the 'Selling Investors') propose to Transfer all of their Shares to a bona fide third-party purchaser in a transaction not constituting an Excluded Transfer, each remaining Shareholder shall, if required by the Selling Investors, Transfer all of its Shares to such third-party purchaser on the same terms and at the same per-share consideration.",
        region: "UAE" as const, language: "en", tags: ["drag-along", "DIFC"] },
      { title: "بند المنافسة المحظورة — السعودية ١٢ شهراً",
        bodyMd: "يلتزم الموظف بألا يعمل لدى أي منافس أو يشارك في أي نشاط منافس لنشاط صاحب العمل داخل المملكة العربية السعودية لمدة اثني عشر (12) شهراً من تاريخ انتهاء علاقة العمل، وذلك في النطاق الجغرافي والمهني المحدد في الملحق المرفق.",
        region: "KSA" as const, language: "ar", tags: ["non-compete", "KSA", "employment"] },
      { title: "Confidentiality — mutual, bilateral",
        bodyMd: "Each Party shall treat as strictly confidential all information of the other Party disclosed in connection with this Agreement and shall not, without the other Party's prior written consent, disclose any such information to any third party, save where required by law, regulation, or order of a court of competent jurisdiction.",
        region: "GLOBAL" as const, language: "en", tags: ["confidentiality", "NDA"] },
      { title: "بند السرية المتبادلة",
        bodyMd: "يلتزم كل طرف بالحفاظ على السرية التامة لجميع المعلومات التي يفصح عنها الطرف الآخر بموجب هذه الاتفاقية، وألا يكشف عنها لأي طرف ثالث دون موافقة كتابية مسبقة من الطرف الآخر، باستثناء ما يقتضيه القانون أو أمر قضائي صادر عن محكمة مختصة.",
        region: "GLOBAL" as const, language: "ar", tags: ["confidentiality", "NDA"] },
      { title: "Sharia-compliant profit share — Mudaraba",
        bodyMd: "The Rab al-Mal shall provide the entire Capital and shall bear all financial losses save where such losses arise from the Mudarib's misconduct or negligence. Profits arising from the venture shall be distributed in accordance with the agreed ratio set out in Schedule 1 and shall not be guaranteed by the Mudarib.",
        region: "GLOBAL" as const, language: "en", tags: ["sharia", "finance", "mudaraba"] },
    ];
    for (const c of CLAUSES) {
      await db.insert(s.clauses).values({
        tenantId: tenant.id,
        title: c.title,
        bodyMd: c.bodyMd,
        region: c.region,
        language: c.language,
        tags: c.tags,
        usageCount: 0,
        version: 1,
      });
    }
    console.log(`✓ ${CLAUSES.length} firm clauses (EN + AR)`);

    // ── 6. Passive time: activity_events + time_entry_drafts ──────────
    // Sources mirror lib/mock.timeToConfirm. Each draft links to the activity
    // that produced it, the matter (by matterNumber), and the lawyer who owns
    // the matter (so it lands on their Desk). tc4 references a matter we don't
    // seed (2026-0142 — Alistair v. Orion) and is skipped.
    const seededCases = await db
      .select({ id: s.cases.id, matterNumber: s.cases.matterNumber, leadLawyerId: s.cases.leadLawyerId })
      .from(s.cases)
      .where(eq(s.cases.tenantId, tenant.id));
    const caseByMatterNo = new Map(seededCases.map((c) => [c.matterNumber, c]));

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let activityCount = 0;
    let draftCount = 0;
    for (const t of timeToConfirm) {
      const c = caseByMatterNo.get(t.matterNumber);
      if (!c || !c.leadLawyerId) continue;
      const endedAt = new Date(now.getTime() - 30 * 60 * 1000);
      const startedAt = new Date(endedAt.getTime() - t.minutes * 60 * 1000);
      const [ev] = await db.insert(s.activityEvents).values({
        tenantId: tenant.id,
        userId: c.leadLawyerId,
        caseId: c.id,
        source: t.source as (typeof s.activitySourceEnum.enumValues)[number],
        startedAt,
        endedAt,
        durationSeconds: t.minutes * 60,
        summary: t.activity,
      }).returning({ id: s.activityEvents.id });
      activityCount += 1;

      await db.insert(s.timeEntryDrafts).values({
        tenantId: tenant.id,
        userId: c.leadLawyerId,
        caseId: c.id,
        source: "passive",
        workedOn: startedAt,
        minutes: t.minutes,
        description: t.activity,
        billable: true,
        activityEventId: ev.id,
      });
      draftCount += 1;
    }
    console.log(`✓ ${activityCount} activity_events + ${draftCount} time_entry_drafts`);

    // ── 7. Some already-confirmed time_entries → meaningful WIP ───────
    // Spread across the seeded matters and lead lawyers so Firm Pulse and Desk
    // both have a non-trivial recoverable / WIP number to render.
    const confirmedEntries: Array<{ matterNumber: string; minutes: number; rateCents: number; description: string; daysAgo: number }> = [
      { matterNumber: "2026-0210", minutes: 180, rateCents: 65000, description: "Draft engagement letter + intake review",          daysAgo: 14 },
      { matterNumber: "2026-0210", minutes: 120, rateCents: 65000, description: "KYC / UBO review and shareholder verification",   daysAgo: 12 },
      { matterNumber: "2026-0210", minutes:  90, rateCents: 65000, description: "Revisions to Memorandum of Association",          daysAgo:  6 },
      { matterNumber: "2026-0210", minutes:  45, rateCents: 14000, description: "Compile register of directors (paralegal)",       daysAgo:  4 },
      { matterNumber: "2026-0214", minutes: 150, rateCents: 45000, description: "Term sheet negotiation — JV economics",           daysAgo: 10 },
      { matterNumber: "2026-0214", minutes:  75, rateCents: 45000, description: "JV agreement first draft + party comments",       daysAgo:  3 },
    ];
    for (const e of confirmedEntries) {
      const c = caseByMatterNo.get(e.matterNumber);
      if (!c || !c.leadLawyerId) continue;
      const workedOn = new Date(now.getTime() - e.daysAgo * 24 * 60 * 60 * 1000);
      await db.insert(s.timeEntries).values({
        tenantId: tenant.id,
        caseId: c.id,
        userId: c.leadLawyerId,
        workedOn,
        minutes: e.minutes,
        description: e.description,
        rateCents: e.rateCents,
        billable: true,
        source: "manual",
        confirmedAt: workedOn,
      });
    }
    console.log(`✓ ${confirmedEntries.length} confirmed time_entries (unbilled WIP)`);

    // ── 8. Tenant settings (policy toggles for walls + exports) ───────
    await db.insert(s.tenantSettings).values({
      tenantId: tenant.id,
      partnerVisibility: "assigned_only",
      requireExportReason: true,
      conflictsCheckRequired: true,
    });
    console.log(`✓ tenant_settings (walls + export-reason ON, conflicts required)`);

    // ── 9. Ethical wall around Falcon × Nimbus JV ─────────────────────
    // Falcon Trade DMCC is also a represented client; the JV between Falcon
    // and Nimbus carries cross-deal sensitivity, so the matter is isolated.
    // Inside: Mohammed (lead) + Yusuf (helper) + Sara (firm_admin supervisor).
    // Aisha + Hala are deliberately NOT in — they get a default-deny.
    const jvCase = caseByMatterNo.get("2026-0214");
    if (jvCase) {
      const sara = userByEmail.get("sara@levant-legal.ae")!;
      const mohammed = userByEmail.get("mohammed@levant-legal.ae")!;
      const yusuf = userByEmail.get("yusuf@levant-legal.ae")!;

      const [wall] = await db.insert(s.wallGroups).values({
        tenantId: tenant.id,
        name: "Falcon × Nimbus — JV ethical wall",
        reason: "Falcon Trade DMCC is also represented elsewhere; JV economics must not cross-pollinate other Falcon matters.",
        createdByUserId: sara,
      }).returning({ id: s.wallGroups.id });

      // Matter inside the wall
      await db.insert(s.wallMemberships).values({
        wallGroupId: wall.id,
        caseId: jvCase.id,
        addedByUserId: sara,
      });
      // Lawyers inside the wall
      for (const userId of [sara, mohammed, yusuf]) {
        await db.insert(s.wallMemberships).values({
          wallGroupId: wall.id,
          userId,
          addedByUserId: sara,
        });
      }

      // One pending access request from a non-member (Aisha wants in to advise on KSA structuring).
      const aisha = userByEmail.get("aisha@levant-legal.ae")!;
      await db.insert(s.wallAccessRequests).values({
        tenantId: tenant.id,
        wallGroupId: wall.id,
        requestedByUserId: aisha,
        reason: "Need to advise on KSA tax structuring for the JV's Riyadh operations.",
        status: "requested",
      });
      console.log(`✓ 1 wall_group (Falcon × Nimbus) + 4 memberships + 1 pending access request`);
    }

    // ── 10. Conflict checks — one clear (matter opened), one potential ──
    const formationCase = caseByMatterNo.get("2026-0210");
    if (formationCase) {
      await db.insert(s.conflictChecks).values({
        tenantId: tenant.id,
        caseId: formationCase.id,
        subjectName: "Meridian Tech Holdings Ltd",
        adverseParties: [],
        outcome: "clear",
        matchesJson: { matches: [] },
        checkedByUserId: userByEmail.get("sara@levant-legal.ae")!,
        clearedByUserId: userByEmail.get("sara@levant-legal.ae")!,
      });
    }
    // A standalone potential-conflict check (the system flagged it pre-matter-open).
    // Adverse party "Nimbus Holdings Ltd" is one we already engage with via the JV,
    // so a new "Nimbus" advisory triggers a hit.
    await db.insert(s.conflictChecks).values({
      tenantId: tenant.id,
      subjectName: "Cresta Advisors FZE",
      adverseParties: ["Nimbus Holdings Ltd"],
      outcome: "potential",
      matchesJson: {
        matches: [
          {
            kind: "adverse_party_is_existing_client",
            party: "Nimbus Holdings Ltd",
            via: "2026-0214 — Falcon × Nimbus JV",
            severity: "high",
          },
        ],
      },
      checkedByUserId: userByEmail.get("sara@levant-legal.ae")!,
    });
    console.log(`✓ 2 conflict_checks (1 clear + 1 potential)`);

    // ── 11. Access log seed — "who saw what" needs content to filter ──
    const accessActions: Array<{ caseNum: string; userEmail: string; action: string; entityKind: string; daysAgo: number; hoursAgo?: number }> = [
      { caseNum: "2026-0210", userEmail: "sara@levant-legal.ae",     action: "view",     entityKind: "case",     daysAgo: 0, hoursAgo: 1 },
      { caseNum: "2026-0210", userEmail: "hala@levant-legal.ae",     action: "view",     entityKind: "case",     daysAgo: 0, hoursAgo: 3 },
      { caseNum: "2026-0210", userEmail: "sara@levant-legal.ae",     action: "download", entityKind: "document", daysAgo: 1 },
      { caseNum: "2026-0210", userEmail: "hala@levant-legal.ae",     action: "view",     entityKind: "case",     daysAgo: 2 },
      { caseNum: "2026-0214", userEmail: "mohammed@levant-legal.ae", action: "view",     entityKind: "case",     daysAgo: 0, hoursAgo: 2 },
      { caseNum: "2026-0214", userEmail: "yusuf@levant-legal.ae",    action: "view",     entityKind: "case",     daysAgo: 1 },
      { caseNum: "2026-0214", userEmail: "mohammed@levant-legal.ae", action: "export",   entityKind: "document", daysAgo: 3 },
      { caseNum: "2026-0214", userEmail: "sara@levant-legal.ae",     action: "view",     entityKind: "case",     daysAgo: 4 },
      { caseNum: "2026-0210", userEmail: "sara@levant-legal.ae",     action: "print",    entityKind: "document", daysAgo: 5 },
    ];
    let accessLogged = 0;
    for (const a of accessActions) {
      const c = caseByMatterNo.get(a.caseNum);
      const uid = userByEmail.get(a.userEmail);
      if (!c || !uid) continue;
      const when = new Date(now.getTime() - a.daysAgo * 86400_000 - (a.hoursAgo ?? 0) * 3600_000);
      await db.insert(s.accessLog).values({
        tenantId: tenant.id,
        userId: uid,
        caseId: c.id,
        entityKind: a.entityKind,
        entityId: c.id,
        action: a.action,
        ipAddress: "10.0.0." + (10 + accessLogged),
        userAgent: "Mozilla/5.0 (Macintosh) Lexoni.ai/1.0",
        exportReason: a.action === "export" ? "Counterparty diligence pack — JV closing checklist" : undefined,
        occurredAt: when,
      });
      accessLogged += 1;
    }
    console.log(`✓ ${accessLogged} access_log rows`);

    // ── 12. Sprint 3.1 — KSA Go-Public (Tadawul / CMA) process pack ───
    // Authored as data in lib/processes/ksa_go_public.ts so it can be re-used
    // by a future "fork to firm library" UX without re-touching the seed.
    const [ksaProc] = await db.insert(s.processes).values({
      tenantId: tenant.id,
      kind: KSA_GO_PUBLIC_META.kind,
      title: KSA_GO_PUBLIC_META.title,
      titleAr: KSA_GO_PUBLIC_META.titleAr,
      region: KSA_GO_PUBLIC_META.region,
      jurisdiction: KSA_GO_PUBLIC_META.jurisdiction,
      language: KSA_GO_PUBLIC_META.language,
      defaultFeeModel: KSA_GO_PUBLIC_META.defaultFeeModel,
      expectedDurationDays: KSA_GO_PUBLIC_META.expectedDurationDays,
      version: 1,
      isCurrent: true,
      active: true,
    }).returning({ id: s.processes.id });

    const ksaStepIdByOrdinal = new Map<number, string>();
    for (const step of KSA_GO_PUBLIC_STEPS) {
      const [row] = await db.insert(s.processSteps).values({
        processId: ksaProc.id,
        ordinal: step.ordinal,
        name: step.name,
        nameAr: step.nameAr,
        ownerRole: step.ownerRole,
        expectedDurationDays: step.expectedDurationDays,
        dependsOnOrdinals: step.ordinal > 1 ? [step.ordinal - 1] : [],
        isMilestone: !!step.isMilestone,
      }).returning({ id: s.processSteps.id });
      ksaStepIdByOrdinal.set(step.ordinal, row.id);
    }

    const ksaSlotIdByOrdinal = new Map<number, string>();
    for (const slot of KSA_GO_PUBLIC_SLOTS) {
      const [row] = await db.insert(s.processDocumentSlots).values({
        processId: ksaProc.id,
        stepId: ksaStepIdByOrdinal.get(slot.stepOrdinal),
        ordinal: slot.ordinal,
        title: slot.title,
        titleAr: slot.titleAr,
        expectedKind: slot.expectedKind,
        required: slot.required,
        stage: slot.stage,
      }).returning({ id: s.processDocumentSlots.id });
      ksaSlotIdByOrdinal.set(slot.ordinal, row.id);
    }
    console.log(`✓ KSA Go-Public process: ${KSA_GO_PUBLIC_STEPS.length} steps + ${KSA_GO_PUBLIC_SLOTS.length} slots`);

    // ── 13. Sample matter that instantiates the KSA IPO + a CMA wait blocker ──
    const aisha = userByEmail.get("aisha@levant-legal.ae")!;
    const ksaTargetClose = new Date(now.getTime() + KSA_GO_PUBLIC_META.expectedDurationDays * 24 * 60 * 60 * 1000);
    const ksaCaseOpened  = new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000);

    const [ksaCase] = await db.insert(s.cases).values({
      tenantId: tenant.id,
      matterNumber: "2026-0231",
      title: "Riyadh Industries — Tadawul IPO",
      matterType: "corporate",
      status: "open",
      region: "KSA",
      jurisdiction: "MISA / CMA",
      description: "Riyadh Industries Co. · Milestone fee — $480,000",
      leadLawyerId: aisha,
      openedAt: ksaCaseOpened,
    }).returning({ id: s.cases.id });

    const [ksaMp] = await db.insert(s.matterProcesses).values({
      tenantId: tenant.id,
      caseId: ksaCase.id,
      processId: ksaProc.id,
      processVersion: 1,
      startedAt: ksaCaseOpened,
      targetCloseAt: ksaTargetClose,
      progressPct: 38,
    }).returning({ id: s.matterProcesses.id });

    // Mirror slot statuses so the matter looks live: pre-filing done, prospectus
    // drafting in review, CMA application out for filing — stalled.
    const KSA_SLOT_STATUS: Record<number, (typeof s.slotStatusEnum.enumValues)[number]> = {
      1: "signed", 2: "approved", 3: "signed", 4: "approved",
      5: "in_review", 6: "drafting", 7: "approved", 8: "approved",
      9: "out_for_signature",
      10: "drafting", 11: "not_started", 12: "drafting",
      13: "not_started", 14: "not_started", 15: "not_started", 16: "not_started",
      17: "not_started", 18: "not_started",
    };
    const KSA_SLOT_ASSIGNEE: Record<number, string> = {
      1: aisha, 2: aisha, 3: aisha, 4: aisha,
      5: aisha, 6: aisha, 7: aisha, 8: aisha,
      9: aisha, 10: aisha, 11: aisha, 12: aisha,
      13: aisha, 14: aisha, 15: aisha, 16: aisha,
      17: aisha, 18: aisha,
    };
    let ksaSlotInserts = 0;
    for (const slot of KSA_GO_PUBLIC_SLOTS) {
      await db.insert(s.matterDocumentSlots).values({
        tenantId: tenant.id,
        matterProcessId: ksaMp.id,
        slotId: ksaSlotIdByOrdinal.get(slot.ordinal),
        ordinal: slot.ordinal,
        title: slot.title,
        status: KSA_SLOT_STATUS[slot.ordinal] ?? "not_started",
        autofilledFromClient: slot.ordinal <= 4,
        assignedToUserId: KSA_SLOT_ASSIGNEE[slot.ordinal],
        dueAt: new Date(ksaCaseOpened.getTime() + slot.ordinal * 12 * 24 * 60 * 60 * 1000),
      });
      ksaSlotInserts += 1;
    }
    console.log(`✓ KSA IPO matter 2026-0231 + ${ksaSlotInserts} matter_document_slots`);

    // CMA pre-clearance wait — surfaces on Firm Pulse "What's slipping" + the
    // matter's blockers rail. Severity = high because the IPO sequence stalls
    // entirely until CMA clears.
    await db.insert(s.matterBlockers).values({
      tenantId: tenant.id,
      caseId: ksaCase.id,
      matterProcessId: ksaMp.id,
      matterSlotId: ksaSlotIdByOrdinal.get(9) ?? null,  // CMA Application Pack
      kind: "external_dependency_wait",
      severity: "high",
      title: "Awaiting CMA pre-clearance — 14 days, no response",
      detail: "CMA application filed; the prospectus + underwriting agreement cannot finalise until pre-clearance lands. Standard CMA review SLA is 10 working days.",
      expectedJson: { dependency: "CMA", slaDays: 10, breachedByDays: 4 },
      ownerUserId: aisha,
    });
    console.log(`✓ CMA pre-clearance blocker (external_dependency_wait)`);

    console.log("✅ Seed complete.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
