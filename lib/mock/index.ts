/**
 * Mock data store — wired into every page so the app boots with content
 * before a real DB is attached. Each record mirrors the Drizzle schema so
 * swapping to live queries is a one-file change.
 */

export type Company = {
  id: string; legalName: string; jurisdiction: string; region: "UAE" | "KSA" | "GLOBAL";
  status: "active" | "dormant"; licenseNo: string; incorporated: string;
};
export const companies: Company[] = [
  { id: "c1", legalName: "Alistair Holdings Ltd", jurisdiction: "ADGM",  region: "UAE", status: "active",  licenseNo: "ADGM-78321", incorporated: "2022-04-12" },
  { id: "c2", legalName: "Nour Capital Partners", jurisdiction: "DIFC",  region: "UAE", status: "active",  licenseNo: "DIFC-13442",  incorporated: "2021-11-03" },
  { id: "c3", legalName: "Falcon Trade DMCC",      jurisdiction: "DMCC", region: "UAE", status: "active",  licenseNo: "DMCC-90112",  incorporated: "2020-02-19" },
  { id: "c4", legalName: "Riyadh Industries Co.",  jurisdiction: "MISA", region: "KSA", status: "active",  licenseNo: "MISA-44211",  incorporated: "2023-08-30" },
  { id: "c5", legalName: "Gulf Wave SPV I",        jurisdiction: "ADGM", region: "UAE", status: "dormant", licenseNo: "ADGM-78990",  incorporated: "2024-01-09" },
];

export type Director = {
  id: string; name: string; role: string; company: string; nationality: string; appointed: string;
};
export const directors: Director[] = [
  { id: "d1", name: "Khaled Al-Mutairi",  role: "Chair",       company: "Alistair Holdings Ltd", nationality: "AE", appointed: "2022-04-12" },
  { id: "d2", name: "Lina Haddad",        role: "Director",    company: "Alistair Holdings Ltd", nationality: "LB", appointed: "2022-04-12" },
  { id: "d3", name: "Tariq Bin Sulayem",  role: "Independent", company: "Nour Capital Partners", nationality: "AE", appointed: "2021-11-03" },
  { id: "d4", name: "Yasmin Al-Otaibi",   role: "Director",    company: "Riyadh Industries Co.", nationality: "SA", appointed: "2023-08-30" },
];

export type Contract = {
  id: string; title: string; kind: string; counterparty: string;
  status: "draft" | "in_review" | "negotiating" | "out_for_signature" | "executed" | "expired";
  riskScore: number; region: "UAE" | "KSA" | "GLOBAL"; expiry: string; owner: string; version: number;
};
export const contracts: Contract[] = [
  { id: "k1", title: "SHA — Alistair Series A",        kind: "SHA",        counterparty: "Wamda Capital",      status: "negotiating",      riskScore: 62, region: "UAE", expiry: "2030-06-01", owner: "S. Al-Mansoori", version: 7 },
  { id: "k2", title: "NDA — Acme Robotics",            kind: "NDA",        counterparty: "Acme Robotics LLC",   status: "executed",         riskScore: 12, region: "UAE", expiry: "2026-12-31", owner: "S. Al-Mansoori", version: 2 },
  { id: "k3", title: "Distribution — Nour x Carrefour",kind: "Distribution",counterparty: "Carrefour UAE",      status: "out_for_signature",riskScore: 41, region: "UAE", expiry: "2028-03-15", owner: "M. Khan",         version: 4 },
  { id: "k4", title: "Employment — VP Engineering",    kind: "Employment", counterparty: "Falcon Trade DMCC",   status: "executed",         riskScore: 8,  region: "UAE", expiry: "2027-01-01", owner: "S. Al-Mansoori", version: 1 },
  { id: "k5", title: "JV — Riyadh × Falcon",           kind: "JV",         counterparty: "Riyadh Industries",   status: "in_review",        riskScore: 78, region: "KSA", expiry: "2029-09-30", owner: "A. Al-Otaibi",    version: 5 },
];

export type ComplianceTask = {
  id: string; title: string; regulator: string; region: "UAE" | "KSA";
  dueAt: string; severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "filed" | "overdue"; assignee: string; company: string;
};
export const complianceTasks: ComplianceTask[] = [
  { id: "x1", title: "ADGM Annual Confirmation", regulator: "ADGM",  region: "UAE", dueAt: "2026-07-12", severity: "high",     status: "in_progress", assignee: "S. Al-Mansoori", company: "Alistair Holdings Ltd" },
  { id: "x2", title: "DMCC Trade License Renewal", regulator: "DMCC",region: "UAE", dueAt: "2026-08-02", severity: "critical", status: "open",        assignee: "M. Khan",          company: "Falcon Trade DMCC" },
  { id: "x3", title: "ZATCA VAT Return Q2",       regulator: "ZATCA", region: "KSA", dueAt: "2026-07-31", severity: "high",     status: "open",        assignee: "A. Al-Otaibi",     company: "Riyadh Industries Co." },
  { id: "x4", title: "Qiwa Nitaqat update",       regulator: "Qiwa",  region: "KSA", dueAt: "2026-06-25", severity: "medium",   status: "overdue",     assignee: "A. Al-Otaibi",     company: "Riyadh Industries Co." },
  { id: "x5", title: "DIFC ESR Notification",     regulator: "DIFC",  region: "UAE", dueAt: "2026-09-15", severity: "medium",   status: "open",        assignee: "S. Al-Mansoori", company: "Nour Capital Partners" },
];

export type Case = {
  id: string; matterNumber: string; title: string; type: string; status: string;
  region: "UAE" | "KSA"; client: string; lead: string; opened: string; budgetUsd: number; hours: number;
};
export const cases: Case[] = [
  { id: "m1", matterNumber: "2026-0142", title: "Alistair v. Orion — IP enforcement",        type: "litigation", status: "in_court",       region: "UAE", client: "Alistair Holdings Ltd", lead: "S. Al-Mansoori", opened: "2026-02-04", budgetUsd: 120_000, hours: 184 },
  { id: "m2", matterNumber: "2026-0150", title: "Nour Capital — Series A advisory",          type: "advisory",   status: "open",            region: "UAE", client: "Nour Capital Partners", lead: "M. Khan",          opened: "2026-03-12", budgetUsd: 65_000,  hours: 92 },
  { id: "m3", matterNumber: "2026-0163", title: "Falcon Trade — Distribution dispute",       type: "litigation", status: "in_arbitration",  region: "UAE", client: "Falcon Trade DMCC",     lead: "S. Al-Mansoori", opened: "2026-04-22", budgetUsd: 200_000, hours: 240 },
  { id: "m4", matterNumber: "2026-0181", title: "Riyadh Industries — MISA license renewal",  type: "regulatory", status: "open",            region: "KSA", client: "Riyadh Industries Co.", lead: "A. Al-Otaibi",   opened: "2026-05-09", budgetUsd: 18_000,  hours: 34 },
  { id: "m5", matterNumber: "2026-0202", title: "Gulf Wave SPV — Investor exit",             type: "corporate",  status: "in_review",       region: "UAE", client: "Gulf Wave SPV I",       lead: "M. Khan",          opened: "2026-06-01", budgetUsd: 45_000,  hours: 12 },
];

export type Lawyer = {
  id: string; name: string; role: "firm_admin" | "lawyer" | "lawyer_helper";
  reportsTo?: string; openMatters: number; hoursMTD: number; utilizationPct: number; rateUsd: number;
};
export const lawyers: Lawyer[] = [
  { id: "u1", name: "Sara Al-Mansoori", role: "firm_admin",    openMatters: 12, hoursMTD: 142, utilizationPct: 82, rateUsd: 650 },
  { id: "u2", name: "Mohammed Khan",    role: "lawyer",        openMatters: 9,  hoursMTD: 128, utilizationPct: 76, rateUsd: 450 },
  { id: "u3", name: "Aisha Al-Otaibi",  role: "lawyer",        openMatters: 7,  hoursMTD: 121, utilizationPct: 74, rateUsd: 420 },
  { id: "u4", name: "Yusuf Ibrahim",    role: "lawyer_helper", reportsTo: "u2", openMatters: 0, hoursMTD: 96,  utilizationPct: 68, rateUsd: 150 },
  { id: "u5", name: "Hala Mahmoud",     role: "lawyer_helper", reportsTo: "u1", openMatters: 0, hoursMTD: 88,  utilizationPct: 64, rateUsd: 140 },
];

export type Invoice = {
  id: string; number: string; client: string; case: string; totalUsd: number;
  status: "draft" | "issued" | "partial" | "paid" | "overdue"; issued: string; due: string;
};
export const invoices: Invoice[] = [
  { id: "i1", number: "LLP-2026-0421", client: "Alistair Holdings Ltd", case: "2026-0142", totalUsd: 28_400, status: "issued",  issued: "2026-05-31", due: "2026-06-30" },
  { id: "i2", number: "LLP-2026-0422", client: "Nour Capital Partners",  case: "2026-0150", totalUsd: 14_200, status: "paid",    issued: "2026-05-31", due: "2026-06-30" },
  { id: "i3", number: "LLP-2026-0423", client: "Falcon Trade DMCC",      case: "2026-0163", totalUsd: 41_900, status: "partial", issued: "2026-05-31", due: "2026-06-30" },
  { id: "i4", number: "LLP-2026-0399", client: "Riyadh Industries Co.",  case: "2026-0181", totalUsd: 6_800,  status: "overdue", issued: "2026-04-30", due: "2026-05-30" },
];

export type Clause = {
  id: string; title: string; tags: string[]; region: "UAE" | "KSA" | "GLOBAL"; language: "en" | "ar"; usage: number;
};
export const clauses: Clause[] = [
  { id: "cl1", title: "ADGM-compliant arbitration clause",     tags: ["arbitration", "ADGM"],  region: "UAE",    language: "en", usage: 412 },
  { id: "cl2", title: "DIFC drag-along (Series A)",            tags: ["drag-along", "DIFC"],   region: "UAE",    language: "en", usage: 268 },
  { id: "cl3", title: "Saudi non-compete (12 months)",         tags: ["non-compete", "KSA"],   region: "KSA",    language: "ar", usage: 197 },
  { id: "cl4", title: "Standard NDA — bilateral",              tags: ["NDA"],                  region: "GLOBAL", language: "en", usage: 1_240 },
  { id: "cl5", title: "Sharia-compliant profit share",         tags: ["sharia", "finance"],    region: "GLOBAL", language: "en", usage: 88 },
];

export type Provider = {
  id: string; name: string; kind: "law_firm" | "corp_sec" | "tax" | "notary" | "compliance";
  region: "UAE" | "KSA"; rating: number; expertise: string[]; pricingFromUsd: number;
};
export const providers: Provider[] = [
  { id: "p1", name: "Crescent Law",       kind: "law_firm", region: "UAE", rating: 4.8, expertise: ["Corporate", "M&A"],   pricingFromUsd: 350 },
  { id: "p2", name: "Riyadh Legal Group", kind: "law_firm", region: "KSA", rating: 4.7, expertise: ["Disputes", "Energy"], pricingFromUsd: 320 },
  { id: "p3", name: "Sahara Tax Advisors",kind: "tax",      region: "KSA", rating: 4.6, expertise: ["VAT", "Corporate Tax"], pricingFromUsd: 180 },
  { id: "p4", name: "Emirates Corp Sec",  kind: "corp_sec", region: "UAE", rating: 4.9, expertise: ["ADGM", "DIFC", "DMCC"],  pricingFromUsd: 95 },
];

export type DsrRequest = {
  id: string; subject: string; type: "access" | "rectification" | "erasure" | "portability";
  status: "received" | "verifying" | "in_progress" | "completed" | "rejected";
  received: string; due: string;
};
export const dsrRequests: DsrRequest[] = [
  { id: "g1", subject: "k.aldosari@example.com", type: "access",        status: "in_progress", received: "2026-05-30", due: "2026-06-29" },
  { id: "g2", subject: "m.haddad@example.com",   type: "erasure",       status: "verifying",   received: "2026-06-08", due: "2026-07-08" },
  { id: "g3", subject: "y.ibrahim@example.com",  type: "portability",   status: "completed",   received: "2026-04-22", due: "2026-05-22" },
];

export type InfoRequest = {
  id: string; toClient: string; title: string; status: "draft" | "sent" | "partial" | "received";
  fields: number; due: string; case: string;
};
export const infoRequests: InfoRequest[] = [
  { id: "ir1", toClient: "Alistair Holdings Ltd",  title: "UBO declaration pack",         status: "sent",     fields: 8, due: "2026-06-22", case: "2026-0142" },
  { id: "ir2", toClient: "Nour Capital Partners",  title: "Series A subscription forms",  status: "partial",  fields: 14, due: "2026-06-25", case: "2026-0150" },
  { id: "ir3", toClient: "Falcon Trade DMCC",      title: "Witness statements",           status: "received", fields: 6, due: "2026-06-15", case: "2026-0163" },
];

/* ───────────────────────────── NEW: intake + routing + engagement ───────────────────────────── */

export type Sector =
  | "fintech" | "real_estate" | "energy" | "healthcare" | "tech_saas" | "ecommerce"
  | "manufacturing" | "logistics" | "media" | "retail" | "professional_services"
  | "non_profit" | "family_office" | "fund_gp" | "fund_lp" | "other";

export type LegalFunction =
  | "incorporation" | "corporate_governance" | "ma" | "fundraising" | "vc_pe"
  | "employment" | "ip_trademark" | "ip_patent" | "litigation" | "arbitration"
  | "regulatory" | "tax" | "data_privacy" | "real_estate_law" | "competition"
  | "sanctions" | "esg" | "sharia_finance" | "family_office" | "other";

export type Intake = {
  id: string; reference: string; contactName: string; contactEmail: string;
  companyName: string; region: "UAE" | "KSA";
  plainEnglish: string; language: "en" | "ar";
  aiSector: Sector; aiFunction: LegalFunction; aiConfidence: number;
  aiUrgency: "low" | "medium" | "high" | "critical";
  status: "new" | "triaging" | "assigned" | "engaged" | "rejected";
  routedTo?: string; submittedAt: string;
};
export const intakes: Intake[] = [
  {
    id: "in1", reference: "INT-2026-0117",
    contactName: "Omar Khalifa", contactEmail: "omar@delta-pay.ae", companyName: "Delta Pay FZE",
    region: "UAE", language: "en",
    plainEnglish: "We're a UAE fintech preparing a Series A. We need help with the SHA, anti-dilution, and ADGM regulatory filings. Closing target is 60 days.",
    aiSector: "fintech", aiFunction: "fundraising", aiConfidence: 92, aiUrgency: "high",
    status: "new", submittedAt: "2026-06-15T08:42:00Z",
  },
  {
    id: "in2", reference: "INT-2026-0118",
    contactName: "Reem Al-Hashimi", contactEmail: "reem@hashimi-properties.com", companyName: "Hashimi Properties",
    region: "UAE", language: "ar",
    plainEnglish: "We have a tenant dispute over a Dubai retail lease. The tenant has stopped paying and refuses to vacate. We need to file an ejectment case.",
    aiSector: "real_estate", aiFunction: "litigation", aiConfidence: 88, aiUrgency: "high",
    status: "triaging", routedTo: "Mohammed Khan", submittedAt: "2026-06-14T14:11:00Z",
  },
  {
    id: "in3", reference: "INT-2026-0119",
    contactName: "Tarek Saleh", contactEmail: "tarek@gccmed.health", companyName: "GCC Med Group",
    region: "KSA", language: "en",
    plainEnglish: "We acquired three clinics in Jeddah. Need help integrating the holding structure, MoH licensing transfer, and a JV with a local healthcare partner.",
    aiSector: "healthcare", aiFunction: "ma", aiConfidence: 84, aiUrgency: "medium",
    status: "assigned", routedTo: "Aisha Al-Otaibi", submittedAt: "2026-06-13T09:30:00Z",
  },
  {
    id: "in4", reference: "INT-2026-0120",
    contactName: "Joana Pereira", contactEmail: "j.pereira@northsun-ventures.com", companyName: "Northsun Ventures",
    region: "UAE", language: "en",
    plainEnglish: "Setting up a $50M MENA growth fund in ADGM. Need fund formation, GP-LPA, side letters, and DFSA/FSRA registration.",
    aiSector: "fund_gp", aiFunction: "fundraising", aiConfidence: 95, aiUrgency: "medium",
    status: "engaged", routedTo: "Sara Al-Mansoori", submittedAt: "2026-06-10T11:05:00Z",
  },
  {
    id: "in5", reference: "INT-2026-0121",
    contactName: "Yousef Bin Salah", contactEmail: "y.binsalah@riyadh-energy.com", companyName: "Riyadh Energy Holdings",
    region: "KSA", language: "ar",
    plainEnglish: "ZATCA inspection notice received yesterday for FY2024 VAT. We need urgent representation and response strategy.",
    aiSector: "energy", aiFunction: "tax", aiConfidence: 90, aiUrgency: "critical",
    status: "new", submittedAt: "2026-06-16T07:18:00Z",
  },
];

export type RoutingRule = {
  id: string; name: string; priority: number; active: boolean;
  sectors: Sector[]; functions: LegalFunction[]; regions: ("UAE" | "KSA")[];
  assignTo: string; fallback?: string; matched: number;
};
export const routingRules: RoutingRule[] = [
  { id: "r1", name: "Fintech fundraising → Sara",            priority: 10, active: true,
    sectors: ["fintech"], functions: ["fundraising", "vc_pe"], regions: ["UAE"],
    assignTo: "Sara Al-Mansoori", fallback: "Mohammed Khan", matched: 14 },
  { id: "r2", name: "Real-estate disputes → Mohammed",        priority: 20, active: true,
    sectors: ["real_estate"], functions: ["litigation", "arbitration"], regions: ["UAE"],
    assignTo: "Mohammed Khan", matched: 8 },
  { id: "r3", name: "KSA healthcare M&A → Aisha",             priority: 30, active: true,
    sectors: ["healthcare"], functions: ["ma", "regulatory"], regions: ["KSA"],
    assignTo: "Aisha Al-Otaibi", matched: 5 },
  { id: "r4", name: "Fund formation → Sara",                  priority: 40, active: true,
    sectors: ["fund_gp", "fund_lp"], functions: ["fundraising", "regulatory"], regions: ["UAE", "KSA"],
    assignTo: "Sara Al-Mansoori", matched: 11 },
  { id: "r5", name: "KSA tax / ZATCA → Aisha",                priority: 50, active: true,
    sectors: ["energy", "manufacturing", "logistics"], functions: ["tax", "regulatory"], regions: ["KSA"],
    assignTo: "Aisha Al-Otaibi", matched: 7 },
  { id: "r6", name: "Default fallback",                       priority: 999, active: true,
    sectors: [], functions: [], regions: ["UAE", "KSA"],
    assignTo: "Sara Al-Mansoori", matched: 22 },
];

export type Expertise = {
  userId: string; name: string;
  sectors: Sector[]; functions: LegalFunction[]; regions: ("UAE" | "KSA")[];
  languages: ("en" | "ar")[]; years: number;
};
export const expertise: Expertise[] = [
  { userId: "u1", name: "Sara Al-Mansoori",
    sectors: ["fintech", "fund_gp", "tech_saas"], functions: ["fundraising", "vc_pe", "corporate_governance", "ma"],
    regions: ["UAE"], languages: ["en", "ar"], years: 14 },
  { userId: "u2", name: "Mohammed Khan",
    sectors: ["real_estate", "retail", "manufacturing"], functions: ["litigation", "arbitration", "employment"],
    regions: ["UAE"], languages: ["en"], years: 11 },
  { userId: "u3", name: "Aisha Al-Otaibi",
    sectors: ["healthcare", "energy", "logistics"], functions: ["ma", "regulatory", "tax"],
    regions: ["KSA"], languages: ["en", "ar"], years: 9 },
];

export type EngagementLetter = {
  id: string; client: string; matter: string; status: "draft" | "sent" | "viewed" | "countersigned" | "executed" | "declined";
  feeArrangement: string; feeQuoteUsd: number; sentAt?: string; signedAt?: string; version: number;
};
export const engagementLetters: EngagementLetter[] = [
  { id: "el1", client: "Delta Pay FZE",          matter: "Series A — fintech",       status: "sent",         feeArrangement: "fixed",     feeQuoteUsd: 45_000, sentAt: "2026-06-15", version: 1 },
  { id: "el2", client: "Hashimi Properties",     matter: "Dubai lease ejectment",     status: "viewed",       feeArrangement: "hourly",    feeQuoteUsd: 28_000, sentAt: "2026-06-14", version: 1 },
  { id: "el3", client: "GCC Med Group",          matter: "KSA healthcare JV",         status: "countersigned",feeArrangement: "hybrid",    feeQuoteUsd: 120_000,sentAt: "2026-06-13", signedAt: "2026-06-15", version: 2 },
  { id: "el4", client: "Northsun Ventures",      matter: "ADGM fund formation",       status: "executed",     feeArrangement: "fixed",     feeQuoteUsd: 95_000, sentAt: "2026-06-10", signedAt: "2026-06-12", version: 1 },
  { id: "el5", client: "Riyadh Energy Holdings", matter: "ZATCA inspection response", status: "draft",        feeArrangement: "retainer",  feeQuoteUsd: 18_000, version: 1 },
];

export type Automation = {
  id: string; name: string; trigger: string; kind: string; active: boolean;
  runs: number; failures: number; lastRunAt?: string;
};
export const automations: Automation[] = [
  { id: "a1", name: "Send welcome email on intake",            trigger: "on_intake_received",   kind: "welcome_email",      active: true, runs: 142, failures: 1, lastRunAt: "2026-06-16T07:18:00Z" },
  { id: "a2", name: "Auto-draft engagement letter on assign",  trigger: "on_matter_opened",     kind: "engagement_letter",  active: true, runs: 88,  failures: 0, lastRunAt: "2026-06-15T16:22:00Z" },
  { id: "a3", name: "Acknowledge new intake (within 60s)",     trigger: "on_intake_received",   kind: "intake_ack",         active: true, runs: 142, failures: 0, lastRunAt: "2026-06-16T07:18:30Z" },
  { id: "a4", name: "Filing reminder — 7 days before",         trigger: "on_filing_due",        kind: "filing_reminder",    active: true, runs: 34,  failures: 0, lastRunAt: "2026-06-15T09:00:00Z" },
  { id: "a5", name: "Invoice dunning — 7/14/30 day overdue",   trigger: "on_invoice_overdue",   kind: "invoice_dunning",    active: true, runs: 11,  failures: 0, lastRunAt: "2026-06-14T08:00:00Z" },
];

export type FirmBrand = {
  tenantId: string; firmName: string;
  customDomain?: string; subdomain: string;
  primaryColor: string; logoUrl?: string;
  emailFromName: string; emailFromAddr: string; emailDomainVerified: boolean;
  intakeSlug: string; hideAttribution: boolean;
};
export const firmBranding: FirmBrand = {
  tenantId: "t_levant", firmName: "Levant Legal Partners",
  customDomain: "portal.levant-legal.ae", subdomain: "levant",
  primaryColor: "#2563EB", logoUrl: "/levant-logo.svg",
  emailFromName: "Levant Legal Partners",
  emailFromAddr: "no-reply@levant-legal.ae",
  emailDomainVerified: true,
  intakeSlug: "apply",
  hideAttribution: true,
};

/* ───────────────────────────── NEW: templates · docs · KB · plans · collab ───────────────────────────── */

export type Template = {
  id: string; scope: "personal" | "firm" | "marketplace";
  title: string; kind: string; region: "UAE" | "KSA" | "GLOBAL"; jurisdiction?: string;
  language: "en" | "ar"; ownerName?: string; maintainerName?: string;
  version: number; usage: number; installCount?: number; priceUsd?: number; ratingAvg?: number;
};
export const templates: Template[] = [
  // Personal
  { id: "tp1", scope: "personal", title: "Sara's preferred NDA (mutual)",     kind: "NDA",         region: "UAE",    language: "en", ownerName: "Sara Al-Mansoori", version: 4, usage: 22 },
  { id: "tp2", scope: "personal", title: "Sara's Series A SHA notes",         kind: "SHA",         region: "UAE",    jurisdiction: "ADGM", language: "en", ownerName: "Sara Al-Mansoori", version: 9, usage: 7 },
  { id: "tp3", scope: "personal", title: "Mohammed's KSA arbitration playbook",kind: "Playbook",   region: "KSA",    language: "en", ownerName: "Mohammed Khan", version: 2, usage: 5 },
  // Firm
  { id: "tf1", scope: "firm", title: "Levant — Standard NDA",                 kind: "NDA",         region: "UAE",    language: "en", maintainerName: "Sara Al-Mansoori", version: 12, usage: 487 },
  { id: "tf2", scope: "firm", title: "Levant — Employment Agreement (UAE)",   kind: "Employment",  region: "UAE",    jurisdiction: "DIFC", language: "en", maintainerName: "Sara Al-Mansoori", version: 6, usage: 312 },
  { id: "tf3", scope: "firm", title: "Levant — Shareholders' Agreement",      kind: "SHA",         region: "UAE",    jurisdiction: "ADGM", language: "en", maintainerName: "Sara Al-Mansoori", version: 18, usage: 198 },
  { id: "tf4", scope: "firm", title: "Levant — Service Agreement",            kind: "Service",     region: "GLOBAL", language: "en", maintainerName: "Mohammed Khan", version: 5, usage: 144 },
  { id: "tf5", scope: "firm", title: "Levant — Board Resolution (UAE)",       kind: "Resolution",  region: "UAE",    language: "ar", maintainerName: "Sara Al-Mansoori", version: 8, usage: 221 },
  { id: "tf6", scope: "firm", title: "Levant — KSA Employment (Arabic)",      kind: "Employment",  region: "KSA",    language: "ar", maintainerName: "Aisha Al-Otaibi", version: 3, usage: 88 },
  // Marketplace
  { id: "tm1", scope: "marketplace", title: "ADGM SPV Pack (8 docs)",         kind: "Pack",        region: "UAE",    jurisdiction: "ADGM", language: "en", version: 4, usage: 0, installCount: 124, priceUsd: 299, ratingAvg: 4.8 },
  { id: "tm2", scope: "marketplace", title: "DIFC Employment Suite",          kind: "Pack",        region: "UAE",    jurisdiction: "DIFC", language: "en", version: 3, usage: 0, installCount: 96,  priceUsd: 199, ratingAvg: 4.7 },
  { id: "tm3", scope: "marketplace", title: "Saudi Labour Pack (Arabic)",     kind: "Pack",        region: "KSA",    language: "ar", version: 2, usage: 0, installCount: 71,  priceUsd: 249, ratingAvg: 4.6 },
  { id: "tm4", scope: "marketplace", title: "GCC M&A Toolkit",                kind: "Pack",        region: "GLOBAL", language: "en", version: 6, usage: 0, installCount: 58,  priceUsd: 899, ratingAvg: 4.9 },
  { id: "tm5", scope: "marketplace", title: "Fund Formation — RAIF / SPV",    kind: "Pack",        region: "UAE",    language: "en", version: 5, usage: 0, installCount: 41,  priceUsd: 1_499, ratingAvg: 4.9 },
];

export type DocumentGeneration = {
  id: string; matter: string; template: string; status: "draft" | "reviewed" | "sent" | "executed" | "archived";
  createdBy: string; createdAt: string; minutesSaved: number;
};
export const documentGenerations: DocumentGeneration[] = [
  { id: "dg1", matter: "2026-0142", template: "Levant — Standard NDA",                 status: "executed",  createdBy: "Yusuf Ibrahim",    createdAt: "2026-06-14", minutesSaved: 35 },
  { id: "dg2", matter: "2026-0150", template: "Levant — Shareholders' Agreement",      status: "sent",      createdBy: "Sara Al-Mansoori", createdAt: "2026-06-15", minutesSaved: 280 },
  { id: "dg3", matter: "2026-0163", template: "Levant — Service Agreement",            status: "reviewed",  createdBy: "Hala Mahmoud",     createdAt: "2026-06-16", minutesSaved: 45 },
  { id: "dg4", matter: "2026-0181", template: "Levant — KSA Employment (Arabic)",      status: "draft",     createdBy: "Aisha Al-Otaibi",  createdAt: "2026-06-16", minutesSaved: 60 },
  { id: "dg5", matter: "2026-0202", template: "Levant — Board Resolution (UAE)",       status: "archived",  createdBy: "Sara Al-Mansoori", createdAt: "2026-06-12", minutesSaved: 25 },
];

export type SignatureFlow = {
  id: string; doc: string; order: "sequential" | "parallel"; status: "draft" | "in_flight" | "complete" | "declined" | "expired";
  parties: Array<{ ordinal: number; name: string; role: string; status: "pending" | "viewed" | "signed" | "declined" }>;
};
export const signatureFlows: SignatureFlow[] = [
  { id: "sf1", doc: "SHA — Alistair Series A", order: "sequential", status: "in_flight",
    parties: [
      { ordinal: 1, name: "Khaled Al-Mutairi (Chair)",  role: "signer",        status: "signed" },
      { ordinal: 2, name: "Wamda Capital (GP)",         role: "counter-signer",status: "viewed" },
      { ordinal: 3, name: "Lina Haddad (Witness)",      role: "witness",       status: "pending" },
      { ordinal: 4, name: "Levant Legal — Archive",     role: "archive",       status: "pending" },
    ]},
  { id: "sf2", doc: "NDA — Acme Robotics",     order: "parallel",   status: "complete",
    parties: [
      { ordinal: 1, name: "Acme Robotics LLC",          role: "counter-signer",status: "signed" },
      { ordinal: 2, name: "Alistair Holdings Ltd",      role: "signer",        status: "signed" },
    ]},
];

export type Collaborator = {
  id: string; matter: string; firm: string; role: "master" | "co_counsel" | "specialist" | "foreign_counsel" | "local_counsel" | "observer";
  canUpload: boolean; canComment: boolean; canDraft: boolean; canBilling: boolean; canNotes: boolean; invitedAt: string;
};
export const collaborators: Collaborator[] = [
  { id: "co1", matter: "2026-0163", firm: "Levant Legal Partners", role: "master",         canUpload: true,  canComment: true,  canDraft: true,  canBilling: true,  canNotes: true,  invitedAt: "2026-04-22" },
  { id: "co2", matter: "2026-0163", firm: "Crescent Law",          role: "co_counsel",     canUpload: true,  canComment: true,  canDraft: true,  canBilling: false, canNotes: false, invitedAt: "2026-05-01" },
  { id: "co3", matter: "2026-0163", firm: "Riyadh Legal Group",    role: "local_counsel",  canUpload: true,  canComment: true,  canDraft: false, canBilling: false, canNotes: false, invitedAt: "2026-05-10" },
  { id: "co4", matter: "2026-0163", firm: "Clifford London",       role: "foreign_counsel",canUpload: false, canComment: true,  canDraft: false, canBilling: false, canNotes: false, invitedAt: "2026-05-12" },
];

export type KnowledgeItem = {
  id: string; kind: "template" | "clause" | "precedent" | "opinion" | "playbook";
  title: string; region: "UAE" | "KSA" | "GLOBAL"; language: "en" | "ar";
  approved: boolean; learn: boolean; tags: string[];
};
export const knowledgeItems: KnowledgeItem[] = [
  { id: "k1", kind: "clause",    title: "ADGM arbitration seat — preferred wording", region: "UAE", language: "en", approved: true,  learn: true,  tags: ["arbitration","ADGM"] },
  { id: "k2", kind: "precedent", title: "Alistair v. Orion — IP enforcement ruling", region: "UAE", language: "en", approved: true,  learn: true,  tags: ["IP","ADGM Courts"] },
  { id: "k3", kind: "opinion",   title: "Memo: KSA non-compete enforceability",      region: "KSA", language: "ar", approved: true,  learn: true,  tags: ["employment","non-compete"] },
  { id: "k4", kind: "playbook",  title: "Series A negotiation playbook",             region: "UAE", language: "en", approved: true,  learn: true,  tags: ["fundraising","VC"] },
  { id: "k5", kind: "template",  title: "Sharia-compliant profit-share clause",      region: "GLOBAL", language: "en", approved: false, learn: false, tags: ["sharia","finance"] },
];

export type Plan = {
  tier: "startup" | "growth" | "enterprise";
  name: string;
  priceMinUsd: number | "custom";
  priceMaxUsd?: number;
  entitiesIncluded: number | "unlimited";
  target: string[];
  highlight?: boolean;
  features: string[];
};
export const plans: Plan[] = [
  {
    tier: "startup", name: "Solo Practice",
    priceMinUsd: 49, priceMaxUsd: 99, entitiesIncluded: 1,
    target: [
      "Sole practitioners",
      "Newly-established practices",
      "Lawyers going independent",
    ],
    features: [
      "1 lawyer · 1 paralegal seat",
      "1 client entity included",
      "Personal template library",
      "Engagement letters + e-signature",
      "Basic client portal",
      "20 AI documents / month",
      "Compliance reminders for your clients",
    ],
  },
  {
    tier: "growth", name: "Small–Mid Firm",
    priceMinUsd: 249, priceMaxUsd: 499, entitiesIncluded: 10,
    target: [
      "Boutique law firms (2–15 lawyers)",
      "Mid-sized practices",
      "In-house legal teams at SMEs",
    ],
    highlight: true,
    features: [
      "Up to 10 lawyers + helpers",
      "Up to 10 client entities included",
      "Firm-wide template library",
      "Matter management + time / billing",
      "Document automation (3-level templates)",
      "AI contract drafting + review",
      "Client portal + structured info-requests",
      "Compliance calendar (UAE + KSA regulators)",
    ],
  },
  {
    tier: "enterprise", name: "Enterprise Firm",
    priceMinUsd: 999, priceMaxUsd: 4999, entitiesIncluded: "unlimited",
    target: [
      "Large law firms",
      "In-house legal departments",
      "Multi-firm collaborations & alliances",
    ],
    features: [
      "Unlimited lawyers + helpers",
      "Unlimited client entities",
      "Multi-firm collaboration with Chinese-wall",
      "Custom approval chains + audit logs",
      "Private firm AI (trained on your approved precedents)",
      "White-label (own domain & brand)",
      "SSO + SOC 2 / ISO 27001",
      "Dedicated account manager + 24/7 support",
    ],
  },
];

/**
 * Entity-based add-on pricing (Carta-style).
 * Charge for companies managed, not users.
 *  1         → included in plan
 *  2  – 10   → +$20 / entity / month
 *  11 – 50   → +$15 / entity / month
 *  51 +      → custom
 */
export type EntityTier = { from: number; to: number | "∞"; perEntityUsd: number | "custom"; label: string };
export const entityPricing: EntityTier[] = [
  { from: 1,  to: 1,   perEntityUsd: 0,        label: "Included with plan" },
  { from: 2,  to: 10,  perEntityUsd: 20,       label: "+$20 / entity / mo" },
  { from: 11, to: 50,  perEntityUsd: 15,       label: "+$15 / entity / mo" },
  { from: 51, to: "∞", perEntityUsd: "custom", label: "Custom pricing"     },
];

/** Compute the entity add-on for a given count, in USD/month. */
export function entityAddOnUsd(count: number): number | "custom" {
  if (count <= 1) return 0;
  if (count <= 10) return (count - 1) * 20;
  if (count <= 50) return 9 * 20 + (count - 10) * 15;     // 9 entities @ $20 + the rest @ $15
  return "custom";
}

export type Integration = {
  kind: "m365" | "outlook" | "teams" | "whatsapp" | "docusign" | "google_workspace" | "slack" | "zatca";
  name: string; status: "connected" | "disconnected" | "error"; lastSync?: string;
};
export const integrations: Integration[] = [
  { kind: "m365",            name: "Microsoft 365",     status: "connected",    lastSync: "2026-06-17 06:00" },
  { kind: "outlook",         name: "Outlook",           status: "connected",    lastSync: "2026-06-17 06:00" },
  { kind: "teams",           name: "Microsoft Teams",   status: "connected",    lastSync: "2026-06-17 05:45" },
  { kind: "whatsapp",        name: "WhatsApp Business", status: "connected",    lastSync: "2026-06-17 06:10" },
  { kind: "docusign",        name: "DocuSign",          status: "connected",    lastSync: "2026-06-16 22:00" },
  { kind: "google_workspace",name: "Google Workspace",  status: "disconnected" },
  { kind: "slack",           name: "Slack",             status: "connected",    lastSync: "2026-06-17 06:12" },
  { kind: "zatca",           name: "ZATCA (KSA)",       status: "connected",    lastSync: "2026-06-16 18:00" },
];

/* ════════════════════ LAWYER-CENTRIC SLICE (mock) ════════════════════
 * Process engine · passive time · performance/vitality · delay-gap engine.
 * Mirrors lib/db/schema.process.ts so swapping to live queries is one file.
 */

export type ProcessKind =
  | "company_formation" | "company_change_of_control" | "go_public" | "go_private"
  | "ma_buyside" | "ma_sellside" | "joint_venture" | "restructuring" | "bankruptcy_insolvency";

export type ProcessDef = {
  id: string; kind: ProcessKind; title: string; titleAr: string;
  region: "UAE" | "KSA" | "GLOBAL"; jurisdiction: string; defaultFeeModel: string;
  expectedDurationDays: number; docCount: number;
};
/** The methodology catalogue — drives the "lookup by process" narrowing. */
export const processes: ProcessDef[] = [
  { id: "pr_form",  kind: "company_formation",          title: "Company Formation",          titleAr: "تأسيس شركة",          region: "UAE", jurisdiction: "DIFC", defaultFeeModel: "fixed",     expectedDurationDays: 21,  docCount: 8 },
  { id: "pr_coc",   kind: "company_change_of_control",  title: "Change of Control",          titleAr: "تغيير السيطرة",       region: "UAE", jurisdiction: "DIFC", defaultFeeModel: "milestone", expectedDurationDays: 45,  docCount: 9 },
  { id: "pr_mabuy", kind: "ma_buyside",                 title: "M&A — Buy-side",             titleAr: "اندماج واستحواذ — شراء", region: "UAE", jurisdiction: "ADGM", defaultFeeModel: "hourly",    expectedDurationDays: 120, docCount: 14 },
  { id: "pr_masel", kind: "ma_sellside",                title: "M&A — Sell-side",            titleAr: "اندماج واستحواذ — بيع",  region: "UAE", jurisdiction: "ADGM", defaultFeeModel: "hourly",    expectedDurationDays: 120, docCount: 13 },
  { id: "pr_pub",   kind: "go_public",                  title: "Go Public (IPO)",            titleAr: "الطرح العام",          region: "KSA", jurisdiction: "MISA", defaultFeeModel: "milestone", expectedDurationDays: 240, docCount: 18 },
  { id: "pr_priv",  kind: "go_private",                 title: "Go Private",                 titleAr: "التحول للملكية الخاصة", region: "UAE", jurisdiction: "DIFC", defaultFeeModel: "milestone", expectedDurationDays: 150, docCount: 12 },
  { id: "pr_jv",    kind: "joint_venture",              title: "Joint Venture",              titleAr: "مشروع مشترك",          region: "UAE", jurisdiction: "DMCC", defaultFeeModel: "fixed",     expectedDurationDays: 60,  docCount: 7 },
  { id: "pr_rest",  kind: "restructuring",              title: "Restructuring",              titleAr: "إعادة الهيكلة",        region: "UAE", jurisdiction: "ADGM", defaultFeeModel: "hourly",    expectedDurationDays: 90,  docCount: 10 },
  { id: "pr_bank",  kind: "bankruptcy_insolvency",      title: "Bankruptcy / Insolvency",    titleAr: "الإفلاس والإعسار",     region: "UAE", jurisdiction: "ADGM", defaultFeeModel: "hourly",    expectedDurationDays: 180, docCount: 11 },
];

export type SlotStatus =
  | "not_started" | "drafting" | "in_review" | "approved" | "out_for_signature" | "signed" | "filed" | "waived";

export type DocSlot = {
  id: string; ordinal: number; title: string; expectedKind: string; stage: string;
  required: boolean; status: SlotStatus; assignee: string; autofilled: boolean; dueAt: string;
};

/** A matter with an instantiated process: the ordered document set + status. */
export type MatterWorkspace = {
  id: string; matterNumber: string; title: string; client: string;
  processId: string; processTitle: string; region: "UAE" | "KSA";
  jurisdiction: string; language: "en" | "ar"; lead: string; progressPct: number;
  targetCloseAt: string; feeModel: string; slots: DocSlot[];
  /** Canonical client record used for autofill. */
  clientRecord: { legalName: string; legalNameAr: string; address: string; licenseNo: string; signatory: string; signatoryTitle: string };
};

export const matterWorkspaces: MatterWorkspace[] = [
  {
    id: "mw1", matterNumber: "2026-0210", title: "Meridian Tech — DIFC Formation", client: "Meridian Tech Holdings",
    processId: "pr_form", processTitle: "Company Formation", region: "UAE", jurisdiction: "DIFC", language: "en",
    lead: "Sara Al-Mansoori", progressPct: 45, targetCloseAt: "2026-07-08", feeModel: "Fixed fee — $12,000",
    clientRecord: { legalName: "Meridian Tech Holdings Ltd", legalNameAr: "ميريديان تك القابضة", address: "Gate Village 5, DIFC, Dubai, UAE", licenseNo: "DIFC-PENDING", signatory: "Omar Haddad", signatoryTitle: "Founder & CEO" },
    slots: [
      { id: "s1", ordinal: 1, title: "Engagement Letter",                 expectedKind: "Engagement",        stage: "Pre-signing", required: true,  status: "signed",            assignee: "Sara Al-Mansoori", autofilled: true,  dueAt: "2026-06-10" },
      { id: "s2", ordinal: 2, title: "KYC / UBO Declaration",             expectedKind: "KYC",               stage: "Pre-signing", required: true,  status: "signed",            assignee: "Hala Mahmoud",     autofilled: true,  dueAt: "2026-06-14" },
      { id: "s3", ordinal: 3, title: "Memorandum of Association",         expectedKind: "MOA",               stage: "Formation",   required: true,  status: "in_review",         assignee: "Sara Al-Mansoori", autofilled: true,  dueAt: "2026-06-20" },
      { id: "s4", ordinal: 4, title: "Articles of Association",           expectedKind: "AOA",               stage: "Formation",   required: true,  status: "drafting",          assignee: "Hala Mahmoud",     autofilled: true,  dueAt: "2026-06-22" },
      { id: "s5", ordinal: 5, title: "Board Resolution — Incorporation",  expectedKind: "Board Resolution",  stage: "Formation",   required: true,  status: "not_started",       assignee: "Hala Mahmoud",     autofilled: false, dueAt: "2026-06-25" },
      { id: "s6", ordinal: 6, title: "Register of Directors",             expectedKind: "Register",          stage: "Formation",   required: true,  status: "not_started",       assignee: "Hala Mahmoud",     autofilled: false, dueAt: "2026-06-27" },
      { id: "s7", ordinal: 7, title: "Share Certificate(s)",              expectedKind: "Share Certificate", stage: "Closing",     required: true,  status: "not_started",       assignee: "Sara Al-Mansoori", autofilled: false, dueAt: "2026-07-02" },
      { id: "s8", ordinal: 8, title: "DIFC Registration Filing",          expectedKind: "Filing",            stage: "Closing",     required: true,  status: "not_started",       assignee: "Sara Al-Mansoori", autofilled: false, dueAt: "2026-07-08" },
    ],
  },
  {
    id: "mw2", matterNumber: "2026-0214", title: "Falcon × Nimbus — JV", client: "Falcon Trade DMCC",
    processId: "pr_jv", processTitle: "Joint Venture", region: "UAE", jurisdiction: "DMCC", language: "en",
    lead: "Mohammed Khan", progressPct: 28, targetCloseAt: "2026-08-01", feeModel: "Fixed fee — $18,000",
    clientRecord: { legalName: "Falcon Trade DMCC", legalNameAr: "فالكون تريد", address: "Unit 2204, JBC1, DMCC, Dubai, UAE", licenseNo: "DMCC-90112", signatory: "Karim Nasser", signatoryTitle: "Managing Director" },
    slots: [
      { id: "j1", ordinal: 1, title: "Term Sheet",                        expectedKind: "Term Sheet",        stage: "Pre-signing", required: true,  status: "signed",      assignee: "Mohammed Khan", autofilled: true,  dueAt: "2026-06-12" },
      { id: "j2", ordinal: 2, title: "JV Agreement",                      expectedKind: "JV",                stage: "Formation",   required: true,  status: "drafting",    assignee: "Mohammed Khan", autofilled: true,  dueAt: "2026-06-28" },
      { id: "j3", ordinal: 3, title: "Shareholders' Agreement",           expectedKind: "SHA",               stage: "Formation",   required: true,  status: "not_started", assignee: "Yusuf Ibrahim", autofilled: false, dueAt: "2026-07-10" },
      { id: "j4", ordinal: 4, title: "Memorandum of Association",         expectedKind: "MOA",               stage: "Formation",   required: true,  status: "not_started", assignee: "Yusuf Ibrahim", autofilled: false, dueAt: "2026-07-14" },
      { id: "j5", ordinal: 5, title: "Board Resolutions (both parties)",  expectedKind: "Board Resolution",  stage: "Closing",     required: true,  status: "not_started", assignee: "Mohammed Khan", autofilled: false, dueAt: "2026-07-20" },
      { id: "j6", ordinal: 6, title: "DMCC JV Filing",                    expectedKind: "Filing",            stage: "Closing",     required: true,  status: "not_started", assignee: "Mohammed Khan", autofilled: false, dueAt: "2026-08-01" },
      { id: "j7", ordinal: 7, title: "Completion Certificate",            expectedKind: "Certificate",       stage: "Post-closing",required: false, status: "not_started", assignee: "Mohammed Khan", autofilled: false, dueAt: "2026-08-05" },
    ],
  },
];

/** Template library entries available to drag onto a slot (narrowed by process). */
export type SlotTemplate = { id: string; title: string; kind: string; scope: "personal" | "firm" | "marketplace"; region: "UAE" | "KSA" | "GLOBAL"; language: "en" | "ar" };
export const slotTemplates: SlotTemplate[] = [
  { id: "tpl_moa_difc", title: "MOA — DIFC standard",            kind: "MOA",              scope: "firm",        region: "UAE", language: "en" },
  { id: "tpl_aoa_difc", title: "AOA — DIFC standard",            kind: "AOA",              scope: "firm",        region: "UAE", language: "en" },
  { id: "tpl_board_inc", title: "Board Resolution — Incorporation", kind: "Board Resolution", scope: "firm",     region: "UAE", language: "en" },
  { id: "tpl_reg_dir",  title: "Register of Directors",          kind: "Register",         scope: "firm",        region: "UAE", language: "en" },
  { id: "tpl_share_cert", title: "Share Certificate",            kind: "Share Certificate", scope: "firm",       region: "UAE", language: "en" },
  { id: "tpl_moa_difc_ar", title: "MOA — DIFC (Arabic)",         kind: "MOA",              scope: "firm",        region: "UAE", language: "ar" },
  { id: "tpl_sha_a",    title: "SHA — Series A (DIFC)",          kind: "SHA",              scope: "marketplace", region: "UAE", language: "en" },
];

/** Passive time captured today, awaiting the one-tap confirm sweep. */
export type TimeToConfirm = { id: string; matter: string; matterNumber: string; activity: string; source: string; minutes: number; rateUsd: number };
export const timeToConfirm: TimeToConfirm[] = [
  { id: "tc1", matter: "Meridian Tech — DIFC Formation", matterNumber: "2026-0210", activity: "Drafting Articles of Association", source: "editor",   minutes: 95, rateUsd: 650 },
  { id: "tc2", matter: "Meridian Tech — DIFC Formation", matterNumber: "2026-0210", activity: "AI draft — Board Resolution",      source: "ai_draft", minutes: 25, rateUsd: 650 },
  { id: "tc3", matter: "Falcon × Nimbus — JV",           matterNumber: "2026-0214", activity: "Review call — term sheet",         source: "call",     minutes: 40, rateUsd: 650 },
  { id: "tc4", matter: "Alistair v. Orion",              matterNumber: "2026-0142", activity: "Research — IP enforcement",        source: "research", minutes: 70, rateUsd: 650 },
];

/** Typed blockers off the process graph — the blindspot engine. */
export type Blocker = { id: string; matter: string; matterNumber: string; kind: string; severity: "low" | "medium" | "high" | "critical"; title: string; owner: string; ageDays: number };
export const blockers: Blocker[] = [
  { id: "b1", matter: "Riyadh Industries — IPO",        matterNumber: "2026-0181", kind: "external_dependency_wait", severity: "high",     title: "Awaiting CMA pre-clearance (KSA) — 12 days, no response", owner: "Aisha Al-Otaibi",  ageDays: 12 },
  { id: "b2", matter: "Falcon × Nimbus — JV",           matterNumber: "2026-0214", kind: "dependency_violation",     severity: "medium",   title: "SHA drafting started before JV Agreement signed",         owner: "Mohammed Khan",    ageDays: 3 },
  { id: "b3", matter: "Meridian Tech — DIFC Formation", matterNumber: "2026-0210", kind: "signature_bottleneck",     severity: "medium",   title: "MOA in review 6 days — past 3-day SLA",                    owner: "Sara Al-Mansoori", ageDays: 6 },
  { id: "b4", matter: "Gulf Wave SPV — Investor exit",  matterNumber: "2026-0202", kind: "wip_leakage",              severity: "high",     title: "12.3h unbilled WIP older than 45 days",                    owner: "Mohammed Khan",    ageDays: 47 },
  { id: "b5", matter: "Alistair v. Orion",              matterNumber: "2026-0142", kind: "quiet_matter",             severity: "low",      title: "No activity in 9 days on an active matter",                owner: "Sara Al-Mansoori", ageDays: 9 },
];

/** Recoverable-revenue protection. */
export type Leakage = { id: string; matter: string; kind: string; amountUsd: number; severity: "low" | "medium" | "high" };
export const leakage: Leakage[] = [
  { id: "l1", matter: "Gulf Wave SPV — Investor exit",  kind: "Aged unbilled WIP (>45d)",   amountUsd: 7_995, severity: "high" },
  { id: "l2", matter: "Meridian Tech — DIFC Formation", kind: "Finalised doc, no time",     amountUsd: 1_300, severity: "medium" },
  { id: "l3", matter: "Falcon × Nimbus — JV",           kind: "Rate-card mismatch",         amountUsd: 900,   severity: "low" },
];

/** Per-lawyer performance + promotion-readiness (decision-support, not a verdict). */
export type Performance = {
  id: string; name: string; role: string; billableHoursMTD: number; targetHoursMTD: number;
  realisationPct: number; collectionPct: number; utilisationPct: number;
  mattersClosedYTD: number; onTimeMilestonePct: number;
  promotionBand: "not_yet" | "developing" | "approaching" | "ready" | "overdue"; promotionScore: number;
};
export const performance: Performance[] = [
  { id: "u1", name: "Sara Al-Mansoori", role: "Partner",     billableHoursMTD: 142, targetHoursMTD: 150, realisationPct: 94, collectionPct: 88, utilisationPct: 82, mattersClosedYTD: 31, onTimeMilestonePct: 91, promotionBand: "not_yet",    promotionScore: 0  },
  { id: "u2", name: "Mohammed Khan",    role: "Senior Assoc", billableHoursMTD: 128, targetHoursMTD: 140, realisationPct: 89, collectionPct: 84, utilisationPct: 76, mattersClosedYTD: 24, onTimeMilestonePct: 86, promotionBand: "ready",      promotionScore: 82 },
  { id: "u3", name: "Aisha Al-Otaibi",  role: "Associate",   billableHoursMTD: 121, targetHoursMTD: 140, realisationPct: 87, collectionPct: 80, utilisationPct: 74, mattersClosedYTD: 19, onTimeMilestonePct: 83, promotionBand: "approaching", promotionScore: 68 },
  { id: "u4", name: "Yusuf Ibrahim",    role: "Paralegal",   billableHoursMTD: 96,  targetHoursMTD: 120, realisationPct: 78, collectionPct: 76, utilisationPct: 68, mattersClosedYTD: 0,  onTimeMilestonePct: 90, promotionBand: "developing",  promotionScore: 41 },
];

/** Firm Vitality Index + components (never a black box). */
export const firmVitality = {
  index: 79,
  utilisationPct: 77,
  realisationPct: 90,
  wipTotalUsd: 412_000,
  wipAgedUsd: 58_400,        // > 45 days
  arOutstandingUsd: 91_900,
  activeMatters: 38,
  mattersOpenedThisMonth: 6,
  mattersClosedThisMonth: 4,
  mattersClosedYTD: 74,
  pipelineUsd: 240_000,
  openLeakageUsd: 9_795,
  openBlockers: 5,
};

/** 12-month throughput (cases per month) for the owner pulse trend. */
export const throughputByMonth: { month: string; opened: number; closed: number }[] = [
  { month: "Jul", opened: 5, closed: 4 }, { month: "Aug", opened: 6, closed: 5 }, { month: "Sep", opened: 7, closed: 6 },
  { month: "Oct", opened: 6, closed: 7 }, { month: "Nov", opened: 8, closed: 6 }, { month: "Dec", opened: 5, closed: 7 },
  { month: "Jan", opened: 9, closed: 6 }, { month: "Feb", opened: 7, closed: 8 }, { month: "Mar", opened: 8, closed: 7 },
  { month: "Apr", opened: 6, closed: 6 }, { month: "May", opened: 7, closed: 5 }, { month: "Jun", opened: 6, closed: 4 },
];
