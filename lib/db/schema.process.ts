/**
 * Lexoni.ai — schema EXTENSION: the four lawyer-centric pillars
 * ───────────────────────────────────────────────────────────────
 * Composes with ./schema.ts (imports tenants, users, cases, templates,
 * documentGenerations). Re-center: the product is built around the LAWYER
 * and the FIRM's health — not the case. This file adds what the base schema
 * is missing for that thesis:
 *
 *   1) PROCESS ENGINE        — ordered processes → steps → document slots,
 *                              instantiated per matter. ("lookup by process,
 *                              files shown in process order, drag-drop in")
 *   2) PASSIVE TIME & LEAKAGE— capture work automatically; confirm, don't
 *                              re-type; flag recoverable WIP that's leaking.
 *   3) PERFORMANCE & PULSE   — per-lawyer performance, promotion-readiness
 *                              (decision-SUPPORT, not a verdict), firm vitality.
 *   4) DELAY / GAP ENGINE    — process-graph-driven blockers (the blindspot
 *                              detector; the strongest patent-candidate).
 *   +  WALL UPGRADE          — wall groups + cross-wall requests + conflicts,
 *                              upgrading "assigned_only visibility" to true
 *                              default-deny isolation.
 *
 * Conventions kept from schema.ts: uuid PKs, tenant_id scoping, region enum,
 * (parentId, version, isCurrent) where versioned, append-only logs, withTimezone.
 */
import {
  pgTable, uuid, text, timestamp, integer, numeric, boolean, jsonb,
  pgEnum, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { regionEnum } from "./enums";
import { tenants, users, cases, templates, documentGenerations } from "./schema";

/* ══════════════════════════════ ENUMS ══════════════════════════════ */

/** The methodology catalogue — the heart of "Auditus for lawyers". */
export const processKindEnum = pgEnum("process_kind", [
  "company_formation",
  "company_change_of_control",
  "go_public",            // IPO / listing
  "go_private",           // take-private / delisting
  "ma_buyside",
  "ma_sellside",
  "joint_venture",
  "restructuring",
  "bankruptcy_insolvency",
  "fundraising_round",
  "licensing_regulatory",
  "employment_matter",
  "dispute_litigation",
  "other",
]);

export const slotStatusEnum = pgEnum("slot_status", [
  "not_started", "drafting", "in_review", "approved", "out_for_signature", "signed", "filed", "waived",
]);

export const stepStatusEnum = pgEnum("step_status", [
  "pending", "in_progress", "blocked", "done", "skipped",
]);

/** Where a captured activity came from. Drives passive time capture. */
export const activitySourceEnum = pgEnum("activity_source", [
  "editor", "document_open", "ai_draft", "review", "email", "call", "meeting", "research", "manual",
]);

/** How a time entry was created — the anti-timesheet model. */
export const timeSourceEnum = pgEnum("time_source", ["passive", "ai_suggested", "manual"]);

export const leakageKindEnum = pgEnum("leakage_kind", [
  "finalised_doc_no_time",
  "matter_closed_open_wip",
  "aged_unbilled_wip",
  "rate_card_mismatch",
  "non_billable_drift",
  "write_down_pattern",
]);

/** Typed blockers detected off the process graph — the blindspot engine. */
export const blockerKindEnum = pgEnum("blocker_kind", [
  "missing_intake_data",
  "dependency_violation",        // step B started before step A signed
  "signature_bottleneck",
  "review_sla_breach",
  "approval_queue_stall",
  "conflict_pending",
  "external_dependency_wait",    // MoJ / DIFC / ADGM / ZATCA / central-bank approval
  "wip_leakage",
  "language_parity_drift",       // EN/AR versions out of sync
  "residency_exception",
  "quiet_matter",                // no activity in N days
]);

export const severityEnum = pgEnum("severity_level", ["low", "medium", "high", "critical"]);

export const periodKindEnum = pgEnum("period_kind", ["day", "week", "month", "quarter", "year"]);

export const promotionBandEnum = pgEnum("promotion_band", [
  "not_yet", "developing", "approaching", "ready", "overdue",
]);

export const wallRequestStatusEnum = pgEnum("wall_request_status", [
  "requested", "approved", "denied", "revoked", "expired",
]);

export const conflictOutcomeEnum = pgEnum("conflict_outcome", [
  "clear", "potential", "confirmed", "waived",
]);

export const draftInputModeEnum = pgEnum("draft_input_mode", ["text", "voice"]);

/* ════════════════════ PILLAR 1 — PROCESS ENGINE ════════════════════ */

/**
 * A process is a reusable, ordered methodology (formation, M&A, go-public…).
 * Firm-scoped (tenantId set) or global (tenantId null → platform library a
 * firm can fork). Region/language aware so the narrowing-lookup is correct.
 */
export const processes = pgTable("processes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null = global
  kind:         processKindEnum("kind").notNull(),
  title:        text("title").notNull(),
  titleAr:      text("title_ar"),
  description:  text("description"),
  region:       regionEnum("region").notNull(),
  jurisdiction: text("jurisdiction"),          // ADGM | DIFC | DMCC | MISA …
  language:     text("language").notNull().default("en"),
  /** Default fee model the matter inherits: hourly | fixed | retainer | milestone. */
  defaultFeeModel: text("default_fee_model").notNull().default("hourly"),
  /** Expected end-to-end duration (days) — feeds delay detection baselines. */
  expectedDurationDays: integer("expected_duration_days"),
  version:      integer("version").notNull().default(1),
  parentId:     uuid("parent_id"),
  isCurrent:    boolean("is_current").notNull().default(true),
  active:       boolean("active").notNull().default(true),
  usageCount:   integer("usage_count").notNull().default(0),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant: index("processes_tenant_idx").on(t.tenantId),
  ixKind:   index("processes_kind_idx").on(t.kind),
  ixRegion: index("processes_region_idx").on(t.region),
}));

/** Ordered workstream steps within a process. dependsOn enables the graph. */
export const processSteps = pgTable("process_steps", {
  id:           uuid("id").primaryKey().defaultRandom(),
  processId:    uuid("process_id").notNull().references(() => processes.id, { onDelete: "cascade" }),
  ordinal:      integer("ordinal").notNull(),                 // display + sequence order
  name:         text("name").notNull(),
  nameAr:       text("name_ar"),
  /** Ordinals of prerequisite steps — drives dependency_violation detection. */
  dependsOnOrdinals: integer("depends_on_ordinals").array().notNull().default([]),
  ownerRole:    text("owner_role"),                           // lawyer | partner | assistant | client
  expectedDurationDays: integer("expected_duration_days"),
  isMilestone:  boolean("is_milestone").notNull().default(false),
  optional:     boolean("optional").notNull().default(false),
}, (t) => ({
  uxStepOrder: uniqueIndex("process_steps_order_uidx").on(t.processId, t.ordinal),
}));

/**
 * The ORDERED document set a process expects — "show the list of files in
 * the order of the process". Each slot maps to an expected template kind and
 * (optionally) a specific template; the matter instantiates these as fillable
 * slots that drag-drop targets.
 */
export const processDocumentSlots = pgTable("process_document_slots", {
  id:            uuid("id").primaryKey().defaultRandom(),
  processId:     uuid("process_id").notNull().references(() => processes.id, { onDelete: "cascade" }),
  stepId:        uuid("step_id").references(() => processSteps.id, { onDelete: "set null" }),
  ordinal:       integer("ordinal").notNull(),
  title:         text("title").notNull(),
  titleAr:       text("title_ar"),
  /** Expected document kind (NDA | SHA | SPA | Board Resolution | MOA …). */
  expectedKind:  text("expected_kind").notNull(),
  /** Optional pinned template; else the lookup narrows by kind+region+lang. */
  suggestedTemplateId: uuid("suggested_template_id").references(() => templates.id, { onDelete: "set null" }),
  required:      boolean("required").notNull().default(true),
  stage:         text("stage"),                               // e.g. "Pre-signing", "Closing", "Post-closing"
}, (t) => ({
  uxSlotOrder: uniqueIndex("process_doc_slots_order_uidx").on(t.processId, t.ordinal),
}));

/** A process instantiated onto a matter (a matter can run >1 process). */
export const matterProcesses = pgTable("matter_processes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:       uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  processId:    uuid("process_id").notNull().references(() => processes.id),
  processVersion: integer("process_version").notNull(),
  startedAt:    timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  targetCloseAt: timestamp("target_close_at", { withTimezone: true }),
  closedAt:     timestamp("closed_at", { withTimezone: true }),
  /** 0-100 completion, derived from slot/step status (cached for dashboards). */
  progressPct:  integer("progress_pct").notNull().default(0),
}, (t) => ({
  ixCase: index("matter_processes_case_idx").on(t.caseId),
}));

/** Live, fillable instance of a process document slot inside a matter. */
export const matterDocumentSlots = pgTable("matter_document_slots", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  matterProcessId:  uuid("matter_process_id").notNull().references(() => matterProcesses.id, { onDelete: "cascade" }),
  slotId:           uuid("slot_id").references(() => processDocumentSlots.id, { onDelete: "set null" }),
  ordinal:          integer("ordinal").notNull(),
  title:            text("title").notNull(),
  status:           slotStatusEnum("status").notNull().default("not_started"),
  /** The generated/uploaded doc that fills this slot. */
  documentGenId:    uuid("document_gen_id").references(() => documentGenerations.id, { onDelete: "set null" }),
  /** Drag-drop / autofill provenance: did we merge the client record? */
  autofilledFromClient: boolean("autofilled_from_client").notNull().default(false),
  /** Confirm-diff: core matter details the doc proposed to update (audit, no silent overwrite). */
  coreDetailDiffJson: jsonb("core_detail_diff_json"),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
  dueAt:            timestamp("due_at", { withTimezone: true }),
  completedAt:      timestamp("completed_at", { withTimezone: true }),
}, (t) => ({
  ixMp:   index("matter_doc_slots_mp_idx").on(t.matterProcessId),
  ixStat: index("matter_doc_slots_status_idx").on(t.status),
}));

/** Per-step live status inside a matter (mirrors process_steps for the graph). */
export const matterProcessSteps = pgTable("matter_process_steps", {
  id:               uuid("id").primaryKey().defaultRandom(),
  matterProcessId:  uuid("matter_process_id").notNull().references(() => matterProcesses.id, { onDelete: "cascade" }),
  stepId:           uuid("step_id").references(() => processSteps.id, { onDelete: "set null" }),
  ordinal:          integer("ordinal").notNull(),
  status:           stepStatusEnum("status").notNull().default("pending"),
  startedAt:        timestamp("started_at", { withTimezone: true }),
  doneAt:           timestamp("done_at", { withTimezone: true }),
  dueAt:            timestamp("due_at", { withTimezone: true }),
}, (t) => ({
  uxMpStep: uniqueIndex("matter_process_steps_uidx").on(t.matterProcessId, t.ordinal),
}));

/** Smart-prompt draft requests (text or VOICE) — your voice-to-draft. */
export const draftRequests = pgTable("draft_requests", {
  id:            uuid("id").primaryKey().defaultRandom(),
  tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:        uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  matterSlotId:  uuid("matter_slot_id").references(() => matterDocumentSlots.id, { onDelete: "set null" }),
  inputMode:     draftInputModeEnum("input_mode").notNull().default("text"),
  promptText:    text("prompt_text"),                 // typed, or transcript of voice
  voiceStorageUrl: text("voice_storage_url"),         // raw audio if voice
  language:      text("language").notNull().default("en"),
  /** Which templates/clauses the draft cited — provenance the lawyer can trust. */
  citedSourcesJson: jsonb("cited_sources_json"),
  outputMd:      text("output_md"),
  /** Suggestion-state until a human with final_review accepts. */
  acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id),
  acceptedAt:    timestamp("accepted_at", { withTimezone: true }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixCase: index("draft_requests_case_idx").on(t.caseId) }));

/* ═══════════════ PILLAR 2 — PASSIVE TIME & LEAKAGE ═══════════════ */

/**
 * Passively captured units of work. The end-of-day "confirm your time" sweep
 * turns these into time_entries. Removing the manual timesheet is the single
 * biggest adoption lever in legaltech.
 */
export const activityEvents = pgTable("activity_events", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caseId:       uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  matterSlotId: uuid("matter_slot_id").references(() => matterDocumentSlots.id, { onDelete: "set null" }),
  source:       activitySourceEnum("source").notNull(),
  startedAt:    timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt:      timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  summary:      text("summary"),
  /** Set when this activity has been rolled into a confirmed time entry. */
  reconciledTimeEntryId: uuid("reconciled_time_entry_id"),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixUserDay: index("activity_events_user_idx").on(t.userId, t.startedAt),
  ixCase:    index("activity_events_case_idx").on(t.caseId),
}));

/**
 * NOTE: extend the existing `time_entries` table (in schema.ts) with:
 *   source:      timeSource enum ("passive" | "ai_suggested" | "manual")
 *   confirmedAt: timestamp  (null = awaiting the daily confirm sweep)
 *   slotId:      uuid -> matter_document_slots(id)
 * Kept here as a standalone "draft entries" table so the extension is additive
 * and non-breaking; merge into time_entries when you touch that table.
 */
export const timeEntryDrafts = pgTable("time_entry_drafts", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caseId:       uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  source:       timeSourceEnum("source").notNull().default("passive"),
  workedOn:     timestamp("worked_on", { withTimezone: true }).notNull(),
  minutes:      integer("minutes").notNull(),
  description:  text("description"),
  billable:     boolean("billable").notNull().default(true),
  /** Links back to the activity that proposed it. */
  activityEventId: uuid("activity_event_id").references(() => activityEvents.id, { onDelete: "set null" }),
  confirmedAt:  timestamp("confirmed_at", { withTimezone: true }),
  confirmedTimeEntryId: uuid("confirmed_time_entry_id"),  // FK to time_entries on confirm
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixUser: index("time_entry_drafts_user_idx").on(t.userId, t.workedOn) }));

/** Recoverable-revenue protection — "maximise billing" done defensibly. */
export const leakageAlerts = pgTable("leakage_alerts", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:       uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  userId:       uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  kind:         leakageKindEnum("kind").notNull(),
  severity:     severityEnum("severity").notNull().default("medium"),
  /** Estimated recoverable value at risk (cents). */
  amountAtRiskCents: integer("amount_at_risk_cents"),
  detail:       text("detail"),
  detectedAt:   timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt:   timestamp("resolved_at", { withTimezone: true }),
  resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id),
}, (t) => ({
  ixOpen: index("leakage_alerts_open_idx").on(t.tenantId, t.resolvedAt),
}));

/* ═══════════ PILLAR 3 — PERFORMANCE, PROMOTION, FIRM VITALITY ═══════════ */

/** Per-lawyer performance per period. Every figure is drillable to source. */
export const performanceSnapshots = pgTable("performance_snapshots", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:           uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  period:           periodKindEnum("period").notNull(),
  periodStart:      timestamp("period_start", { withTimezone: true }).notNull(),
  billableMinutes:  integer("billable_minutes").notNull().default(0),
  workedMinutes:    integer("worked_minutes").notNull().default(0),
  /** billed / worked. */
  realisationPct:   numeric("realisation_pct", { precision: 5, scale: 2 }),
  /** collected / billed. */
  collectionPct:    numeric("collection_pct", { precision: 5, scale: 2 }),
  utilisationPct:   numeric("utilisation_pct", { precision: 5, scale: 2 }),
  mattersOpened:    integer("matters_opened").notNull().default(0),
  mattersClosed:    integer("matters_closed").notNull().default(0),
  onTimeMilestonePct: numeric("on_time_milestone_pct", { precision: 5, scale: 2 }),
  supervisionLoad:  integer("supervision_load").notNull().default(0),   // people/matters supervised
  revenueCents:     integer("revenue_cents").notNull().default(0),
  computedAt:       timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxUserPeriod: uniqueIndex("perf_snap_user_period_uidx").on(t.userId, t.period, t.periodStart),
}));

/**
 * Promotion-readiness — explicitly DECISION-SUPPORT, never an automated verdict.
 * Stores the evidence so a human partner makes the call; bias-aware by design.
 */
export const promotionSignals = pgTable("promotion_signals", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  band:         promotionBandEnum("band").notNull().default("developing"),
  /** 0-100 composite — shown WITH its components, never as a black box. */
  compositeScore: integer("composite_score"),
  /** {hours, realisation, complexity, supervision, onTimeRate, clientFeedback, tenure...}. */
  evidenceJson: jsonb("evidence_json").notNull(),
  /** Human review — the system recommends; the partner decides. */
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
  reviewedAt:   timestamp("reviewed_at", { withTimezone: true }),
  partnerNote:  text("partner_note"),
  computedAt:   timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixUser: index("promotion_signals_user_idx").on(t.tenantId, t.userId),
}));

/** The owner's single glance: Firm Vitality Index with its components stored. */
export const firmVitalitySnapshots = pgTable("firm_vitality_snapshots", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  period:           periodKindEnum("period").notNull(),
  periodStart:      timestamp("period_start", { withTimezone: true }).notNull(),
  /** 0-100 composite. */
  vitalityIndex:    integer("vitality_index").notNull(),
  /** Components so the number is never opaque. */
  utilisationPct:   numeric("utilisation_pct", { precision: 5, scale: 2 }),
  realisationPct:   numeric("realisation_pct", { precision: 5, scale: 2 }),
  wipTotalCents:    integer("wip_total_cents").notNull().default(0),
  wipAgedCents:     integer("wip_aged_cents").notNull().default(0),     // > threshold days
  arOutstandingCents: integer("ar_outstanding_cents").notNull().default(0),
  activeMatters:    integer("active_matters").notNull().default(0),
  mattersOpenedPeriod: integer("matters_opened_period").notNull().default(0),
  mattersClosedPeriod: integer("matters_closed_period").notNull().default(0),
  pipelineCents:    integer("pipeline_cents").notNull().default(0),
  openLeakageCents: integer("open_leakage_cents").notNull().default(0),
  openBlockers:     integer("open_blockers").notNull().default(0),
  computedAt:       timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxFirmPeriod: uniqueIndex("firm_vitality_period_uidx").on(t.tenantId, t.period, t.periodStart),
}));

/* ═══════════ PILLAR 4 — DELAY / GAP (BLINDSPOT) ENGINE ═══════════ */

/**
 * Typed blockers detected off the process graph. Because the system knows the
 * EXPECTED sequence, it flags stalls/gaps/leakage competitors can't see.
 * This is the strongest novel-system / patent candidate — keep the detection
 * logic documented and dated for prior-art purposes.
 */
export const matterBlockers = pgTable("matter_blockers", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:       uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  matterProcessId: uuid("matter_process_id").references(() => matterProcesses.id, { onDelete: "set null" }),
  /** The step/slot the blocker attaches to, when applicable. */
  matterSlotId: uuid("matter_slot_id").references(() => matterDocumentSlots.id, { onDelete: "set null" }),
  kind:         blockerKindEnum("kind").notNull(),
  severity:     severityEnum("severity").notNull().default("medium"),
  title:        text("title").notNull(),
  detail:       text("detail"),
  /** Expected vs actual — the evidence the detector fired on. */
  expectedJson: jsonb("expected_json"),
  /** Who/what must move to clear it. */
  ownerUserId:  uuid("owner_user_id").references(() => users.id),
  detectedAt:   timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt:   timestamp("resolved_at", { withTimezone: true }),
  resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id),
}, (t) => ({
  ixOpen: index("matter_blockers_open_idx").on(t.tenantId, t.resolvedAt),
  ixCase: index("matter_blockers_case_idx").on(t.caseId),
  ixKind: index("matter_blockers_kind_idx").on(t.kind),
}));

/* ═══════════ WALL UPGRADE — true isolation, cross-wall requests, conflicts ═══════════ */

/**
 * Upgrades the base "assigned_only visibility" into a first-class isolation
 * primitive. Default-deny across walls: a non-member cannot see, search,
 * autofill-from, or even KNOW a walled matter exists. Enforce in the data /
 * retrieval layer (incl. AI), not just the UI.
 */
export const wallGroups = pgTable("wall_groups", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:         text("name").notNull(),
  reason:       text("reason"),                 // why this wall exists (conflict, sensitivity)
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt:     timestamp("closed_at", { withTimezone: true }),
}, (t) => ({ ixTenant: index("wall_groups_tenant_idx").on(t.tenantId) }));

/** Which matters/clients are isolated by a wall, and who is inside it. */
export const wallMemberships = pgTable("wall_memberships", {
  id:           uuid("id").primaryKey().defaultRandom(),
  wallGroupId:  uuid("wall_group_id").notNull().references(() => wallGroups.id, { onDelete: "cascade" }),
  /** Exactly one of (userId, caseId) identifies an inclusion. */
  userId:       uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  caseId:       uuid("case_id").references(() => cases.id, { onDelete: "cascade" }),
  addedByUserId: uuid("added_by_user_id").references(() => users.id),
  addedAt:      timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  removedAt:    timestamp("removed_at", { withTimezone: true }),
}, (t) => ({
  ixWall: index("wall_memberships_wall_idx").on(t.wallGroupId),
  ixUser: index("wall_memberships_user_idx").on(t.userId),
}));

/** Cross-wall access is an explicit, logged, APPROVED request — never self-grant. */
export const wallAccessRequests = pgTable("wall_access_requests", {
  id:            uuid("id").primaryKey().defaultRandom(),
  tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  wallGroupId:   uuid("wall_group_id").notNull().references(() => wallGroups.id, { onDelete: "cascade" }),
  requestedByUserId: uuid("requested_by_user_id").notNull().references(() => users.id),
  reason:        text("reason").notNull(),
  status:        wallRequestStatusEnum("status").notNull().default("requested"),
  decidedByUserId: uuid("decided_by_user_id").references(() => users.id),
  decidedAt:     timestamp("decided_at", { withTimezone: true }),
  expiresAt:     timestamp("expires_at", { withTimezone: true }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixWall: index("wall_access_requests_wall_idx").on(t.wallGroupId) }));

/** Conflict scan at intake / matter-open against existing clients + adverse parties. */
export const conflictChecks = pgTable("conflict_checks", {
  id:            uuid("id").primaryKey().defaultRandom(),
  tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:        uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  intakeId:      uuid("intake_id"),                 // FK to intake_requests when run pre-matter
  subjectName:   text("subject_name").notNull(),    // party being checked
  adverseParties: text("adverse_parties").array(),
  outcome:       conflictOutcomeEnum("outcome").notNull().default("clear"),
  /** Matches found — entity, matter, relationship — for the reviewer. */
  matchesJson:   jsonb("matches_json"),
  /** If potential/confirmed and proceeding, the wall created to isolate it. */
  wallGroupId:   uuid("wall_group_id").references(() => wallGroups.id, { onDelete: "set null" }),
  checkedByUserId: uuid("checked_by_user_id").references(() => users.id),
  clearedByUserId: uuid("cleared_by_user_id").references(() => users.id),
  checkedAt:     timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixCase: index("conflict_checks_case_idx").on(t.caseId),
}));

/* ═══════════ IN-CONTEXT DOCUMENT MACHINE — uploaded files + parse ═══════════
 *
 * The matter workspace is an in-context machine: lawyers drop a contract on a
 * slot, the file is parsed, the text becomes searchable, and the AI can act on
 * the actual document — not a prompt about it.
 *
 * One row per uploaded file. Multiple versions of the same slot stack here
 * (Sprint #5 uses this for the redline view). Auto-extracted metadata lands
 * in `extractedMetaJson` (Sprint #3).
 */
export const documentParseStatusEnum = pgEnum("document_parse_status", [
  "uploaded",      // bytes on disk, parsing queued
  "parsing",       // parser in flight
  "ready",         // extractedText + pageMap populated
  "failed",        // parse error; see parseError
]);

export const matterDocuments = pgTable("matter_documents", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:          uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  /** Slot this document belongs to (a slot can have several versions). */
  matterSlotId:    uuid("matter_slot_id").references(() => matterDocumentSlots.id, { onDelete: "set null" }),
  /** Original filename as uploaded. */
  filename:        text("filename").notNull(),
  mime:            text("mime").notNull(),
  bytes:           integer("bytes").notNull(),
  /** Storage URL — `file://.uploads/<id>.ext` in dev, `s3://bucket/<key>` in prod. */
  storageUrl:      text("storage_url").notNull(),
  /** SHA-256 of the bytes — used to dedupe re-uploads. */
  sha256:          text("sha256").notNull(),
  /** Page count (PDFs); null for DOCX where we don't track pages. */
  pages:           integer("pages"),
  /** Full concatenated text, used for AI context + cmd-K. Capped at ~10 MB. */
  extractedText:   text("extracted_text"),
  /** Mammoth-rendered HTML for DOCX (preserves headings + paragraphs + lists).
   *  Null for PDF/TXT/MD — the viewer renders those natively. */
  extractedHtml:   text("extracted_html"),
  /** Per-page text map (PDFs): `[{ page: 1, text: "…" }, …]`. */
  pageMapJson:     jsonb("page_map_json"),
  /** Auto-extracted metadata (Sprint #3): parties, dates, jurisdiction, risks. */
  extractedMetaJson: jsonb("extracted_meta_json"),
  /** Parse state. */
  status:          documentParseStatusEnum("status").notNull().default("uploaded"),
  parseError:      text("parse_error"),
  /** Version label — "v1", "v2", or a free-text label (e.g. "Counterparty mark-up"). */
  version:         text("version").notNull().default("v1"),
  isCurrent:       boolean("is_current").notNull().default(true),
  uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id),
  uploadedAt:      timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  parsedAt:        timestamp("parsed_at", { withTimezone: true }),
}, (t) => ({
  ixCase:   index("matter_documents_case_idx").on(t.caseId),
  ixSlot:   index("matter_documents_slot_idx").on(t.matterSlotId),
  ixStatus: index("matter_documents_status_idx").on(t.status),
  uxSha:    uniqueIndex("matter_documents_sha_uidx").on(t.tenantId, t.caseId, t.sha256),
}));

/* ═══════════ ACCOUNT MANAGEMENT — pending invites + role audit ═══════════
 *
 * Members of the firm are represented by `memberships` (in schema.ts). When a
 * partner invites a colleague who hasn't accepted yet, that lives here. The
 * magic-link token is opaque; when auth is wired (NextAuth / Clerk), the
 * accept flow will resolve the token, create the user + membership, then
 * mark the invite accepted.
 */
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending", "accepted", "expired", "cancelled",
]);

export const pendingInvites = pgTable("pending_invites", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email:           text("email").notNull(),
  fullName:        text("full_name"),
  /** Role the invitee will receive when they accept. Free-form text to keep
   *  this file decoupled from the userRoleEnum that lives in schema.ts. */
  role:            text("role").notNull(),
  /** For lawyer_helper invites — who they'll report to. */
  reportsToUserId: uuid("reports_to_user_id").references(() => users.id, { onDelete: "set null" }),
  hourlyRateCents: integer("hourly_rate_cents"),
  invitedByUserId: uuid("invited_by_user_id").references(() => users.id, { onDelete: "set null" }),
  /** Opaque magic-link token. */
  token:           text("token").notNull(),
  expiresAt:       timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt:      timestamp("accepted_at", { withTimezone: true }),
  status:          inviteStatusEnum("status").notNull().default("pending"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxToken: uniqueIndex("pending_invites_token_uidx").on(t.token),
  uxEmail: uniqueIndex("pending_invites_tenant_email_uidx").on(t.tenantId, t.email),
  ixStatus: index("pending_invites_status_idx").on(t.tenantId, t.status),
}));

/* ═══════════ Engagement-letter delivery (Sprint 7) ═══════════
 *
 * The base `engagement_letters` table lives in schema.ts and was scaffolded
 * for the demo. Real automation needs three extra columns:
 *   • viewToken   — opaque link the client clicks to view + sign (no auth)
 *   • clientEmail — the recipient address (denormalised from intake/contact
 *                   so the public view doesn't need to join out)
 *   • clientName  — display name on the signing page
 *
 * Done as a side-table so we don't touch the (large) base file. Joined via
 * 1:1 FK; one row per engagement letter.
 */
export const engagementLetterDelivery = pgTable("engagement_letter_delivery", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  engagementLetterId: uuid("engagement_letter_id").notNull(),
  viewToken:       text("view_token").notNull(),
  clientEmail:     text("client_email").notNull(),
  clientName:      text("client_name").notNull(),
  emailMessageId:  text("email_message_id"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxToken:        uniqueIndex("eng_delivery_token_uidx").on(t.viewToken),
  uxEngagement:   uniqueIndex("eng_delivery_engagement_uidx").on(t.engagementLetterId),
}));

/* ═══════════ Signature-workflow delivery (Sprint 8) ═══════════
 *
 * Per-party public link + carried metadata. Keeps the base
 * signature_workflow_parties table (in schema.ts) unchanged.
 */
export const signaturePartyDelivery = pgTable("signature_party_delivery", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  partyId:         uuid("party_id").notNull(),
  viewToken:       text("view_token").notNull(),
  emailMessageId:  text("email_message_id"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxToken: uniqueIndex("sig_party_delivery_token_uidx").on(t.viewToken),
  uxParty: uniqueIndex("sig_party_delivery_party_uidx").on(t.partyId),
}));

/* ═══════════ Sign-in magic-link tokens (Sprint 10) ═══════════
 *
 * One row per pending sign-in attempt. Short-lived (15 min). Single-use.
 * Marked `usedAt` on successful verification.
 */
export const signInTokens = pgTable("sign_in_tokens", {
  id:         uuid("id").primaryKey().defaultRandom(),
  email:      text("email").notNull(),
  token:      text("token").notNull(),
  expiresAt:  timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt:     timestamp("used_at",   { withTimezone: true }),
  ipAddress:  text("ip_address"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxToken: uniqueIndex("sign_in_tokens_token_uidx").on(t.token),
  ixEmail: index("sign_in_tokens_email_idx").on(t.email),
}));

/* ═══════════ Document content for signing (Sprint 8) ═══════════
 *
 * Signature workflows need a body to render at the public signing page.
 * Today the base signature_workflows joins to documentGenerations or contracts
 * or engagement_letters. For pure ad-hoc documents (e.g. NDA pasted in by the
 * partner), we keep the markdown on the workflow row via this side table.
 */
export const signatureWorkflowContent = pgTable("signature_workflow_content", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workflowId:      uuid("workflow_id").notNull(),
  title:           text("title").notNull(),
  bodyMd:          text("body_md").notNull(),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxWorkflow: uniqueIndex("sig_workflow_content_workflow_uidx").on(t.workflowId),
}));

/* ═══════════ PHASE 2 — DOCUMENT MANAGEMENT OS (Sprint 11) ═══════════
 *
 * Three additions encode the "no SharePoint" promise:
 *   - document_inbox    : uploads whose matter+slot routing wasn't certain
 *                         enough to file directly; humans triage from /documents
 *   - precedents        : every executed document is cloned here, redacted +
 *                         tagged, so the firm's knowledge base actually surfaces
 *                         it. Powers /precedents and the AI context layer.
 *   - matter_emails     : email threads + attachments captured into a matter.
 *                         The Outlook/Gmail poller writes here; the matter
 *                         workspace surfaces it. Wall-aware like documents.
 */

export const documentInboxStatusEnum = pgEnum("document_inbox_status", [
  "pending",   // awaiting human triage
  "filed",     // routed into a matter slot (matterDocuments row created)
  "rejected",  // human marked as not-relevant; bytes purged on next sweep
]);

export const documentInbox = pgTable("document_inbox", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id),
  filename:         text("filename").notNull(),
  mime:             text("mime").notNull(),
  bytes:            integer("bytes").notNull(),
  storageUrl:       text("storage_url").notNull(),
  sha256:           text("sha256").notNull(),
  extractedText:    text("extracted_text"),
  /** AI's best-guess routing.
   *  `{ caseId, caseTitle, slotId, slotTitle, confidence, reasoning }`. */
  suggestedRoutingJson: jsonb("suggested_routing_json"),
  /** 0–100 — when ≥ 80 the upload short-circuits and is filed directly. */
  routingConfidence: integer("routing_confidence"),
  status:           documentInboxStatusEnum("status").notNull().default("pending"),
  /** When filed: the matter_documents row that ate this inbox row. */
  filedDocumentId:  uuid("filed_document_id"),
  filedByUserId:    uuid("filed_by_user_id").references(() => users.id),
  filedAt:          timestamp("filed_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant: index("document_inbox_tenant_idx").on(t.tenantId),
  ixStatus: index("document_inbox_status_idx").on(t.status),
  uxSha:    uniqueIndex("document_inbox_sha_uidx").on(t.tenantId, t.sha256),
}));

export const precedents = pgTable("precedents", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** Source document this precedent was cloned from. */
  sourceDocumentId: uuid("source_document_id").references(() => matterDocuments.id, { onDelete: "set null" }),
  /** Source matter — for back-reference. NOT a wall leak: the precedent itself
   *  is exposed only when the document was non-walled OR the requester is in
   *  the wall; enforced in the query layer. */
  sourceCaseId:     uuid("source_case_id").references(() => cases.id, { onDelete: "set null" }),
  title:            text("title").notNull(),
  /** Body, with PII optionally redacted per the firm's precedent policy. */
  bodyText:         text("body_text"),
  bodyHtml:         text("body_html"),
  /** Configuration of the redaction — what was masked. */
  redactionsJson:   jsonb("redactions_json"),
  /** Tags surfaced by extraction: kind, jurisdiction, governing law, clauses. */
  kind:             text("kind"),                      // NDA, SHA, SPA, …
  jurisdiction:     text("jurisdiction"),
  governingLaw:     text("governing_law"),
  language:         text("language").notNull().default("en"),
  tags:             text("tags").array().notNull().default([]),
  partyKinds:       text("party_kinds").array().notNull().default([]),  // ["fintech","fund"]
  outcome:          text("outcome"),                   // executed | terminated | superseded
  /** Whether this precedent is allowed to enter AI context.
   *  Mirrors knowledge_items.learnFromThis. */
  learnFromThis:    boolean("learn_from_this").notNull().default(true),
  approved:         boolean("approved").notNull().default(false),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  approvedAt:       timestamp("approved_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant:       index("precedents_tenant_idx").on(t.tenantId),
  ixKind:         index("precedents_kind_idx").on(t.kind),
  ixJurisdiction: index("precedents_jurisdiction_idx").on(t.jurisdiction),
}));

export const emailDirectionEnum = pgEnum("email_direction", ["inbound", "outbound"]);
export const emailClassificationStatusEnum = pgEnum("email_classification_status", [
  "captured",       // ingested, not yet classified
  "classified",     // AI mapped to (case|none) + confidence
  "filed",          // attached to a matter; visible on the matter inbox
  "rejected",       // human said "not relevant"
]);

export const matterEmails = pgTable("matter_emails", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** Filled when classified to a matter; null when in the inbox. */
  caseId:           uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  /** The mailbox this came from (a user's connected Outlook / Gmail). */
  mailboxUserId:    uuid("mailbox_user_id").references(() => users.id),
  /** Provider message id — for re-fetch + idempotency. */
  providerMessageId: text("provider_message_id").notNull(),
  provider:         text("provider").notNull(),       // outlook | gmail | manual
  direction:        emailDirectionEnum("direction").notNull(),
  subject:          text("subject").notNull(),
  fromAddress:      text("from_address").notNull(),
  toAddresses:      text("to_addresses").array().notNull().default([]),
  ccAddresses:      text("cc_addresses").array().notNull().default([]),
  /** RFC-5322 `In-Reply-To`/`References` for thread reconstruction. */
  inReplyTo:        text("in_reply_to"),
  threadId:         text("thread_id"),
  receivedAt:       timestamp("received_at", { withTimezone: true }).notNull(),
  bodyText:         text("body_text"),
  bodyHtml:         text("body_html"),
  /** Attachment summary; full bytes land in matter_documents on file. */
  attachmentsJson:  jsonb("attachments_json"),
  /** AI classification: `{ caseId, confidence, reasoning, intent }`. */
  classificationJson: jsonb("classification_json"),
  status:           emailClassificationStatusEnum("status").notNull().default("captured"),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant:    index("matter_emails_tenant_idx").on(t.tenantId),
  ixCase:      index("matter_emails_case_idx").on(t.caseId),
  ixThread:    index("matter_emails_thread_idx").on(t.threadId),
  uxProvider:  uniqueIndex("matter_emails_provider_uidx").on(t.tenantId, t.provider, t.providerMessageId),
}));

/* ═══════════ PHASE 2 — KNOWLEDGE OS (Sprint 13) ═══════════
 *
 * `knowledge_chunks` is the unified retrieval index. Every executed
 * document, every precedent, every approved knowledge item and every
 * filed email is split into 1-2KB chunks and projected here on write
 * (and on bulk re-index). The text column carries the raw content for
 * BM25-style lexical scoring; the `embeddingJson` column is the plug-in
 * point for a pgvector / Anthropic / OpenAI embedding when those land.
 *
 * Wall enforcement is structural, not stylistic:
 *   - sourceCaseId is non-null whenever the chunk's source is matter-
 *     scoped (documents, precedents, emails). The retrieval layer joins
 *     deniedCaseIdsForUser() and FILTERS BEFORE SCORING.
 *   - knowledge_items chunks have sourceCaseId = null and are visible
 *     firm-wide subject to the firm's `approved` + `learnFromThis` gates.
 */
export const knowledgeChunkSourceKindEnum = pgEnum("knowledge_chunk_source_kind", [
  "matter_document",
  "precedent",
  "knowledge_item",
  "matter_email",
]);

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** The originating object. */
  sourceKind:       knowledgeChunkSourceKindEnum("source_kind").notNull(),
  sourceId:         uuid("source_id").notNull(),
  /** Wall key — set when the chunk's source is matter-scoped; null for
   *  firm-wide knowledge items. The retrieval layer filters on this. */
  sourceCaseId:     uuid("source_case_id").references(() => cases.id, { onDelete: "cascade" }),
  /** Display label surfaced to the AI + the UI ("SHA — Falcon Industries"). */
  sourceTitle:      text("source_title").notNull(),
  /** Ordinal within the source (0,1,2…) used to reassemble + cite a page. */
  ordinal:          integer("ordinal").notNull(),
  text:             text("text").notNull(),
  /** Optional tags for facet filtering — kind, jurisdiction, governing law. */
  tagsJson:         jsonb("tags_json"),
  /** Embedding vector (when an embedder is wired). 1536-dim float[] today;
   *  later this swaps for pgvector. */
  embeddingJson:    jsonb("embedding_json"),
  /** Cheap, deterministic lexical signal — sorted unique terms ≥4 chars,
   *  used by the fallback BM25-ish scorer when no embedding is available. */
  termsJson:        jsonb("terms_json"),
  language:         text("language").notNull().default("en"),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant:   index("knowledge_chunks_tenant_idx").on(t.tenantId),
  ixSource:   index("knowledge_chunks_source_idx").on(t.sourceKind, t.sourceId),
  ixCase:     index("knowledge_chunks_case_idx").on(t.sourceCaseId),
  uxSourceOrd: uniqueIndex("knowledge_chunks_source_ord_uidx").on(t.sourceKind, t.sourceId, t.ordinal),
}));

/* ═══════════ PHASE 2 — LEGAL MATTER COPILOT (Sprint 14) ═══════════
 *
 * The Copilot turns a plain-English outcome ("list on ADX") into a complete
 * process plan grounded in the firm's historical packs. Plans persist here
 * so partner sign-off (or revision request) is auditable end-to-end. On
 * accept, the planner instantiates a new matter and seeds matter_processes
 * + matter_document_slots from the plan.
 */
export const copilotPlanStatusEnum = pgEnum("copilot_plan_status", [
  "draft",       // AI returned, no human has reviewed yet
  "approved",    // partner accepted; ready to instantiate
  "instantiated",// became a real matter
  "rejected",    // partner declined; plan retained for the audit trail
]);

/* ═══════════ FEEDBACK WIDGET — Sprint 22 ═══════════
 *
 * In-app floating widget. Captures feature ideas, bugs, praise + other
 * with the page the user was on so the team can triage in context.
 * Tenant-scoped; visible to firm_admin in /settings/feedback (later).
 */
export const userFeedbackKindEnum = pgEnum("user_feedback_kind", [
  "feature_idea", "bug", "praise", "other",
]);

export const userFeedback = pgTable("user_feedback", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:       uuid("user_id").references(() => users.id),
  kind:         userFeedbackKindEnum("kind").notNull(),
  message:      text("message").notNull(),
  /** Path the user was viewing when they sent feedback (privacy-safe). */
  pageContext:  text("page_context"),
  /** Browser metadata snapshot (locale, screen, ua). */
  metaJson:     jsonb("meta_json"),
  /** Set when an admin reads / acks the feedback. */
  reviewedAt:   timestamp("reviewed_at", { withTimezone: true }),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant: index("user_feedback_tenant_idx").on(t.tenantId),
  ixKind:   index("user_feedback_kind_idx").on(t.kind),
}));

/* ═══════════ PHASE 2 — GROWTH INTELLIGENCE (Sprint 21) ═══════════
 *
 * The "what's working + go-get-more" surface. Three tables encode the
 * outbound side of the firm: who we'd pursue, what we said, what came
 * back. The inputs (cases × invoices × time × intakes × regulatory
 * impacts) already exist; this layer adds the outbound graph.
 *
 *   bd_prospects   — companies the firm wants to pursue. Source can be
 *                    a lookalike match against a top-LTV client, a hit on
 *                    a regulatory impact assessment, or a manual add.
 *   bd_outreach    — messages sent to prospects + open / reply / convert
 *                    tracking. Resend message-id stored for audit.
 *   intake_requests.bd_outreach_id — set when an intake came in via an
 *                    outreach; closes the loop on conversion attribution.
 */
export const bdProspectStatusEnum = pgEnum("bd_prospect_status", [
  "new", "queued", "contacted", "engaged", "won", "lost", "cold",
]);
export const bdProspectSourceEnum = pgEnum("bd_prospect_source", [
  "lookalike", "regulatory_impact", "manual", "referral", "import",
]);

export const bdProspects = pgTable("bd_prospects", {
  id:                uuid("id").primaryKey().defaultRandom(),
  tenantId:          uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalName:         text("legal_name").notNull(),
  industry:          text("industry"),
  region:            regionEnum("region").notNull().default("UAE"),
  jurisdiction:      text("jurisdiction"),
  /** Best-effort contact bundle. */
  contactName:       text("contact_name"),
  contactEmail:      text("contact_email"),
  contactRole:       text("contact_role"),
  website:           text("website"),
  /** What put this prospect on the list. */
  source:            bdProspectSourceEnum("source").notNull().default("manual"),
  /** Provenance for the source — `{ analogClientId, analogMatterKind }`
   *  for lookalike; `{ regulatoryUpdateId }` for regulatory_impact. */
  sourceJson:        jsonb("source_json"),
  /** 0-100 — how similar this prospect is to our top historicals.
   *  Higher = greater predicted fit; ranks the hunting queue. */
  lookalikeScore:    integer("lookalike_score").notNull().default(0),
  /** Predicted fee opportunity in cents — from the predictor module. */
  predictedFeeCents: integer("predicted_fee_cents"),
  status:            bdProspectStatusEnum("status").notNull().default("new"),
  ownerUserId:       uuid("owner_user_id").references(() => users.id),
  createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant: index("bd_prospects_tenant_idx").on(t.tenantId),
  ixStatus: index("bd_prospects_status_idx").on(t.status),
  ixScore:  index("bd_prospects_score_idx").on(t.lookalikeScore),
}));

export const bdOutreachStatusEnum = pgEnum("bd_outreach_status", [
  "drafted", "sent", "opened", "replied", "converted", "bounced", "unsubscribed",
]);
export const bdOutreachChannelEnum = pgEnum("bd_outreach_channel", ["email", "linkedin", "meeting"]);

export const bdOutreach = pgTable("bd_outreach", {
  id:                uuid("id").primaryKey().defaultRandom(),
  tenantId:          uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  prospectId:        uuid("prospect_id").notNull().references(() => bdProspects.id, { onDelete: "cascade" }),
  channel:           bdOutreachChannelEnum("channel").notNull().default("email"),
  subject:           text("subject"),
  bodyText:          text("body_text"),
  bodyHtml:          text("body_html"),
  /** Resend message-id for the sent email. */
  providerMessageId: text("provider_message_id"),
  /** What grounded the AI draft — keep for the audit + reviewer feedback. */
  groundingJson:     jsonb("grounding_json"),
  sentByUserId:      uuid("sent_by_user_id").references(() => users.id),
  sentAt:            timestamp("sent_at", { withTimezone: true }),
  openedAt:          timestamp("opened_at", { withTimezone: true }),
  repliedAt:         timestamp("replied_at", { withTimezone: true }),
  convertedAt:       timestamp("converted_at", { withTimezone: true }),
  convertedToIntakeId: uuid("converted_to_intake_id"),
  status:            bdOutreachStatusEnum("status").notNull().default("drafted"),
  createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant:   index("bd_outreach_tenant_idx").on(t.tenantId),
  ixProspect: index("bd_outreach_prospect_idx").on(t.prospectId),
  ixStatus:   index("bd_outreach_status_idx").on(t.status),
}));

/* ═══════════ PHASE 2 — LEGAL KNOWLEDGE GRAPH (Sprint 20) ═══════════
 *
 * Typed graph linking the firm's business objects so AI can reason ACROSS
 * relationships, not over flat documents.
 *
 *   nodes  — one row per real entity (matter, company, contract, clause,
 *            regulation, lawyer, time entry). `entityKind` + `entityId`
 *            give a back-pointer; `label` is the AI/UI display string.
 *   edges  — typed directed relationships, with temporal versioning
 *            (validFrom / validTo) so historical queries stay correct.
 *
 * Projector lives at lib/kg/project.ts. It is a write-path hook: every
 * insert/update on cases/companies/contracts/clauses/regulatory_updates
 * upserts the matching node + recomputes its edges. Wall-aware: when an
 * edge references a walled matter, the projector tags the row so the
 * query layer can hide it from non-members.
 */
export const knowledgeGraphNodeKindEnum = pgEnum("kg_node_kind", [
  "matter", "company", "contract", "clause", "regulation", "user", "time_entry", "shareholder",
]);
export const knowledgeGraphEdgeKindEnum = pgEnum("kg_edge_kind", [
  "matter_on_company",        // matter → company
  "matter_lead",              // matter → user (lead lawyer)
  "contract_on_matter",       // contract → matter
  "contract_with_party",      // contract → company (counterparty)
  "clause_in_contract",       // clause → contract
  "regulation_affects",       // regulation → company
  "subsidiary_of",            // company → company (parent)
  "time_on_matter",           // time_entry → matter
  "ubo_of",                   // shareholder → company (ultimate beneficial owner)
]);

export const knowledgeGraphNodes = pgTable("knowledge_graph_nodes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind:         knowledgeGraphNodeKindEnum("kind").notNull(),
  entityId:     uuid("entity_id").notNull(),               // back-pointer to the source row
  label:        text("label").notNull(),                   // display label
  /** Walled-matter tag — when set, the node is hidden to non-members. */
  walledCaseId: uuid("walled_case_id").references(() => cases.id, { onDelete: "set null" }),
  /** Free-form props the projector wants surfaced (jurisdiction, status, …). */
  propsJson:    jsonb("props_json"),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxEntity: uniqueIndex("kg_nodes_entity_uidx").on(t.tenantId, t.kind, t.entityId),
  ixWalled: index("kg_nodes_walled_idx").on(t.walledCaseId),
}));

export const knowledgeGraphEdges = pgTable("knowledge_graph_edges", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind:         knowledgeGraphEdgeKindEnum("kind").notNull(),
  fromNodeId:   uuid("from_node_id").notNull().references(() => knowledgeGraphNodes.id, { onDelete: "cascade" }),
  toNodeId:     uuid("to_node_id").notNull().references(() => knowledgeGraphNodes.id, { onDelete: "cascade" }),
  /** Temporal versioning so historical queries stay correct on close /
   *  resignation / supersession. */
  validFrom:    timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
  validTo:      timestamp("valid_to", { withTimezone: true }),
  /** Optional walled-matter tag — same enforcement as on nodes. */
  walledCaseId: uuid("walled_case_id").references(() => cases.id, { onDelete: "set null" }),
  propsJson:    jsonb("props_json"),
}, (t) => ({
  uxEdge:  uniqueIndex("kg_edges_uidx").on(t.tenantId, t.kind, t.fromNodeId, t.toNodeId, t.validFrom),
  ixFrom:  index("kg_edges_from_idx").on(t.fromNodeId),
  ixTo:    index("kg_edges_to_idx").on(t.toNodeId),
}));

/* ═══════════ PHASE 2 — REGULATORY CHANGE INTELLIGENCE (Sprint 16) ═══════════
 *
 * Three tables drive the Regulatory Impact Engine:
 *
 *   regulatory_sources              — the per-regulator ingest channels
 *                                     (UAE Federal Gazette, ADGM FSRA,
 *                                      DIFC DFSA, ADX, Nasdaq Dubai,
 *                                      Tadawul, CMA KSA, ZATCA, …)
 *   regulatory_updates              — individual rule changes ingested
 *                                     from those sources (title, summary,
 *                                     full URL, publishedAt, provider).
 *                                     NOT tenant-scoped — these are
 *                                     observable platform-wide.
 *   regulatory_impact_assessments   — per-firm assessment of which clients,
 *                                     contracts and entities are affected
 *                                     by a given update. Drives the
 *                                     /compliance/changes screen and the
 *                                     BD widget on /firm-dashboard.
 */
export const regulatoryUpdateSeverityEnum = pgEnum("regulatory_update_severity", [
  "info", "low", "medium", "high", "critical",
]);
export const regulatoryUpdateStatusEnum = pgEnum("regulatory_update_status", [
  "ingested", "classified", "assessed", "broadcast", "archived",
]);

export const regulatorySources = pgTable("regulatory_sources", {
  id:            uuid("id").primaryKey().defaultRandom(),
  region:        regionEnum("region").notNull(),
  regulator:     text("regulator").notNull(),           // "ADGM FSRA", "DFSA", "ADX", …
  name:          text("name").notNull(),                // human label
  url:           text("url"),                           // feed / page URL
  kind:          text("kind").notNull().default("gazette"),  // gazette | rss | api | manual
  active:        boolean("active").notNull().default(true),
  lastIngestedAt: timestamp("last_ingested_at", { withTimezone: true }),
}, (t) => ({
  ixRegulator: index("regulatory_sources_regulator_idx").on(t.regulator),
}));

export const regulatoryUpdates = pgTable("regulatory_updates", {
  id:            uuid("id").primaryKey().defaultRandom(),
  sourceId:      uuid("source_id").references(() => regulatorySources.id, { onDelete: "set null" }),
  /** Stable identifier in the source system (or hash of url+title). */
  providerKey:   text("provider_key").notNull(),
  region:        regionEnum("region").notNull(),
  regulator:     text("regulator").notNull(),
  title:         text("title").notNull(),
  summary:       text("summary"),
  fullText:      text("full_text"),
  sourceUrl:     text("source_url"),
  publishedAt:   timestamp("published_at", { withTimezone: true }).notNull(),
  ingestedAt:    timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  severity:      regulatoryUpdateSeverityEnum("severity").notNull().default("info"),
  /** Extracted concepts the engine matches against firm holdings: e.g.
   *   { entityTypes: ["LLC", "FZ-LLC"],
   *     clauseTriggers: ["governing law", "data residency"],
   *     licenceCategories: ["financial services", "investment manager"],
   *     sectors: ["fintech", "logistics"],
   *     deadlineDays: 90 }. */
  extractedJson: jsonb("extracted_json"),
  status:        regulatoryUpdateStatusEnum("status").notNull().default("ingested"),
}, (t) => ({
  ixRegion:     index("regulatory_updates_region_idx").on(t.region),
  ixPub:        index("regulatory_updates_published_idx").on(t.publishedAt),
  uxProvider:   uniqueIndex("regulatory_updates_provider_uidx").on(t.providerKey),
}));

export const regulatoryImpactAssessments = pgTable("regulatory_impact_assessments", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  tenantId:           uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  regulatoryUpdateId: uuid("regulatory_update_id").notNull().references(() => regulatoryUpdates.id, { onDelete: "cascade" }),
  /** Counts surfaced to the BD widget — drillable to the items below. */
  affectedClientCount:   integer("affected_client_count").notNull().default(0),
  affectedCompanyCount:  integer("affected_company_count").notNull().default(0),
  affectedContractCount: integer("affected_contract_count").notNull().default(0),
  affectedMatterCount:   integer("affected_matter_count").notNull().default(0),
  /** Detailed affected-entity refs:
   *  { clients: [{ id, name }], companies: [{ id, name, jurisdiction }],
   *    contracts: [{ id, title }], matters: [{ id, title }] } */
  affectedJson:       jsonb("affected_json"),
  /** Per-update partner memo, EN + AR. */
  memoEn:             text("memo_en"),
  memoAr:             text("memo_ar"),
  /** Required actions the firm should take per client, in order. */
  actionsJson:        jsonb("actions_json"),
  severity:           regulatoryUpdateSeverityEnum("severity").notNull().default("info"),
  /** Estimated fee opportunity (cents) — sum across required actions. */
  estimatedFeeCents:  integer("estimated_fee_cents"),
  createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxOnce: uniqueIndex("regulatory_impact_uidx").on(t.tenantId, t.regulatoryUpdateId),
  ixSev:  index("regulatory_impact_sev_idx").on(t.severity),
}));

export const copilotPlans = pgTable("copilot_plans", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  requesterUserId:  uuid("requester_user_id").notNull().references(() => users.id),
  outcome:          text("outcome").notNull(),                  // the user's plain-English ask
  region:           regionEnum("region").notNull().default("UAE"),
  jurisdiction:     text("jurisdiction"),
  language:         text("language").notNull().default("en"),
  /** Full plan JSON — { title, kind, expectedDurationDays, steps[], slots[],
   *                     regulators[], risks[], estimatedFeeCents,
   *                     confidence, citationsToHistoricals[] }. */
  planJson:         jsonb("plan_json").notNull(),
  /** Top-level confidence 0-100, surfaced on the partner dashboard. */
  confidence:       integer("confidence").notNull().default(0),
  status:           copilotPlanStatusEnum("status").notNull().default("draft"),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  approvedAt:       timestamp("approved_at", { withTimezone: true }),
  rejectedReason:   text("rejected_reason"),
  /** Case created when the partner accepted + instantiated. */
  instantiatedCaseId: uuid("instantiated_case_id").references(() => cases.id, { onDelete: "set null" }),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant: index("copilot_plans_tenant_idx").on(t.tenantId),
  ixStatus: index("copilot_plans_status_idx").on(t.status),
}));



/* AUTH ACTIVATION + PASSWORD RESET (Sprint 22) */
export const accountActivationStatusEnum = pgEnum("account_activation_status", [
  "pending", "verified", "expired",
]);
export const accountActivations = pgTable("account_activations", {
  id:         uuid("id").primaryKey().defaultRandom(),
  email:      text("email").notNull(),
  tokenHash:  text("token_hash").notNull(),
  expiresAt:  timestamp("expires_at", { withTimezone: true }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  status:     accountActivationStatusEnum("status").notNull().default("pending"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxToken: uniqueIndex("account_activations_token_uidx").on(t.tokenHash),
  ixEmail: index("account_activations_email_idx").on(t.email),
}));

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id:         uuid("id").primaryKey().defaultRandom(),
  email:      text("email").notNull(),
  tokenHash:  text("token_hash").notNull(),
  expiresAt:  timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt:     timestamp("used_at",   { withTimezone: true }),
  ipAddress:  text("ip_address"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxToken: uniqueIndex("password_reset_tokens_token_uidx").on(t.tokenHash),
  ixEmail: index("password_reset_tokens_email_idx").on(t.email),
}));
