/**
 * Lexoni.ai — data model
 *
 * Multi-tenant. Three tenant flavors share the same schema:
 *  - "firm"   = a law firm (has many lawyers; lawyers have admin + helper roles)
 *  - "client" = a corporate / fund customer that manages its own companies
 *  - "ops"    = platform-internal operators
 *
 * Region-aware: every record carries a `region` so AI ranking, templates,
 * compliance, and analytics ("most-used templates / highest-value transactions
 * in this region") can be served in context.
 *
 * Versioning: contracts, clauses, resolutions, and case documents all use a
 * (parent_id, version) pattern with an `is_current` pointer so the audit trail
 * is complete (GDPR / SOX-friendly).
 */
import {
  pgTable, uuid, text, timestamp, integer, numeric, boolean, jsonb,
  pgEnum, primaryKey, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { regionEnum } from "./enums";

/* ────────────────────────────── ENUMS ────────────────────────────── */
export { regionEnum };
export const tenantKindEnum= pgEnum("tenant_kind", ["firm", "client", "ops"]);
export const userRoleEnum  = pgEnum("user_role", [
  "platform_admin",
  "firm_admin",        // partner / managing partner
  "lawyer",            // fee earner
  "lawyer_helper",     // paralegal / assistant tied to a lawyer
  "client_admin",      // company's own legal ops lead
  "client_member",     // client team member
  "client_viewer",     // read-only client (board observer)
]);
export const caseStatusEnum = pgEnum("case_status",
  ["intake", "open", "in_review", "in_court", "in_arbitration", "settled", "closed", "archived"]);
export const matterTypeEnum = pgEnum("matter_type",
  ["litigation", "advisory", "corporate", "regulatory", "ip", "ma", "employment", "tax", "real_estate"]);
export const contractStatusEnum = pgEnum("contract_status",
  ["draft", "in_review", "negotiating", "out_for_signature", "executed", "expired", "terminated"]);
export const billStatusEnum = pgEnum("bill_status",
  ["draft", "issued", "partial", "paid", "overdue", "written_off"]);
export const consentBasisEnum = pgEnum("consent_basis",
  ["consent", "contract", "legal_obligation", "vital_interest", "public_task", "legitimate_interest"]);
export const dsrTypeEnum = pgEnum("dsr_type",
  ["access", "rectification", "erasure", "restriction", "portability", "objection"]);
export const dsrStatusEnum = pgEnum("dsr_status",
  ["received", "verifying", "in_progress", "completed", "rejected"]);
export const intakeStatusEnum = pgEnum("intake_status",
  ["new", "triaging", "assigned", "engaged", "rejected", "spam"]);
export const sectorEnum = pgEnum("sector", [
  "fintech", "real_estate", "energy", "healthcare", "tech_saas", "ecommerce",
  "manufacturing", "logistics", "media", "retail", "professional_services",
  "non_profit", "family_office", "fund_gp", "fund_lp", "other",
]);
export const legalFunctionEnum = pgEnum("legal_function", [
  "incorporation", "corporate_governance", "ma", "fundraising", "vc_pe",
  "employment", "ip_trademark", "ip_patent", "litigation", "arbitration",
  "regulatory", "tax", "data_privacy", "real_estate_law", "competition",
  "sanctions", "esg", "sharia_finance", "family_office", "other",
]);
export const engagementStatusEnum = pgEnum("engagement_status",
  ["draft", "sent", "viewed", "countersigned", "executed", "declined", "expired"]);
export const automationKindEnum = pgEnum("automation_kind", [
  "welcome_email", "engagement_letter", "intake_ack", "filing_reminder",
  "renewal_alert", "invoice_dunning", "dsr_acknowledgement",
]);
export const automationTriggerEnum = pgEnum("automation_trigger", [
  "on_intake_received", "on_client_created", "on_engagement_signed",
  "on_matter_opened", "on_filing_due", "on_contract_renewal",
  "on_invoice_overdue", "on_dsr_received",
]);
export const templateScopeEnum = pgEnum("template_scope",
  ["personal", "firm", "marketplace"]);
export const collabRoleEnum = pgEnum("collab_role", [
  "master", "co_counsel", "specialist", "foreign_counsel", "local_counsel", "observer",
]);
export const sigOrderEnum = pgEnum("sig_order", ["sequential", "parallel"]);
export const sigPartyStatusEnum = pgEnum("sig_party_status",
  ["pending", "notified", "viewed", "signed", "declined", "expired"]);
export const planTierEnum = pgEnum("plan_tier",
  ["trial", "solo", "small", "mid", "enterprise"]);
export const subStatusEnum = pgEnum("sub_status",
  ["trialing", "active", "past_due", "cancelled", "paused"]);
export const integrationKindEnum = pgEnum("integration_kind",
  ["m365", "outlook", "teams", "whatsapp", "docusign", "google_workspace", "slack", "zatca"]);
export const partnerVisEnum = pgEnum("partner_visibility",
  ["all_firm_matters", "assigned_only"]);

/* ───────────────────────── CORE: TENANCY & USERS ───────────────────────── */
export const tenants = pgTable("tenants", {
  id:        uuid("id").primaryKey().defaultRandom(),
  kind:      tenantKindEnum("kind").notNull(),
  name:      text("name").notNull(),
  region:    regionEnum("region").notNull(),
  locale:    text("locale").notNull().default("en"),       // en | ar
  brand:     jsonb("brand").$type<{ logoUrl?: string; primary?: string }>(),
  // GDPR / UAE PDPL / KSA PDPL controller
  dpoEmail:  text("dpo_email"),
  dataResidency: text("data_residency").default("UAE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id:         uuid("id").primaryKey().defaultRandom(),
  email:      text("email").notNull(),
  fullName:   text("full_name").notNull(),
  locale:     text("locale").notNull().default("en"),
  phone:      text("phone"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ uxEmail: uniqueIndex("users_email_uidx").on(t.email) }));

/** A user can belong to many tenants (e.g. a partner advising several firms). */
export const memberships = pgTable("memberships", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  role:      userRoleEnum("role").notNull(),
  /** For lawyer_helper: which lawyer they assist. */
  reportsToUserId: uuid("reports_to_user_id"),
  /** A lawyer's hourly billing rate at this firm (USD-cents). */
  hourlyRateCents: integer("hourly_rate_cents"),
  active:    boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxMember:  uniqueIndex("memberships_user_tenant_uidx").on(t.userId, t.tenantId),
  ixTenant:  index("memberships_tenant_idx").on(t.tenantId),
}));

/* ───────────────────────── CORPORATE SECRETARY ───────────────────────── */
export const companies = pgTable("companies", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalName:    text("legal_name").notNull(),
  legalNameAr:  text("legal_name_ar"),
  jurisdiction: text("jurisdiction").notNull(),  // ADGM, DIFC, DMCC, IFZA, DED, RAKEZ, MISA…
  region:       regionEnum("region").notNull(),
  licenseNo:    text("license_no"),
  incorporationDate: timestamp("incorporation_date", { withTimezone: true }),
  status:       text("status").notNull().default("active"),  // active | dormant | dissolved
  parentCompanyId: uuid("parent_company_id"),                // ownership tree
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant: index("companies_tenant_idx").on(t.tenantId),
  ixRegion: index("companies_region_idx").on(t.region),
}));

export const directors = pgTable("directors", {
  id:         uuid("id").primaryKey().defaultRandom(),
  companyId:  uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  fullName:   text("full_name").notNull(),
  nationality:text("nationality"),
  role:       text("role").notNull(),     // chair | director | independent | observer
  appointedAt:timestamp("appointed_at", { withTimezone: true }),
  resignedAt: timestamp("resigned_at",  { withTimezone: true }),
  passportNo: text("passport_no"),
  emiratesId: text("emirates_id"),
});

export const shareholders = pgTable("shareholders", {
  id:         uuid("id").primaryKey().defaultRandom(),
  companyId:  uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  holderName: text("holder_name").notNull(),
  holderKind: text("holder_kind").notNull(),     // individual | entity | trust | fund
  countryOfResidence: text("country_of_residence"),
  isUbo:      boolean("is_ubo").notNull().default(false),
});

export const shareClasses = pgTable("share_classes", {
  id:         uuid("id").primaryKey().defaultRandom(),
  companyId:  uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name:       text("name").notNull(),            // Common, Preferred A…
  authorized: integer("authorized").notNull(),
  parValueCents: integer("par_value_cents").notNull().default(0),
  preferences: jsonb("preferences"),
});

export const captableEntries = pgTable("captable_entries", {
  id:            uuid("id").primaryKey().defaultRandom(),
  companyId:     uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  shareholderId: uuid("shareholder_id").notNull().references(() => shareholders.id, { onDelete: "cascade" }),
  shareClassId:  uuid("share_class_id").notNull().references(() => shareClasses.id),
  quantity:      integer("quantity").notNull(),
  issuedAt:      timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  certificateNo: text("certificate_no"),
});

/* ────────────────────────────── GOVERNANCE ────────────────────────────── */
export const boardMeetings = pgTable("board_meetings", {
  id:        uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title:     text("title").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  kind:      text("kind").notNull(),    // board | agm | egm | committee
  quorum:    integer("quorum").notNull().default(0),
  minutesUrl: text("minutes_url"),
  status:    text("status").notNull().default("scheduled"),
});

export const resolutions = pgTable("resolutions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  meetingId: uuid("meeting_id").references(() => boardMeetings.id, { onDelete: "set null" }),
  title:     text("title").notNull(),
  bodyMd:    text("body_md").notNull(),
  version:   integer("version").notNull().default(1),
  isCurrent: boolean("is_current").notNull().default(true),
  status:    text("status").notNull().default("draft"),
  signedAt:  timestamp("signed_at", { withTimezone: true }),
});

/* ─────────────────────────────── CONTRACTS ─────────────────────────────── */
export const contracts = pgTable("contracts", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  companyId:  uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  caseId:     uuid("case_id"),  // back-fill ref after cases table declared
  title:      text("title").notNull(),
  kind:       text("kind").notNull(),       // NDA | SHA | SPA | Employment | JV …
  counterparty: text("counterparty"),
  status:     contractStatusEnum("status").notNull().default("draft"),
  region:     regionEnum("region").notNull(),
  governingLaw: text("governing_law"),
  effectiveDate: timestamp("effective_date", { withTimezone: true }),
  expiryDate:    timestamp("expiry_date", { withTimezone: true }),
  riskScore:  integer("risk_score").default(0),    // 0-100, AI-derived
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixTenant: index("contracts_tenant_idx").on(t.tenantId),
  ixStatus: index("contracts_status_idx").on(t.status),
  ixRegion: index("contracts_region_idx").on(t.region),
}));

/** Every save creates a new contract_versions row → full diff/version history. */
export const contractVersions = pgTable("contract_versions", {
  id:           uuid("id").primaryKey().defaultRandom(),
  contractId:   uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  version:      integer("version").notNull(),
  isCurrent:    boolean("is_current").notNull().default(false),
  bodyMd:       text("body_md").notNull(),
  diffSummary:  text("diff_summary"),
  authorUserId: uuid("author_user_id").references(() => users.id),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxCv: uniqueIndex("contract_versions_uidx").on(t.contractId, t.version),
}));

export const clauses = pgTable("clauses", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null = global library
  title:      text("title").notNull(),
  bodyMd:     text("body_md").notNull(),
  region:     regionEnum("region").notNull(),
  language:   text("language").notNull().default("en"),
  tags:       text("tags").array(),
  usageCount: integer("usage_count").notNull().default(0),
  version:    integer("version").notNull().default(1),
  parentId:   uuid("parent_id"),    // earlier version
});

export const signatures = pgTable("signatures", {
  id:            uuid("id").primaryKey().defaultRandom(),
  contractId:    uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  signerName:    text("signer_name").notNull(),
  signerEmail:   text("signer_email").notNull(),
  signedAt:      timestamp("signed_at", { withTimezone: true }),
  ipAddress:     text("ip_address"),
  certificateHash: text("certificate_hash"),
});

/* ─────────────────────────── CASE MANAGEMENT ─────────────────────────── */
/** Used by both law-firm tenants AND client tenants (in-house matters). */
export const cases = pgTable("cases", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  clientTenantId:  uuid("client_tenant_id").references(() => tenants.id),  // firm view: who the client is
  companyId:       uuid("company_id").references(() => companies.id),
  matterNumber:    text("matter_number").notNull(),
  title:           text("title").notNull(),
  matterType:      matterTypeEnum("matter_type").notNull(),
  status:          caseStatusEnum("status").notNull().default("intake"),
  region:          regionEnum("region").notNull(),
  jurisdiction:    text("jurisdiction"),
  opposingParty:   text("opposing_party"),
  courtRef:        text("court_ref"),
  description:     text("description"),
  budgetCents:     integer("budget_cents"),
  feeArrangement:  text("fee_arrangement"),    // hourly | fixed | retainer | contingency
  openedAt:        timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt:        timestamp("closed_at", { withTimezone: true }),
  leadLawyerId:    uuid("lead_lawyer_id").references(() => users.id),
  conflictsCleared:boolean("conflicts_cleared").notNull().default(false),
  conflictsClearedAt: timestamp("conflicts_cleared_at", { withTimezone: true }),
}, (t) => ({
  ixTenant: index("cases_tenant_idx").on(t.tenantId),
  ixStatus: index("cases_status_idx").on(t.status),
  uxMatter: uniqueIndex("cases_matter_uidx").on(t.tenantId, t.matterNumber),
}));

/** Lawyer / helper assignments to a case; supports billing splits. */
export const caseAssignments = pgTable("case_assignments", {
  id:         uuid("id").primaryKey().defaultRandom(),
  caseId:     uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role:       text("role").notNull(),    // lead | second_chair | helper | reviewer
  hourlyRateCents: integer("hourly_rate_cents"),
  active:     boolean("active").notNull().default(true),
});

export const caseDocuments = pgTable("case_documents", {
  id:         uuid("id").primaryKey().defaultRandom(),
  caseId:     uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  title:      text("title").notNull(),
  kind:       text("kind").notNull(),    // pleading | exhibit | correspondence | research | order
  version:    integer("version").notNull().default(1),
  isCurrent:  boolean("is_current").notNull().default(true),
  storageUrl: text("storage_url").notNull(),
  uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const caseEvents = pgTable("case_events", {
  id:        uuid("id").primaryKey().defaultRandom(),
  caseId:    uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  occurredAt:timestamp("occurred_at", { withTimezone: true }).notNull(),
  kind:      text("kind").notNull(),    // hearing | filing_due | call | note | status_change
  title:     text("title").notNull(),
  body:      text("body"),
});

/* ──────────────────── CLIENT PORTAL — REQUEST-FOR-INFO ──────────────────── */
/**
 * "Allow clients to input instead of just emails when we need info for a client portal."
 * A firm sends an information request → client fills a structured form in the portal.
 */
export const infoRequests = pgTable("info_requests", {
  id:            uuid("id").primaryKey().defaultRandom(),
  tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:        uuid("case_id").references(() => cases.id, { onDelete: "cascade" }),
  contractId:    uuid("contract_id").references(() => contracts.id, { onDelete: "cascade" }),
  toClientTenantId: uuid("to_client_tenant_id").notNull().references(() => tenants.id),
  toUserId:      uuid("to_user_id").references(() => users.id),
  title:         text("title").notNull(),
  description:   text("description"),
  /** JSON Schema-style fields the client must fill in. */
  fields:        jsonb("fields").$type<Array<{ key: string; label: string; type: string; required?: boolean }>>().notNull(),
  /** Responses keyed by field.key. */
  responses:     jsonb("responses").$type<Record<string, unknown>>(),
  status:        text("status").notNull().default("sent"),  // draft | sent | partial | received | cancelled
  dueAt:         timestamp("due_at", { withTimezone: true }),
  submittedAt:   timestamp("submitted_at", { withTimezone: true }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ──────────────────────── BILLING / TIME / INVOICES ──────────────────────── */
export const timeEntries = pgTable("time_entries", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:     uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workedOn:   timestamp("worked_on", { withTimezone: true }).notNull(),
  minutes:    integer("minutes").notNull(),
  description:text("description").notNull(),
  rateCents:  integer("rate_cents").notNull(),
  billable:   boolean("billable").notNull().default(true),
  invoiceId:  uuid("invoice_id"),  // populated when billed
  /** How this entry was created: passive | ai_suggested | manual (anti-timesheet model). */
  source:     text("source").notNull().default("manual"),
  /** Null = awaiting the end-of-day "confirm your time" sweep. */
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  /** Optional link to the matter document slot the work was against. */
  slotId:     uuid("slot_id"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixCase: index("time_entries_case_idx").on(t.caseId) }));

export const expenses = pgTable("expenses", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:     uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  incurredOn: timestamp("incurred_on", { withTimezone: true }).notNull(),
  amountCents:integer("amount_cents").notNull(),
  category:   text("category").notNull(),
  description:text("description"),
  invoiceId:  uuid("invoice_id"),
});

export const invoices = pgTable("invoices", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:       uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  number:       text("number").notNull(),
  toTenantId:   uuid("to_tenant_id").references(() => tenants.id),  // billed-to client
  currency:     text("currency").notNull().default("AED"),
  subtotalCents:integer("subtotal_cents").notNull().default(0),
  vatCents:     integer("vat_cents").notNull().default(0),    // KSA/UAE VAT 5%
  totalCents:   integer("total_cents").notNull().default(0),
  status:       billStatusEnum("status").notNull().default("draft"),
  issuedAt:     timestamp("issued_at", { withTimezone: true }),
  dueAt:        timestamp("due_at", { withTimezone: true }),
  paidAt:       timestamp("paid_at", { withTimezone: true }),
}, (t) => ({ uxInvNo: uniqueIndex("invoices_number_uidx").on(t.tenantId, t.number) }));

export const payments = pgTable("payments", {
  id:           uuid("id").primaryKey().defaultRandom(),
  invoiceId:    uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  receivedAt:   timestamp("received_at", { withTimezone: true }).notNull(),
  amountCents:  integer("amount_cents").notNull(),
  method:       text("method").notNull(),    // bank | card | escrow | crypto
  reference:    text("reference"),
});

/* ───────────────────────────── COMPLIANCE ───────────────────────────── */
export const complianceTasks = pgTable("compliance_tasks", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  companyId:    uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  regulator:    text("regulator").notNull(),     // ADGM | DIFC | DMCC | IFZA | DED | RAKEZ | MISA | Qiwa | Muqeem | ZATCA
  title:        text("title").notNull(),
  description:  text("description"),
  dueAt:        timestamp("due_at", { withTimezone: true }).notNull(),
  region:       regionEnum("region").notNull(),
  severity:     text("severity").notNull().default("medium"),  // low | medium | high | critical
  status:       text("status").notNull().default("open"),       // open | in_progress | filed | overdue | waived
  assigneeUserId: uuid("assignee_user_id").references(() => users.id),
  completedAt:  timestamp("completed_at", { withTimezone: true }),
  evidenceUrl:  text("evidence_url"),
}, (t) => ({
  ixDue: index("compliance_tasks_due_idx").on(t.dueAt),
  ixReg: index("compliance_tasks_region_idx").on(t.region),
}));

export const licenses = pgTable("licenses", {
  id:         uuid("id").primaryKey().defaultRandom(),
  companyId:  uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  authority:  text("authority").notNull(),
  number:     text("number").notNull(),
  issuedAt:   timestamp("issued_at", { withTimezone: true }).notNull(),
  expiresAt:  timestamp("expires_at", { withTimezone: true }).notNull(),
  status:     text("status").notNull().default("active"),
});

/* ───────────────────── GDPR / UAE-PDPL / KSA-PDPL ───────────────────── */
/** Article 30-style record of processing activity per tenant. */
export const dataProcessingActivities = pgTable("data_processing_activities", {
  id:            uuid("id").primaryKey().defaultRandom(),
  tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:          text("name").notNull(),                  // e.g. "Client onboarding"
  purpose:       text("purpose").notNull(),
  lawfulBasis:   consentBasisEnum("lawful_basis").notNull(),
  dataCategories:text("data_categories").array().notNull(),  // identity, financial, special-category…
  recipients:    text("recipients").array(),
  thirdCountryTransfers: text("third_country_transfers").array(),
  retentionMonths: integer("retention_months").notNull(),
  securityMeasures: text("security_measures"),
  reviewedAt:    timestamp("reviewed_at", { withTimezone: true }),
});

/** Per-data-subject consent records. */
export const consentRecords = pgTable("consent_records", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  subjectEmail: text("subject_email").notNull(),
  purpose:      text("purpose").notNull(),
  basis:        consentBasisEnum("basis").notNull(),
  granted:      boolean("granted").notNull(),
  grantedAt:    timestamp("granted_at", { withTimezone: true }).notNull(),
  revokedAt:    timestamp("revoked_at", { withTimezone: true }),
  evidence:     text("evidence"),    // signature, IP, source URL
});

/** Data subject requests (GDPR Art. 15-22). */
export const dataSubjectRequests = pgTable("data_subject_requests", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type:         dsrTypeEnum("type").notNull(),
  status:       dsrStatusEnum("status").notNull().default("received"),
  subjectName:  text("subject_name").notNull(),
  subjectEmail: text("subject_email").notNull(),
  receivedAt:   timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  dueAt:        timestamp("due_at", { withTimezone: true }).notNull(),   // 30-day statutory clock
  completedAt:  timestamp("completed_at", { withTimezone: true }),
  notes:        text("notes"),
});

/** Append-only audit log — supports GDPR Art. 30 + SOX-style trails. */
export const auditLog = pgTable("audit_log", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  userId:     uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action:     text("action").notNull(),    // view | create | update | delete | export | sign
  entityKind: text("entity_kind").notNull(),
  entityId:   uuid("entity_id"),
  beforeJson: jsonb("before_json"),
  afterJson:  jsonb("after_json"),
  ipAddress:  text("ip_address"),
  userAgent:  text("user_agent"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixTime: index("audit_log_time_idx").on(t.occurredAt) }));

/* ───────────────────── MARKETPLACE ───────────────────── */
export const providers = pgTable("providers", {
  id:         uuid("id").primaryKey().defaultRandom(),
  kind:       text("kind").notNull(),    // law_firm | corp_sec | tax | notary | compliance
  name:       text("name").notNull(),
  region:     regionEnum("region").notNull(),
  expertise:  text("expertise").array(),
  industries: text("industries").array(),
  ratingAvg:  numeric("rating_avg", { precision: 3, scale: 2 }),
  pricingFrom:integer("pricing_from_cents"),
  tenantId:   uuid("tenant_id").references(() => tenants.id),
  verified:   boolean("verified").notNull().default(false),
});

export const proposals = pgTable("proposals", {
  id:           uuid("id").primaryKey().defaultRandom(),
  providerId:   uuid("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  fromTenantId: uuid("from_tenant_id").notNull().references(() => tenants.id),
  topic:        text("topic").notNull(),
  bodyMd:       text("body_md"),
  feeCents:     integer("fee_cents"),
  status:       text("status").notNull().default("sent"),    // sent | viewed | accepted | rejected
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ───────────────────────────── M&A ───────────────────────────── */
export const deals = pgTable("deals", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  codeName:   text("code_name").notNull(),
  side:       text("side").notNull(),    // buy | sell
  status:     text("status").notNull().default("scoping"),
  valueCents: numeric("value_cents"),
  region:     regionEnum("region").notNull(),
});

export const dealRoomDocs = pgTable("deal_room_docs", {
  id:         uuid("id").primaryKey().defaultRandom(),
  dealId:     uuid("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  title:      text("title").notNull(),
  folder:     text("folder").notNull(),
  storageUrl: text("storage_url").notNull(),
  version:    integer("version").notNull().default(1),
  isCurrent:  boolean("is_current").notNull().default(true),
});

/* ───────────────────────── NOTIFICATIONS ───────────────────────── */
export const notifications = pgTable("notifications", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind:       text("kind").notNull(),
  title:      text("title").notNull(),
  body:       text("body"),
  href:       text("href"),
  readAt:     timestamp("read_at", { withTimezone: true }),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ──────────────────────────── WHITE-LABEL ────────────────────────────
 * Each firm tenant can host its own branded portal at a custom domain
 * (e.g. portal.crescentlaw.ae). All firm data is strictly tenant-scoped —
 * every query filters on tenant_id. A firm never sees another firm's data.
 */
export const firmBranding = pgTable("firm_branding", {
  id:              uuid("id").primaryKey().defaultRandom(),
  tenantId:        uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** White-label hostname, e.g. "portal.crescentlaw.ae" */
  customDomain:    text("custom_domain"),
  /** Sub-domain on the platform fallback, e.g. "crescentlaw.lexoni.ai" */
  subdomain:       text("subdomain"),
  logoUrl:         text("logo_url"),
  faviconUrl:      text("favicon_url"),
  primaryColor:    text("primary_color").notNull().default("#2563EB"),
  accentColor:     text("accent_color"),
  fontFamily:      text("font_family"),
  /** Outbound email identity: "from", "reply-to", SPF/DKIM verified domain */
  emailFromName:   text("email_from_name"),
  emailFromAddr:   text("email_from_addr"),
  emailDomainVerifiedAt: timestamp("email_domain_verified_at", { withTimezone: true }),
  /** Public-facing intake page slug (lexoni.ai/intake/<slug>) */
  intakeSlug:      text("intake_slug"),
  /** Hide "Powered by Lexoni.ai" footer */
  hideAttribution: boolean("hide_attribution").notNull().default(false),
  /** Custom legal terms shown in the client portal */
  termsMd:         text("terms_md"),
  privacyMd:       text("privacy_md"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxTenant:    uniqueIndex("firm_branding_tenant_uidx").on(t.tenantId),
  uxDomain:    uniqueIndex("firm_branding_domain_uidx").on(t.customDomain),
  uxSubdomain: uniqueIndex("firm_branding_subdomain_uidx").on(t.subdomain),
  uxSlug:      uniqueIndex("firm_branding_slug_uidx").on(t.intakeSlug),
}));

/* ────────────────────── LAWYER EXPERTISE REGISTRY ──────────────────────
 * Powers routing: when an intake comes in we match its (sector, function,
 * region, language) tuple against this registry plus the routing rules.
 */
export const lawyerExpertise = pgTable("lawyer_expertise", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectors:      sectorEnum("sectors").array().notNull().default([]),
  functions:    legalFunctionEnum("functions").array().notNull().default([]),
  regions:      regionEnum("regions").array().notNull().default([]),
  languages:    text("languages").array().notNull().default([]),  // en, ar, fr…
  yearsExp:     integer("years_exp"),
  /** Capacity guardrail — declines auto-routing when over. */
  maxConcurrentMatters: integer("max_concurrent_matters").default(20),
  /** Marketing blurb shown on the intake confirmation. */
  bioMd:        text("bio_md"),
}, (t) => ({
  uxUser:  uniqueIndex("lawyer_expertise_user_uidx").on(t.tenantId, t.userId),
  ixSec:   index("lawyer_expertise_sec_idx").on(t.tenantId),
}));

/* ─────────────────────────── NEW-CLIENT INTAKE ───────────────────────────
 * A prospect lands on the firm's white-labelled intake page, describes
 * what they need in plain English, picks region + language, attaches files,
 * and submits. AI classifies sector + legal function; the routing engine
 * picks the best-fit lawyer (or short-list) for human triage.
 */
export const intakeRequests = pgTable("intake_requests", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** Reference number shown to the prospect (e.g. INT-2026-0117). */
  reference:        text("reference").notNull(),
  /** Plain-English summary the prospect wrote. */
  plainEnglish:     text("plain_english").notNull(),
  language:         text("language").notNull().default("en"),
  /** Contact block — captured before login to lower friction. */
  contactName:      text("contact_name").notNull(),
  contactEmail:     text("contact_email").notNull(),
  contactPhone:     text("contact_phone"),
  companyName:      text("company_name"),
  region:           regionEnum("region").notNull().default("UAE"),
  /** AI-derived classification (writable by lawyer in triage). */
  aiSector:         sectorEnum("ai_sector"),
  aiFunction:       legalFunctionEnum("ai_function"),
  aiConfidence:     integer("ai_confidence"),     // 0-100
  aiSummary:        text("ai_summary"),
  aiUrgency:        text("ai_urgency"),           // low | medium | high | critical
  /** Lawyer-confirmed classification (after triage). */
  sector:           sectorEnum("sector"),
  legalFunction:    legalFunctionEnum("legal_function"),
  /** Routing outcome. */
  routedToUserId:   uuid("routed_to_user_id").references(() => users.id),
  routedByRuleId:   uuid("routed_by_rule_id"),
  routedAt:         timestamp("routed_at", { withTimezone: true }),
  /** Triage queue → assigned → converted to a matter. */
  status:           intakeStatusEnum("status").notNull().default("new"),
  /** When a matter is created from this intake. */
  caseId:           uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  /** Conflicts-check tracking before engagement. */
  conflictsChecked: boolean("conflicts_checked").notNull().default(false),
  conflictsClear:   boolean("conflicts_clear"),
  /** GDPR — consent to be contacted, captured at form submit. */
  consentToContact: boolean("consent_to_contact").notNull().default(false),
  sourceUrl:        text("source_url"),
  utmJson:          jsonb("utm_json"),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxRef:     uniqueIndex("intake_requests_ref_uidx").on(t.tenantId, t.reference),
  ixStatus:  index("intake_requests_status_idx").on(t.status),
  ixCreated: index("intake_requests_created_idx").on(t.createdAt),
}));

export const intakeAttachments = pgTable("intake_attachments", {
  id:         uuid("id").primaryKey().defaultRandom(),
  intakeId:   uuid("intake_id").notNull().references(() => intakeRequests.id, { onDelete: "cascade" }),
  filename:   text("filename").notNull(),
  mime:       text("mime").notNull(),
  bytes:      integer("bytes").notNull(),
  storageUrl: text("storage_url").notNull(),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ────────────────────────── ROUTING RULES ──────────────────────────
 * Firm-configurable. Evaluated top-down by priority. First match wins.
 * Operators each carry conditions in JSONB so the rule engine stays
 * flexible without per-rule columns.
 *
 * Example rule:
 *   priority: 10
 *   match: { sectors: ["fintech"], functions: ["fundraising", "vc_pe"], region: "UAE" }
 *   action: { assign: "user_lina", fallback: "user_sara" }
 */
export const routingRules = pgTable("routing_rules", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:         text("name").notNull(),
  priority:     integer("priority").notNull().default(100),
  active:       boolean("active").notNull().default(true),
  /** JSON predicate — sectors[], functions[], regions[], languages[], minUrgency. */
  match:        jsonb("match").notNull(),
  /** JSON action — { assignUserId, fallbackUserId, alsoNotify[], slack, email }. */
  action:       jsonb("action").notNull(),
  /** Diagnostics: how many intakes this rule has handled. */
  matchedCount: integer("matched_count").notNull().default(0),
  lastMatchedAt:timestamp("last_matched_at", { withTimezone: true }),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixPriority: index("routing_rules_priority_idx").on(t.tenantId, t.priority) }));

/* ────────────────────── ENGAGEMENT LETTERS ──────────────────────
 * Auto-drafted from a template the firm owns. Sent to the prospect for
 * digital signature; once both sides have signed, a Case is opened and
 * the engagement is the binding scope document.
 */
export const engagementLetters = pgTable("engagement_letters", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  intakeId:         uuid("intake_id").references(() => intakeRequests.id, { onDelete: "set null" }),
  caseId:           uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  clientTenantId:   uuid("client_tenant_id").references(() => tenants.id),
  templateId:       uuid("template_id"),
  scopeOfWork:      text("scope_of_work").notNull(),
  feeArrangement:   text("fee_arrangement").notNull(),  // hourly | fixed | retainer | contingency | hybrid
  feeQuoteCents:    integer("fee_quote_cents"),
  currency:         text("currency").notNull().default("AED"),
  bodyMd:           text("body_md").notNull(),
  version:          integer("version").notNull().default(1),
  isCurrent:        boolean("is_current").notNull().default(true),
  status:           engagementStatusEnum("status").notNull().default("draft"),
  sentAt:           timestamp("sent_at",          { withTimezone: true }),
  viewedAt:         timestamp("viewed_at",        { withTimezone: true }),
  signedByClientAt: timestamp("signed_by_client_at", { withTimezone: true }),
  signedByFirmAt:   timestamp("signed_by_firm_at",   { withTimezone: true }),
  declinedAt:       timestamp("declined_at",      { withTimezone: true }),
  /** Audit fields for the e-signature certificate. */
  clientIp:         text("client_ip"),
  clientUserAgent:  text("client_user_agent"),
  signatureCertHash:text("signature_cert_hash"),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const engagementTemplates = pgTable("engagement_templates", {
  id:        uuid("id").primaryKey().defaultRandom(),
  tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  region:    regionEnum("region").notNull(),
  function:  legalFunctionEnum("function"),
  language:  text("language").notNull().default("en"),
  bodyMd:    text("body_md").notNull(),
  defaultFeeArrangement: text("default_fee_arrangement"),
  defaultFeeCents:       integer("default_fee_cents"),
  version:   integer("version").notNull().default(1),
  isCurrent: boolean("is_current").notNull().default(true),
});

/* ────────────────────── EMAIL TEMPLATES + AUTOMATIONS ──────────────────────
 * Tenant-scoped, white-label aware (rendered with firm logo + colours).
 * `automations` is a thin rule table — trigger + template + extra rules.
 */
export const emailTemplates = pgTable("email_templates", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind:       automationKindEnum("kind").notNull(),
  language:   text("language").notNull().default("en"),
  subject:    text("subject").notNull(),
  /** Handlebars-style: {{client.first_name}}, {{firm.name}}, {{intake.reference}}. */
  bodyHtml:   text("body_html").notNull(),
  active:     boolean("active").notNull().default(true),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uxKindLang: uniqueIndex("email_templates_kind_lang_uidx").on(t.tenantId, t.kind, t.language),
}));

export const automations = pgTable("automations", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:             text("name").notNull(),
  trigger:          automationTriggerEnum("trigger").notNull(),
  kind:             automationKindEnum("kind").notNull(),
  emailTemplateId:  uuid("email_template_id").references(() => emailTemplates.id),
  /** Extra config — delays, conditions, also-to recipients, attach engagement letter. */
  config:           jsonb("config"),
  active:           boolean("active").notNull().default(true),
  /** Diagnostics: last-run + success/failure counters. */
  runCount:         integer("run_count").notNull().default(0),
  failureCount:     integer("failure_count").notNull().default(0),
  lastRunAt:        timestamp("last_run_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Append-only log of every automation that fired, for audit + debugging. */
export const automationRuns = pgTable("automation_runs", {
  id:           uuid("id").primaryKey().defaultRandom(),
  automationId: uuid("automation_id").notNull().references(() => automations.id, { onDelete: "cascade" }),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  triggeredBy:  text("triggered_by").notNull(),   // event name + entity id
  status:       text("status").notNull(),         // queued | sent | failed | skipped
  error:        text("error"),
  occurredAt:   timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixTime: index("automation_runs_time_idx").on(t.occurredAt) }));

/* ────────────────── MULTI-FIRM COLLABORATION + CHINESE WALL ──────────────────
 * Matter ownership model:
 *   - Master Firm: tenant that owns the client relationship. Full control.
 *   - Participant Firm: invited tenant (co-counsel, specialist, foreign/local
 *     counsel, observer). Sees only the assigned workspace.
 *
 * Chinese wall: even within a single firm, a lawyer sees only matters they
 * are explicitly assigned to (via `case_assignments`). Partner visibility is
 * configurable per firm via `tenants_settings.partnerVisibility`.
 *
 * Every access event is recorded in `access_log` for ethical-wall audit.
 */
export const tenantSettings = pgTable("tenant_settings", {
  tenantId:           uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  partnerVisibility:  partnerVisEnum("partner_visibility").notNull().default("assigned_only"),
  /** If true, every document download/export prompts a confirmation modal. */
  requireExportReason:boolean("require_export_reason").notNull().default(true),
  /** Conflict-check is mandatory before any matter opens. */
  conflictsCheckRequired: boolean("conflicts_check_required").notNull().default(true),
});

export const matterCollaborators = pgTable("matter_collaborators", {
  id:              uuid("id").primaryKey().defaultRandom(),
  caseId:          uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  /** The collaborating firm's tenant. */
  collaboratorTenantId: uuid("collaborator_tenant_id").notNull().references(() => tenants.id),
  role:            collabRoleEnum("role").notNull(),
  /** Permission flags — what the participant firm can do. */
  canUploadDocs:   boolean("can_upload_docs").notNull().default(true),
  canCommentDocs:  boolean("can_comment_docs").notNull().default(true),
  canDraftDocs:    boolean("can_draft_docs").notNull().default(true),
  canViewBilling:  boolean("can_view_billing").notNull().default(false),
  canViewInternalNotes: boolean("can_view_internal_notes").notNull().default(false),
  invitedByUserId: uuid("invited_by_user_id").references(() => users.id),
  invitedAt:       timestamp("invited_at", { withTimezone: true }).defaultNow().notNull(),
  acceptedAt:      timestamp("accepted_at", { withTimezone: true }),
  removedAt:       timestamp("removed_at", { withTimezone: true }),
}, (t) => ({
  uxCollab: uniqueIndex("matter_collaborators_uidx").on(t.caseId, t.collaboratorTenantId),
}));

/** Per-matter access log — supports ethical-wall audit + "who saw what". */
export const accessLog = pgTable("access_log", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId:     uuid("user_id").notNull().references(() => users.id),
  caseId:     uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  entityKind: text("entity_kind").notNull(),       // case | document | template | invoice
  entityId:   uuid("entity_id"),
  action:     text("action").notNull(),            // view | download | export | print
  ipAddress:  text("ip_address"),
  userAgent:  text("user_agent"),
  exportReason: text("export_reason"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixCase: index("access_log_case_idx").on(t.caseId),
  ixTime: index("access_log_time_idx").on(t.occurredAt),
}));

/* ────────────────── 3-LEVEL TEMPLATE LIBRARY ──────────────────
 * Personal   → owned by one lawyer, visible to creator only
 * Firm       → owned by the firm tenant, visible to all firm members
 * Marketplace→ published (free or paid) and discoverable across tenants;
 *              installed copy is created when a firm "adopts" it
 *
 * Each template carries a `variables` JSON schema (the fields the document
 * automation engine maps from client context). Versioned via (parentId, version).
 */
export const templates = pgTable("templates", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),  // null = marketplace
  ownerUserId:  uuid("owner_user_id").references(() => users.id),                          // set for personal scope
  scope:        templateScopeEnum("scope").notNull(),
  /** "Knowledge partner" who maintains it (firm scope only). */
  maintainerUserId: uuid("maintainer_user_id").references(() => users.id),
  title:        text("title").notNull(),
  kind:         text("kind").notNull(),     // NDA | SHA | SPA | Employment | …
  region:       regionEnum("region").notNull(),
  jurisdiction: text("jurisdiction"),       // ADGM | DIFC | DMCC | MISA …
  language:     text("language").notNull().default("en"),
  bodyMd:       text("body_md").notNull(),
  /** Handlebars-style variable definitions: {key, label, type, source, required}. */
  variables:    jsonb("variables").$type<Array<{
                  key: string; label: string; type: string;
                  source?: string;   // client.legal_name | matter.counterparty | manual
                  required?: boolean;
                }>>().notNull().default([]),
  version:      integer("version").notNull().default(1),
  parentId:     uuid("parent_id"),
  isCurrent:    boolean("is_current").notNull().default(true),
  /** Discoverability fields for marketplace scope. */
  publishedAt:  timestamp("published_at", { withTimezone: true }),
  publisherId:  uuid("publisher_id").references(() => tenants.id),
  priceCents:   integer("price_cents").default(0),                      // 0 = free
  ratingAvg:    numeric("rating_avg", { precision: 3, scale: 2 }),
  installCount: integer("install_count").notNull().default(0),
  usageCount:   integer("usage_count").notNull().default(0),
}, (t) => ({
  ixScope:  index("templates_scope_idx").on(t.scope),
  ixRegion: index("templates_region_idx").on(t.region),
}));

/** Records a firm adopting a marketplace template into its firm library. */
export const templateInstalls = pgTable("template_installs", {
  id:                uuid("id").primaryKey().defaultRandom(),
  tenantId:          uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  marketTemplateId:  uuid("market_template_id").notNull().references(() => templates.id),
  /** The forked firm-scope template created on install. */
  firmTemplateId:    uuid("firm_template_id").notNull().references(() => templates.id),
  paidCents:         integer("paid_cents").notNull().default(0),
  commissionCents:   integer("commission_cents").notNull().default(0),    // platform's 15-20% cut
  installedByUserId: uuid("installed_by_user_id").references(() => users.id),
  installedAt:       timestamp("installed_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ────────────────── DOCUMENT AUTOMATION ENGINE ──────────────────
 * Matter → Template → auto-populate from client context → lawyer review →
 * PDF preview → signature routing → execution → archive.
 *
 * `documentGenerations` is the run record; `documentGenerationVariables` is
 * the filled-in variable set (so we know how to reproduce / re-render).
 */
export const documentGenerations = pgTable("document_generations", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  caseId:           uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  templateId:       uuid("template_id").notNull().references(() => templates.id),
  templateVersion:  integer("template_version").notNull(),
  /** Snapshot of the context the autopopulate ran against. */
  contextJson:      jsonb("context_json").notNull(),
  /** Final values used (after lawyer review). */
  variablesJson:    jsonb("variables_json").notNull(),
  generatedBodyMd:  text("generated_body_md").notNull(),
  pdfStorageUrl:    text("pdf_storage_url"),
  /** Wall-clock time saved by automation (for ROI dashboards). */
  estimatedMinutesSaved: integer("estimated_minutes_saved"),
  /** Status of the run. */
  status:           text("status").notNull().default("draft"), // draft | reviewed | sent | executed | archived
  createdByUserId:  uuid("created_by_user_id").references(() => users.id),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixCase: index("doc_gen_case_idx").on(t.caseId) }));

/* ────────────────── SIGNATURE WORKFLOW ──────────────────
 * Built on top of any document generation. Supports sequential and parallel
 * ordering, per-party reminders, expiry dates, and a tamper-evident audit
 * trail. Each signer is a row in `signatureWorkflowParties`.
 */
export const signatureWorkflows = pgTable("signature_workflows", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  documentGenId:    uuid("document_gen_id").references(() => documentGenerations.id, { onDelete: "cascade" }),
  contractId:       uuid("contract_id").references(() => contracts.id, { onDelete: "cascade" }),
  engagementLetterId: uuid("engagement_letter_id"),
  order:            sigOrderEnum("order").notNull().default("sequential"),
  expiresAt:        timestamp("expires_at", { withTimezone: true }),
  reminderEveryDays:integer("reminder_every_days").default(3),
  status:           text("status").notNull().default("draft"),  // draft | in_flight | complete | declined | expired
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const signatureWorkflowParties = pgTable("signature_workflow_parties", {
  id:           uuid("id").primaryKey().defaultRandom(),
  workflowId:   uuid("workflow_id").notNull().references(() => signatureWorkflows.id, { onDelete: "cascade" }),
  /** Order index — sequential workflows fire in ascending order. */
  ordinal:      integer("ordinal").notNull(),
  partyName:    text("party_name").notNull(),
  partyEmail:   text("party_email").notNull(),
  partyRole:    text("party_role").notNull(),     // signer | counter-signer | witness | archive
  status:       sigPartyStatusEnum("status").notNull().default("pending"),
  notifiedAt:   timestamp("notified_at", { withTimezone: true }),
  viewedAt:     timestamp("viewed_at",   { withTimezone: true }),
  signedAt:     timestamp("signed_at",   { withTimezone: true }),
  declinedAt:   timestamp("declined_at", { withTimezone: true }),
  ipAddress:    text("ip_address"),
  signatureCertHash: text("signature_cert_hash"),
}, (t) => ({
  uxOrder: uniqueIndex("sig_party_order_uidx").on(t.workflowId, t.ordinal),
}));

/* ────────────────── CLIENT CONTACT OVERRIDE (with history) ──────────────────
 * Default contact = primary POC. Lawyer can override per-matter to CEO / CFO /
 * HR Director / GC / Board Chair. Every override is recorded so we can audit
 * "who was the contact for this signature on this date".
 */
export const clientContacts = pgTable("client_contacts", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  clientTenantId: uuid("client_tenant_id").references(() => tenants.id),
  companyId:    uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  fullName:     text("full_name").notNull(),
  title:        text("title"),
  email:        text("email").notNull(),
  phone:        text("phone"),
  isPrimary:    boolean("is_primary").notNull().default(false),
});

export const clientContactOverrides = pgTable("client_contact_overrides", {
  id:           uuid("id").primaryKey().defaultRandom(),
  caseId:       uuid("case_id").references(() => cases.id, { onDelete: "cascade" }),
  documentGenId:uuid("document_gen_id").references(() => documentGenerations.id, { onDelete: "cascade" }),
  contactId:    uuid("contact_id").notNull().references(() => clientContacts.id),
  reason:       text("reason"),
  setByUserId:  uuid("set_by_user_id").references(() => users.id),
  setAt:        timestamp("set_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ────────────────── KNOWLEDGE BASE ──────────────────
 * Searchable across firm-approved templates, clauses, precedents, and legal
 * opinions. AI trains ONLY on items marked `approved`. Client confidential
 * data is excluded by default (`learnFromThis = false`).
 */
export const knowledgeItems = pgTable("knowledge_items", {
  id:             uuid("id").primaryKey().defaultRandom(),
  tenantId:       uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind:           text("kind").notNull(),           // template | clause | precedent | opinion | playbook
  title:          text("title").notNull(),
  bodyMd:         text("body_md").notNull(),
  region:         regionEnum("region").notNull(),
  jurisdiction:   text("jurisdiction"),
  language:       text("language").notNull().default("en"),
  tags:           text("tags").array(),
  approved:       boolean("approved").notNull().default(false),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  learnFromThis:  boolean("learn_from_this").notNull().default(false),
  /** Sprint 17 — partner-marked exemplar of the firm's house style. Boosts
   *  this item in retrieval + carries the firm-voice flag downstream. */
  isExemplar:     boolean("is_exemplar").notNull().default(false),
  /** Vector embedding lives in a sister pgvector column in production. */
  embeddingNote:  text("embedding_note"),
  source:         text("source"),                   // "uploaded:doc-id" | "matter:case-id" | "external"
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ixApproved: index("knowledge_approved_idx").on(t.tenantId, t.approved),
  ixKind:     index("knowledge_kind_idx").on(t.kind),
}));

/* ────────────────── BILLING / PLANS / SUBSCRIPTIONS ────────────────── */
export const plans = pgTable("plans", {
  id:               uuid("id").primaryKey().defaultRandom(),
  tier:             planTierEnum("tier").notNull(),
  name:             text("name").notNull(),
  monthlyPriceUsd:  integer("monthly_price_usd").notNull(),
  seats:            integer("seats").notNull(),
  /** Feature flags carried by this plan. */
  features:         jsonb("features").$type<Record<string, boolean | number | string>>().notNull(),
}, (t) => ({ uxTier: uniqueIndex("plans_tier_uidx").on(t.tier) }));

export const subscriptions = pgTable("subscriptions", {
  id:             uuid("id").primaryKey().defaultRandom(),
  tenantId:       uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId:         uuid("plan_id").notNull().references(() => plans.id),
  status:         subStatusEnum("status").notNull().default("trialing"),
  trialEndsAt:    timestamp("trial_ends_at",    { withTimezone: true }),
  currentPeriodEndsAt: timestamp("current_period_ends_at", { withTimezone: true }),
  seatsInUse:     integer("seats_in_use").notNull().default(0),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Usage-based revenue: per-doc generation credits + marketplace + white-label setup. */
export const usageMeters = pgTable("usage_meters", {
  id:           uuid("id").primaryKey().defaultRandom(),
  tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind:         text("kind").notNull(),    // doc_generation | marketplace_purchase | whitelabel_setup
  refId:        uuid("ref_id"),
  amountCents:  integer("amount_cents").notNull(),
  commissionCents: integer("commission_cents").default(0),
  occurredAt:   timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ ixKind: index("usage_meters_kind_idx").on(t.tenantId, t.kind) }));

/* ────────────────── INTEGRATIONS ────────────────── */
export const integrations = pgTable("integrations", {
  id:         uuid("id").primaryKey().defaultRandom(),
  tenantId:   uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind:       integrationKindEnum("kind").notNull(),
  status:     text("status").notNull().default("disconnected"),   // connected | disconnected | error
  /** Encrypted credential blob — handled at the secrets-vault layer. */
  configEncrypted: text("config_encrypted"),
  connectedByUserId: uuid("connected_by_user_id").references(() => users.id),
  connectedAt:    timestamp("connected_at", { withTimezone: true }),
  lastSyncedAt:   timestamp("last_synced_at", { withTimezone: true }),
}, (t) => ({ uxKind: uniqueIndex("integrations_kind_uidx").on(t.tenantId, t.kind) }));

/* ────────────────── LAWYER-CENTRIC EXTENSION ──────────────────
 * The four pillars (process engine, passive time & leakage, performance &
 * firm vitality, delay/gap detection) + the ethical-wall upgrade live in
 * schema.process.ts. Re-exported here so drizzle-kit (schema: schema.ts)
 * picks up every table for migrations and db:push.
 */
export * from "./schema.process";
