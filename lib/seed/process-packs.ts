/**
 * Sprint 12 — process packs.
 *
 * Eight globally-available process definitions every firm in the GCC needs:
 *
 *   - M&A buy-side          → mandate → LOI → DD → SPA → close
 *   - M&A sell-side         → mandate → IM → NDA → bids → SPA → close
 *   - IPO ADX               → board + audit → SCA + ADX → roadshow → trading
 *   - IPO Nasdaq Dubai      → board + audit → DFSA + Nasdaq Dubai → trading
 *   - Patent filing (GCC)   → disclosure → priority → PCT → national phase
 *   - Litigation            → demand → file → discovery → hearings → judgement
 *   - Employment dispute    → grievance → MoHRE / MoL conciliation → tribunal
 *   - Fund launch           → structure → regulator → docs → onboarding → close
 *
 * All processes are inserted with `tenantId = null` so they are part of the
 * platform's global library — a firm can fork (clone-and-edit) any pack into
 * their own scoped copy with their template links + ownerRole assignments.
 *
 * Idempotent: matches by (kind, title, jurisdiction) and skips if present.
 */
import { eq, and, isNull } from "drizzle-orm";
import type { db as DbClient } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

type StepDef = {
  ordinal: number;
  name: string;
  nameAr: string;
  ownerRole?: "lawyer" | "partner" | "associate" | "paralegal" | "client" | "regulator";
  expectedDurationDays?: number;
  dependsOnOrdinals?: number[];
  isMilestone?: boolean;
  optional?: boolean;
};

type SlotDef = {
  ordinal: number;
  title: string;
  titleAr: string;
  expectedKind: string;
  stepOrdinal: number;       // links to a StepDef via ordinal
  stage?: string;
  required?: boolean;
};

type PackDef = {
  kind: typeof s.processKindEnum.enumValues[number];
  title: string;
  titleAr: string;
  description: string;
  region: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL";
  jurisdiction: string | null;
  language: "en";
  expectedDurationDays: number;
  defaultFeeModel: "hourly" | "fixed" | "retainer" | "milestone";
  steps: StepDef[];
  slots: SlotDef[];
};

// ────────────────────────────────────────────────────────────────────
// 1. M&A — Buy-side
// ────────────────────────────────────────────────────────────────────
const PACK_MA_BUYSIDE: PackDef = {
  kind: "ma_buyside",
  title: "M&A — Buy-side mandate",
  titleAr: "اندماج واستحواذ — جانب الشراء",
  description: "Buy-side acquisition from mandate through to closing: NDA, LOI, due diligence, definitive agreements and closing.",
  region: "GLOBAL",
  jurisdiction: null,
  language: "en",
  expectedDurationDays: 180,
  defaultFeeModel: "milestone",
  steps: [
    { ordinal: 1,  name: "Mandate + conflicts check",        nameAr: "التكليف + فحص التعارض",            ownerRole: "partner",   expectedDurationDays: 3,  isMilestone: true },
    { ordinal: 2,  name: "NDA with target",                  nameAr: "اتفاقية عدم إفشاء مع الهدف",      ownerRole: "lawyer",    expectedDurationDays: 5,  dependsOnOrdinals: [1] },
    { ordinal: 3,  name: "LOI / term sheet",                 nameAr: "خطاب النوايا / شروط أولية",       ownerRole: "partner",   expectedDurationDays: 10, dependsOnOrdinals: [2], isMilestone: true },
    { ordinal: 4,  name: "Legal due diligence",              nameAr: "العناية القانونية الواجبة",        ownerRole: "associate", expectedDurationDays: 30, dependsOnOrdinals: [3] },
    { ordinal: 5,  name: "Financial / tax / commercial DD",  nameAr: "العناية المالية والضريبية والتجارية", ownerRole: "associate", expectedDurationDays: 30, dependsOnOrdinals: [3] },
    { ordinal: 6,  name: "DD report + risk register",        nameAr: "تقرير العناية الواجبة + سجل المخاطر", ownerRole: "partner",   expectedDurationDays: 7,  dependsOnOrdinals: [4, 5] },
    { ordinal: 7,  name: "SPA drafting",                     nameAr: "صياغة اتفاقية البيع والشراء",      ownerRole: "lawyer",    expectedDurationDays: 14, dependsOnOrdinals: [6] },
    { ordinal: 8,  name: "Disclosure schedules",             nameAr: "جداول الإفصاح",                    ownerRole: "associate", expectedDurationDays: 14, dependsOnOrdinals: [6] },
    { ordinal: 9,  name: "Negotiation + sign",               nameAr: "التفاوض والتوقيع",                 ownerRole: "partner",   expectedDurationDays: 21, dependsOnOrdinals: [7, 8], isMilestone: true },
    { ordinal: 10, name: "Conditions precedent",             nameAr: "الشروط السابقة",                   ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [9] },
    { ordinal: 11, name: "Closing",                          nameAr: "الإغلاق",                          ownerRole: "partner",   expectedDurationDays: 1,  dependsOnOrdinals: [10], isMilestone: true },
    { ordinal: 12, name: "Post-closing TSA + integration",   nameAr: "اتفاقية الخدمات الانتقالية والدمج", ownerRole: "lawyer",    expectedDurationDays: 60, dependsOnOrdinals: [11], optional: true },
  ],
  slots: [
    { ordinal: 1, title: "NDA",                       titleAr: "اتفاقية عدم إفشاء",            expectedKind: "NDA",                stepOrdinal: 2,  stage: "Origination" },
    { ordinal: 2, title: "LOI / Term sheet",          titleAr: "خطاب النوايا",                expectedKind: "LOI",                stepOrdinal: 3,  stage: "Origination" },
    { ordinal: 3, title: "DD checklist",              titleAr: "قائمة العناية الواجبة",       expectedKind: "DD Checklist",       stepOrdinal: 4,  stage: "Diligence" },
    { ordinal: 4, title: "DD report",                 titleAr: "تقرير العناية الواجبة",       expectedKind: "DD Report",          stepOrdinal: 6,  stage: "Diligence" },
    { ordinal: 5, title: "SPA draft",                 titleAr: "مسودة اتفاقية البيع والشراء", expectedKind: "SPA",                stepOrdinal: 7,  stage: "Definitive" },
    { ordinal: 6, title: "Disclosure schedules",      titleAr: "جداول الإفصاح",               expectedKind: "Disclosure Schedule", stepOrdinal: 8,  stage: "Definitive" },
    { ordinal: 7, title: "Closing memo",              titleAr: "مذكرة الإغلاق",                expectedKind: "Closing Memo",       stepOrdinal: 11, stage: "Closing" },
    { ordinal: 8, title: "TSA (transitional services)", titleAr: "اتفاقية الخدمات الانتقالية", expectedKind: "TSA",                stepOrdinal: 12, stage: "Post-closing", required: false },
  ],
};

// ────────────────────────────────────────────────────────────────────
// 2. M&A — Sell-side
// ────────────────────────────────────────────────────────────────────
const PACK_MA_SELLSIDE: PackDef = {
  kind: "ma_sellside",
  title: "M&A — Sell-side mandate",
  titleAr: "اندماج واستحواذ — جانب البيع",
  description: "Sell-side mandate from preparation through to closing: vendor DD, teaser, IM, bidder process, SPA, closing.",
  region: "GLOBAL",
  jurisdiction: null,
  language: "en",
  expectedDurationDays: 240,
  defaultFeeModel: "milestone",
  steps: [
    { ordinal: 1,  name: "Mandate + conflicts check",   nameAr: "التكليف + فحص التعارض",        ownerRole: "partner",   expectedDurationDays: 3,  isMilestone: true },
    { ordinal: 2,  name: "Vendor due diligence",        nameAr: "العناية الواجبة من البائع",    ownerRole: "associate", expectedDurationDays: 30, dependsOnOrdinals: [1] },
    { ordinal: 3,  name: "Teaser preparation",          nameAr: "إعداد الملخص الترويجي",        ownerRole: "associate", expectedDurationDays: 5,  dependsOnOrdinals: [2] },
    { ordinal: 4,  name: "Information memorandum (IM)", nameAr: "مذكرة المعلومات",               ownerRole: "lawyer",    expectedDurationDays: 14, dependsOnOrdinals: [2] },
    { ordinal: 5,  name: "Buyer NDAs",                  nameAr: "اتفاقيات عدم إفشاء مع المشترين", ownerRole: "lawyer",    expectedDurationDays: 10, dependsOnOrdinals: [3] },
    { ordinal: 6,  name: "Process letter + bid receipt", nameAr: "خطاب العملية + استلام العروض", ownerRole: "partner",   expectedDurationDays: 14, dependsOnOrdinals: [4, 5] },
    { ordinal: 7,  name: "Shortlist negotiation",       nameAr: "التفاوض مع القائمة المختصرة",  ownerRole: "partner",   expectedDurationDays: 30, dependsOnOrdinals: [6] },
    { ordinal: 8,  name: "SPA + disclosure schedules",  nameAr: "اتفاقية البيع وجداول الإفصاح", ownerRole: "lawyer",    expectedDurationDays: 21, dependsOnOrdinals: [7] },
    { ordinal: 9,  name: "Signing",                     nameAr: "التوقيع",                       ownerRole: "partner",   expectedDurationDays: 1,  dependsOnOrdinals: [8], isMilestone: true },
    { ordinal: 10, name: "Closing",                     nameAr: "الإغلاق",                       ownerRole: "partner",   expectedDurationDays: 30, dependsOnOrdinals: [9], isMilestone: true },
    { ordinal: 11, name: "Earn-out monitoring",         nameAr: "متابعة دفعات الأداء",           ownerRole: "associate", expectedDurationDays: 365, dependsOnOrdinals: [10], optional: true },
  ],
  slots: [
    { ordinal: 1, title: "Vendor DD pack",          titleAr: "حزمة العناية من البائع",         expectedKind: "VDD",                stepOrdinal: 2,  stage: "Preparation" },
    { ordinal: 2, title: "Teaser",                  titleAr: "الملخص الترويجي",                expectedKind: "Teaser",             stepOrdinal: 3,  stage: "Marketing" },
    { ordinal: 3, title: "Information memorandum",  titleAr: "مذكرة المعلومات",                expectedKind: "IM",                 stepOrdinal: 4,  stage: "Marketing" },
    { ordinal: 4, title: "Process letter",          titleAr: "خطاب العملية",                   expectedKind: "Process Letter",     stepOrdinal: 6,  stage: "Auction" },
    { ordinal: 5, title: "SPA",                     titleAr: "اتفاقية البيع والشراء",          expectedKind: "SPA",                stepOrdinal: 8,  stage: "Definitive" },
    { ordinal: 6, title: "Disclosure schedules",    titleAr: "جداول الإفصاح",                  expectedKind: "Disclosure Schedule", stepOrdinal: 8,  stage: "Definitive" },
    { ordinal: 7, title: "Closing memo",            titleAr: "مذكرة الإغلاق",                  expectedKind: "Closing Memo",       stepOrdinal: 10, stage: "Closing" },
  ],
};

// ────────────────────────────────────────────────────────────────────
// 3. IPO — Abu Dhabi Securities Exchange (ADX)
// ────────────────────────────────────────────────────────────────────
const PACK_IPO_ADX: PackDef = {
  kind: "go_public",
  title: "IPO — Abu Dhabi Securities Exchange (ADX)",
  titleAr: "اكتتاب عام — سوق أبوظبي للأوراق المالية",
  description: "ADX initial public offering: board + auditor approval, SCA prospectus, ADX listing application, roadshow, allocation, trading commencement.",
  region: "UAE",
  jurisdiction: "ADX",
  language: "en",
  expectedDurationDays: 270,
  defaultFeeModel: "milestone",
  steps: [
    { ordinal: 1,  name: "Board approval to list",          nameAr: "موافقة مجلس الإدارة على الإدراج",  ownerRole: "partner",   expectedDurationDays: 14, isMilestone: true },
    { ordinal: 2,  name: "Audited financial statements (3y)", nameAr: "البيانات المالية المدققة (3 سنوات)", ownerRole: "client", expectedDurationDays: 60, dependsOnOrdinals: [1] },
    { ordinal: 3,  name: "Appoint advisers + lead manager", nameAr: "تعيين المستشارين والمدير الرئيسي", ownerRole: "partner",   expectedDurationDays: 14, dependsOnOrdinals: [1] },
    { ordinal: 4,  name: "Restructuring + share capital",   nameAr: "إعادة الهيكلة ورأس المال",         ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [2, 3] },
    { ordinal: 5,  name: "Prospectus drafting",             nameAr: "صياغة نشرة الاكتتاب",              ownerRole: "lawyer",    expectedDurationDays: 60, dependsOnOrdinals: [4] },
    { ordinal: 6,  name: "SCA approval submission",         nameAr: "تقديم موافقة الهيئة (SCA)",        ownerRole: "partner",   expectedDurationDays: 45, dependsOnOrdinals: [5], isMilestone: true },
    { ordinal: 7,  name: "ADX listing application",         nameAr: "طلب الإدراج في سوق أبوظبي",        ownerRole: "partner",   expectedDurationDays: 30, dependsOnOrdinals: [6], isMilestone: true },
    { ordinal: 8,  name: "Roadshow + bookbuilding",         nameAr: "العروض الترويجية وبناء سجل الأوامر", ownerRole: "partner", expectedDurationDays: 14, dependsOnOrdinals: [7] },
    { ordinal: 9,  name: "Allocation + pricing",            nameAr: "التخصيص والتسعير",                 ownerRole: "partner",   expectedDurationDays: 3,  dependsOnOrdinals: [8], isMilestone: true },
    { ordinal: 10, name: "Settlement + trading",            nameAr: "التسوية وبدء التداول",             ownerRole: "partner",   expectedDurationDays: 3,  dependsOnOrdinals: [9], isMilestone: true },
    { ordinal: 11, name: "Post-listing compliance",         nameAr: "الامتثال بعد الإدراج",             ownerRole: "associate", expectedDurationDays: 365, dependsOnOrdinals: [10] },
  ],
  slots: [
    { ordinal: 1, title: "Board resolution to list",        titleAr: "قرار مجلس الإدارة بالإدراج",     expectedKind: "Board Resolution",       stepOrdinal: 1,  stage: "Pre-listing" },
    { ordinal: 2, title: "Audited financial statements",    titleAr: "البيانات المالية المدققة",       expectedKind: "Financial Statements",    stepOrdinal: 2,  stage: "Pre-listing" },
    { ordinal: 3, title: "Engagement letters (advisers)",   titleAr: "خطابات تكليف المستشارين",        expectedKind: "Engagement Letter",       stepOrdinal: 3,  stage: "Pre-listing" },
    { ordinal: 4, title: "Restructuring agreements",        titleAr: "اتفاقيات إعادة الهيكلة",          expectedKind: "Restructuring Agreement", stepOrdinal: 4,  stage: "Pre-listing" },
    { ordinal: 5, title: "Prospectus",                      titleAr: "نشرة الاكتتاب",                   expectedKind: "Prospectus",              stepOrdinal: 5,  stage: "Regulator" },
    { ordinal: 6, title: "SCA submission pack",             titleAr: "حزمة تقديم للهيئة",               expectedKind: "Regulator Filing",        stepOrdinal: 6,  stage: "Regulator" },
    { ordinal: 7, title: "ADX listing application",         titleAr: "طلب إدراج سوق أبوظبي",           expectedKind: "Listing Application",     stepOrdinal: 7,  stage: "Regulator" },
    { ordinal: 8, title: "Underwriting agreement",          titleAr: "اتفاقية الاكتتاب",                expectedKind: "Underwriting Agreement",  stepOrdinal: 8,  stage: "Marketing" },
    { ordinal: 9, title: "Allocation memo",                 titleAr: "مذكرة التخصيص",                   expectedKind: "Allocation Memo",         stepOrdinal: 9,  stage: "Pricing" },
    { ordinal:10, title: "Trading commencement notice",     titleAr: "إعلان بدء التداول",               expectedKind: "Trading Notice",          stepOrdinal: 10, stage: "Listing" },
  ],
};

// ────────────────────────────────────────────────────────────────────
// 4. IPO — Nasdaq Dubai (DFSA-regulated DIFC)
// ────────────────────────────────────────────────────────────────────
const PACK_IPO_NASDAQ_DUBAI: PackDef = {
  kind: "go_public",
  title: "IPO — Nasdaq Dubai",
  titleAr: "اكتتاب عام — ناسداك دبي",
  description: "Nasdaq Dubai listing under the DIFC / DFSA regime: board + audit, DFSA prospectus approval, Nasdaq Dubai listing, bookbuilding, trading.",
  region: "UAE",
  jurisdiction: "Nasdaq Dubai",
  language: "en",
  expectedDurationDays: 270,
  defaultFeeModel: "milestone",
  steps: [
    { ordinal: 1,  name: "Board approval to list",                nameAr: "موافقة مجلس الإدارة على الإدراج", ownerRole: "partner",  expectedDurationDays: 14, isMilestone: true },
    { ordinal: 2,  name: "Audited financials (3y, IFRS)",         nameAr: "بيانات مالية مدققة (3 سنوات، IFRS)", ownerRole: "client", expectedDurationDays: 60, dependsOnOrdinals: [1] },
    { ordinal: 3,  name: "Appoint sponsor + advisers",            nameAr: "تعيين الراعي والمستشارين",         ownerRole: "partner",  expectedDurationDays: 14, dependsOnOrdinals: [1] },
    { ordinal: 4,  name: "DIFC migration / domicile (if needed)", nameAr: "النقل / التوطين في DIFC إن لزم",   ownerRole: "lawyer",   expectedDurationDays: 60, dependsOnOrdinals: [3], optional: true },
    { ordinal: 5,  name: "Prospectus drafting",                   nameAr: "صياغة نشرة الاكتتاب",              ownerRole: "lawyer",   expectedDurationDays: 60, dependsOnOrdinals: [2, 3] },
    { ordinal: 6,  name: "DFSA approval",                         nameAr: "موافقة DFSA",                       ownerRole: "partner",  expectedDurationDays: 45, dependsOnOrdinals: [5], isMilestone: true },
    { ordinal: 7,  name: "Nasdaq Dubai listing application",      nameAr: "طلب إدراج في ناسداك دبي",          ownerRole: "partner",  expectedDurationDays: 21, dependsOnOrdinals: [6], isMilestone: true },
    { ordinal: 8,  name: "Roadshow + bookbuilding",               nameAr: "العروض الترويجية وبناء السجل",     ownerRole: "partner",  expectedDurationDays: 14, dependsOnOrdinals: [7] },
    { ordinal: 9,  name: "Allocation + pricing",                  nameAr: "التخصيص والتسعير",                 ownerRole: "partner",  expectedDurationDays: 3,  dependsOnOrdinals: [8], isMilestone: true },
    { ordinal: 10, name: "Admission + first trading day",         nameAr: "القبول واليوم الأول للتداول",      ownerRole: "partner",  expectedDurationDays: 3,  dependsOnOrdinals: [9], isMilestone: true },
    { ordinal: 11, name: "Continuing-obligations compliance",     nameAr: "الامتثال للالتزامات المستمرة",     ownerRole: "associate", expectedDurationDays: 365, dependsOnOrdinals: [10] },
  ],
  slots: [
    { ordinal: 1, title: "Board resolution to list",         titleAr: "قرار مجلس الإدارة بالإدراج",      expectedKind: "Board Resolution",         stepOrdinal: 1,  stage: "Pre-listing" },
    { ordinal: 2, title: "Audited financials (IFRS)",        titleAr: "بيانات مالية مدققة",              expectedKind: "Financial Statements",      stepOrdinal: 2,  stage: "Pre-listing" },
    { ordinal: 3, title: "Sponsor + adviser engagement",     titleAr: "تكليفات الراعي والمستشارين",       expectedKind: "Engagement Letter",         stepOrdinal: 3,  stage: "Pre-listing" },
    { ordinal: 4, title: "DIFC migration documents",         titleAr: "وثائق النقل إلى DIFC",            expectedKind: "Migration Agreement",       stepOrdinal: 4,  stage: "Pre-listing", required: false },
    { ordinal: 5, title: "Prospectus",                       titleAr: "نشرة الاكتتاب",                   expectedKind: "Prospectus",                stepOrdinal: 5,  stage: "Regulator" },
    { ordinal: 6, title: "DFSA submission pack",             titleAr: "حزمة تقديم DFSA",                 expectedKind: "Regulator Filing",          stepOrdinal: 6,  stage: "Regulator" },
    { ordinal: 7, title: "Nasdaq Dubai listing application", titleAr: "طلب إدراج ناسداك دبي",            expectedKind: "Listing Application",       stepOrdinal: 7,  stage: "Regulator" },
    { ordinal: 8, title: "Underwriting agreement",           titleAr: "اتفاقية الاكتتاب",                expectedKind: "Underwriting Agreement",    stepOrdinal: 8,  stage: "Marketing" },
    { ordinal: 9, title: "Pricing memo",                     titleAr: "مذكرة التسعير",                   expectedKind: "Pricing Memo",              stepOrdinal: 9,  stage: "Pricing" },
    { ordinal:10, title: "Admission notice",                 titleAr: "إعلان القبول",                    expectedKind: "Admission Notice",          stepOrdinal: 10, stage: "Listing" },
  ],
};

// ────────────────────────────────────────────────────────────────────
// 5. Patent filing — UAE / KSA / GCC patent office
// ────────────────────────────────────────────────────────────────────
const PACK_PATENT_FILING: PackDef = {
  kind: "licensing_regulatory",
  title: "Patent filing — UAE / KSA / GCC",
  titleAr: "تسجيل براءة اختراع — الإمارات / السعودية / دول الخليج",
  description: "Priority filing through national-phase entry: invention disclosure, novelty search, priority application, PCT/Paris route, national phase, examination, grant + maintenance.",
  region: "GLOBAL",
  jurisdiction: null,
  language: "en",
  expectedDurationDays: 730,
  defaultFeeModel: "fixed",
  steps: [
    { ordinal: 1, name: "Invention disclosure",             nameAr: "الإفصاح عن الاختراع",            ownerRole: "client",    expectedDurationDays: 14, isMilestone: true },
    { ordinal: 2, name: "Novelty / prior-art search",       nameAr: "بحث الجدة والحالة السابقة",      ownerRole: "associate", expectedDurationDays: 21, dependsOnOrdinals: [1] },
    { ordinal: 3, name: "Patentability opinion",            nameAr: "رأي قابلية تسجيل البراءة",       ownerRole: "partner",   expectedDurationDays: 7,  dependsOnOrdinals: [2] },
    { ordinal: 4, name: "Priority application drafting",    nameAr: "صياغة طلب الأولوية",             ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [3] },
    { ordinal: 5, name: "Priority filing",                  nameAr: "إيداع الأولوية",                 ownerRole: "lawyer",    expectedDurationDays: 1,  dependsOnOrdinals: [4], isMilestone: true },
    { ordinal: 6, name: "PCT / Paris route decision",       nameAr: "قرار مسار PCT / باريس",          ownerRole: "partner",   expectedDurationDays: 14, dependsOnOrdinals: [5] },
    { ordinal: 7, name: "PCT filing (if elected)",          nameAr: "إيداع PCT إن اختير",             ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [6], optional: true },
    { ordinal: 8, name: "National-phase entries",           nameAr: "الدخول إلى المرحلة الوطنية",     ownerRole: "lawyer",    expectedDurationDays: 60, dependsOnOrdinals: [6] },
    { ordinal: 9, name: "Office-action responses",          nameAr: "الرد على ملاحظات الفحص",         ownerRole: "associate", expectedDurationDays: 180, dependsOnOrdinals: [8] },
    { ordinal:10, name: "Grant + publication",              nameAr: "المنح والنشر",                    ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [9], isMilestone: true },
    { ordinal:11, name: "Maintenance + renewal",            nameAr: "الصيانة والتجديد",                ownerRole: "associate", expectedDurationDays: 3650, dependsOnOrdinals: [10] },
  ],
  slots: [
    { ordinal: 1, title: "Invention disclosure form",       titleAr: "نموذج الإفصاح عن الاختراع",      expectedKind: "Invention Disclosure",  stepOrdinal: 1, stage: "Pre-filing" },
    { ordinal: 2, title: "Novelty search report",           titleAr: "تقرير بحث الجدة",                expectedKind: "Novelty Search",        stepOrdinal: 2, stage: "Pre-filing" },
    { ordinal: 3, title: "Patentability opinion",           titleAr: "رأي قابلية التسجيل",             expectedKind: "Opinion",               stepOrdinal: 3, stage: "Pre-filing" },
    { ordinal: 4, title: "Priority application",            titleAr: "طلب الأولوية",                   expectedKind: "Patent Application",    stepOrdinal: 4, stage: "Filing" },
    { ordinal: 5, title: "PCT international application",   titleAr: "طلب PCT الدولي",                 expectedKind: "PCT Application",       stepOrdinal: 7, stage: "International", required: false },
    { ordinal: 6, title: "National-phase applications",     titleAr: "طلبات المرحلة الوطنية",           expectedKind: "National Phase Filing", stepOrdinal: 8, stage: "Nationalisation" },
    { ordinal: 7, title: "Office-action responses",         titleAr: "ردود على الفحص",                  expectedKind: "Office Action",         stepOrdinal: 9, stage: "Prosecution" },
    { ordinal: 8, title: "Grant certificate",               titleAr: "شهادة المنح",                     expectedKind: "Grant Certificate",     stepOrdinal: 10, stage: "Grant" },
  ],
};

// ────────────────────────────────────────────────────────────────────
// 6. Litigation — multi-jurisdiction (UAE Civil / KSA Diwan / DIFC / ADGM)
// ────────────────────────────────────────────────────────────────────
const PACK_LITIGATION: PackDef = {
  kind: "dispute_litigation",
  title: "Litigation — civil claim (GCC)",
  titleAr: "تقاضي — دعوى مدنية (الخليج)",
  description: "Civil litigation lifecycle: pre-action demand, statement of claim, service, discovery, witness statements, hearings, judgement, enforcement / appeal. Applies to UAE Civil Courts, KSA Diwan al-Mazalim, DIFC Courts, ADGM Courts.",
  region: "GLOBAL",
  jurisdiction: null,
  language: "en",
  expectedDurationDays: 540,
  defaultFeeModel: "hourly",
  steps: [
    { ordinal: 1, name: "Pre-action case assessment",      nameAr: "تقييم الدعوى قبل الإجراء",        ownerRole: "partner",   expectedDurationDays: 7,  isMilestone: true },
    { ordinal: 2, name: "Demand / pre-action letter",       nameAr: "خطاب المطالبة",                   ownerRole: "lawyer",    expectedDurationDays: 7,  dependsOnOrdinals: [1] },
    { ordinal: 3, name: "Statement of claim drafting",      nameAr: "صياغة لائحة الدعوى",              ownerRole: "lawyer",    expectedDurationDays: 14, dependsOnOrdinals: [2] },
    { ordinal: 4, name: "Court filing + service",           nameAr: "الإيداع في المحكمة والإعلان",     ownerRole: "lawyer",    expectedDurationDays: 14, dependsOnOrdinals: [3], isMilestone: true },
    { ordinal: 5, name: "Defendant's response",             nameAr: "رد المدعى عليه",                  ownerRole: "client",    expectedDurationDays: 30, dependsOnOrdinals: [4] },
    { ordinal: 6, name: "Discovery / disclosure",           nameAr: "الاكتشاف / الإفصاح",              ownerRole: "associate", expectedDurationDays: 60, dependsOnOrdinals: [5] },
    { ordinal: 7, name: "Witness statements + expert reports", nameAr: "شهادات الشهود وتقارير الخبراء", ownerRole: "associate", expectedDurationDays: 60, dependsOnOrdinals: [6] },
    { ordinal: 8, name: "Hearing(s)",                       nameAr: "الجلسات",                          ownerRole: "partner",   expectedDurationDays: 30, dependsOnOrdinals: [7], isMilestone: true },
    { ordinal: 9, name: "Judgement",                        nameAr: "الحكم",                            ownerRole: "partner",   expectedDurationDays: 60, dependsOnOrdinals: [8], isMilestone: true },
    { ordinal:10, name: "Enforcement",                      nameAr: "التنفيذ",                          ownerRole: "lawyer",    expectedDurationDays: 90, dependsOnOrdinals: [9] },
    { ordinal:11, name: "Appeal (if elected)",              nameAr: "الاستئناف إن اختير",               ownerRole: "partner",   expectedDurationDays: 180, dependsOnOrdinals: [9], optional: true },
  ],
  slots: [
    { ordinal: 1, title: "Case assessment memo",            titleAr: "مذكرة تقييم الدعوى",             expectedKind: "Case Memo",             stepOrdinal: 1, stage: "Pre-action" },
    { ordinal: 2, title: "Demand letter",                   titleAr: "خطاب المطالبة",                  expectedKind: "Demand Letter",         stepOrdinal: 2, stage: "Pre-action" },
    { ordinal: 3, title: "Statement of claim",              titleAr: "لائحة الدعوى",                   expectedKind: "Statement of Claim",    stepOrdinal: 3, stage: "Pleadings" },
    { ordinal: 4, title: "Defense",                         titleAr: "مذكرة الدفاع",                    expectedKind: "Defense",               stepOrdinal: 5, stage: "Pleadings" },
    { ordinal: 5, title: "Disclosure list",                 titleAr: "قائمة الإفصاح",                  expectedKind: "Disclosure",            stepOrdinal: 6, stage: "Discovery" },
    { ordinal: 6, title: "Witness statements",              titleAr: "شهادات الشهود",                  expectedKind: "Witness Statement",     stepOrdinal: 7, stage: "Evidence" },
    { ordinal: 7, title: "Hearing bundle",                  titleAr: "حزمة الجلسة",                    expectedKind: "Hearing Bundle",        stepOrdinal: 8, stage: "Trial" },
    { ordinal: 8, title: "Judgement",                       titleAr: "الحكم",                           expectedKind: "Judgement",             stepOrdinal: 9, stage: "Outcome" },
    { ordinal: 9, title: "Enforcement application",         titleAr: "طلب التنفيذ",                     expectedKind: "Enforcement",           stepOrdinal: 10, stage: "Post-judgement" },
  ],
};

// ────────────────────────────────────────────────────────────────────
// 7. Employment dispute — UAE MoHRE + KSA MoL
// ────────────────────────────────────────────────────────────────────
const PACK_EMPLOYMENT: PackDef = {
  kind: "employment_matter",
  title: "Employment dispute — UAE MoHRE / KSA MoL",
  titleAr: "نزاع عمالي — وزارة الموارد البشرية الإماراتية / السعودية",
  description: "Workplace dispute through statutory conciliation and tribunal: grievance, MoHRE/MoL conciliation request, conciliation outcome, court referral, tribunal hearing, judgement, enforcement.",
  region: "GLOBAL",
  jurisdiction: null,
  language: "en",
  expectedDurationDays: 180,
  defaultFeeModel: "fixed",
  steps: [
    { ordinal: 1, name: "Initial fact-finding + advice",     nameAr: "تقصي الحقائق والاستشارة الأولية", ownerRole: "partner",   expectedDurationDays: 5,  isMilestone: true },
    { ordinal: 2, name: "Internal grievance / demand",        nameAr: "تظلم داخلي / مطالبة",            ownerRole: "lawyer",    expectedDurationDays: 14, dependsOnOrdinals: [1] },
    { ordinal: 3, name: "MoHRE / MoL conciliation request",   nameAr: "طلب التسوية الودية لدى الوزارة", ownerRole: "lawyer",    expectedDurationDays: 7,  dependsOnOrdinals: [2], isMilestone: true },
    { ordinal: 4, name: "Conciliation hearing",               nameAr: "جلسة التسوية الودية",            ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [3] },
    { ordinal: 5, name: "Settlement agreement (if reached)",  nameAr: "اتفاقية تسوية إن وُجدت",         ownerRole: "lawyer",    expectedDurationDays: 7,  dependsOnOrdinals: [4], optional: true },
    { ordinal: 6, name: "Referral to court / tribunal",       nameAr: "إحالة إلى المحكمة العمالية",     ownerRole: "lawyer",    expectedDurationDays: 14, dependsOnOrdinals: [4] },
    { ordinal: 7, name: "Tribunal hearing(s)",                nameAr: "جلسات المحكمة",                  ownerRole: "partner",   expectedDurationDays: 60, dependsOnOrdinals: [6], isMilestone: true },
    { ordinal: 8, name: "Judgement",                          nameAr: "الحكم",                           ownerRole: "partner",   expectedDurationDays: 30, dependsOnOrdinals: [7], isMilestone: true },
    { ordinal: 9, name: "Enforcement / appeal",               nameAr: "التنفيذ أو الاستئناف",            ownerRole: "lawyer",    expectedDurationDays: 60, dependsOnOrdinals: [8] },
  ],
  slots: [
    { ordinal: 1, title: "Fact-finding memo",                 titleAr: "مذكرة تقصي الحقائق",            expectedKind: "Case Memo",             stepOrdinal: 1, stage: "Pre-action" },
    { ordinal: 2, title: "Internal grievance letter",         titleAr: "خطاب التظلم الداخلي",           expectedKind: "Grievance Letter",      stepOrdinal: 2, stage: "Pre-action" },
    { ordinal: 3, title: "MoHRE / MoL conciliation request",  titleAr: "طلب التسوية الودية",            expectedKind: "Conciliation Request",  stepOrdinal: 3, stage: "Conciliation" },
    { ordinal: 4, title: "Conciliation outcome",              titleAr: "محضر التسوية",                  expectedKind: "Conciliation Minutes",  stepOrdinal: 4, stage: "Conciliation" },
    { ordinal: 5, title: "Settlement agreement",              titleAr: "اتفاقية التسوية",                expectedKind: "Settlement Agreement",  stepOrdinal: 5, stage: "Settlement", required: false },
    { ordinal: 6, title: "Statement of claim (tribunal)",     titleAr: "لائحة الدعوى",                   expectedKind: "Statement of Claim",    stepOrdinal: 6, stage: "Tribunal" },
    { ordinal: 7, title: "Witness statements",                titleAr: "شهادات الشهود",                 expectedKind: "Witness Statement",     stepOrdinal: 7, stage: "Tribunal" },
    { ordinal: 8, title: "Tribunal judgement",                titleAr: "حكم المحكمة",                    expectedKind: "Judgement",             stepOrdinal: 8, stage: "Outcome" },
  ],
};

// ────────────────────────────────────────────────────────────────────
// 8. Fund launch — ADGM RFL / QIF, DIFC QIF, Cayman feeder
// ────────────────────────────────────────────────────────────────────
const PACK_FUND_LAUNCH: PackDef = {
  kind: "fundraising_round",
  title: "Fund launch — ADGM / DIFC / Cayman",
  titleAr: "إطلاق صندوق — أبوظبي العالمية / دبي المالي / كايمان",
  description: "Investment fund launch: structure decision (ADGM RFL/QIF, DIFC QIF, Cayman feeder), regulator approval, constitutional documents, service-provider engagement, investor onboarding, first close.",
  region: "GLOBAL",
  jurisdiction: null,
  language: "en",
  expectedDurationDays: 180,
  defaultFeeModel: "fixed",
  steps: [
    { ordinal: 1,  name: "Structure decision",                 nameAr: "قرار الهيكلة",                     ownerRole: "partner",   expectedDurationDays: 14, isMilestone: true },
    { ordinal: 2,  name: "Tax + AML structuring memo",         nameAr: "مذكرة الهيكلة الضريبية ومكافحة غسل الأموال", ownerRole: "associate", expectedDurationDays: 14, dependsOnOrdinals: [1] },
    { ordinal: 3,  name: "Regulator application (FSRA/DFSA/CIMA)", nameAr: "طلب الجهة المنظمة",          ownerRole: "lawyer",    expectedDurationDays: 60, dependsOnOrdinals: [2], isMilestone: true },
    { ordinal: 4,  name: "Constitutional documents (LPA / Articles)", nameAr: "الوثائق التأسيسية",       ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [2] },
    { ordinal: 5,  name: "Private placement memorandum (PPM)", nameAr: "نشرة الطرح الخاص",                ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [4] },
    { ordinal: 6,  name: "Service providers (admin / custodian / auditor)", nameAr: "مزودو الخدمة",       ownerRole: "associate", expectedDurationDays: 30, dependsOnOrdinals: [3] },
    { ordinal: 7,  name: "Investor subscription docs + KYC",   nameAr: "وثائق الاكتتاب وKYC للمستثمرين",  ownerRole: "lawyer",    expectedDurationDays: 30, dependsOnOrdinals: [5] },
    { ordinal: 8,  name: "First close",                         nameAr: "الإغلاق الأول",                    ownerRole: "partner",   expectedDurationDays: 7,  dependsOnOrdinals: [6, 7], isMilestone: true },
    { ordinal: 9,  name: "Ongoing regulator + investor reporting", nameAr: "التقارير المستمرة",            ownerRole: "associate", expectedDurationDays: 365, dependsOnOrdinals: [8] },
  ],
  slots: [
    { ordinal: 1, title: "Structure memo",                       titleAr: "مذكرة الهيكلة",                expectedKind: "Structure Memo",        stepOrdinal: 1, stage: "Pre-launch" },
    { ordinal: 2, title: "Tax + AML structuring memo",           titleAr: "مذكرة الضريبة ومكافحة الغسل",  expectedKind: "Tax Memo",              stepOrdinal: 2, stage: "Pre-launch" },
    { ordinal: 3, title: "Regulator application (FSRA/DFSA/CIMA)", titleAr: "طلب الجهة المنظمة",          expectedKind: "Regulator Filing",      stepOrdinal: 3, stage: "Regulator" },
    { ordinal: 4, title: "LPA / Articles of association",         titleAr: "اتفاقية شراكة محدودة / النظام", expectedKind: "Constitutional Doc",    stepOrdinal: 4, stage: "Documents" },
    { ordinal: 5, title: "PPM (private placement memorandum)",    titleAr: "نشرة الطرح الخاص",            expectedKind: "PPM",                   stepOrdinal: 5, stage: "Documents" },
    { ordinal: 6, title: "Service-provider engagements",          titleAr: "تكليفات مزودي الخدمة",        expectedKind: "Engagement Letter",     stepOrdinal: 6, stage: "Operations" },
    { ordinal: 7, title: "Subscription pack",                     titleAr: "حزمة الاكتتاب",                expectedKind: "Subscription Docs",     stepOrdinal: 7, stage: "Onboarding" },
    { ordinal: 8, title: "KYC / AML pack",                        titleAr: "حزمة KYC",                     expectedKind: "KYC Pack",              stepOrdinal: 7, stage: "Onboarding" },
    { ordinal: 9, title: "First-close notice",                    titleAr: "إعلان الإغلاق الأول",          expectedKind: "Closing Notice",        stepOrdinal: 8, stage: "Closing" },
  ],
};

export const PROCESS_PACKS: PackDef[] = [
  PACK_MA_BUYSIDE,
  PACK_MA_SELLSIDE,
  PACK_IPO_ADX,
  PACK_IPO_NASDAQ_DUBAI,
  PACK_PATENT_FILING,
  PACK_LITIGATION,
  PACK_EMPLOYMENT,
  PACK_FUND_LAUNCH,
];

/** Insert all packs into the platform global library (tenantId = null).
 *  Idempotent — skips packs that already exist by (kind, title, jurisdiction). */
export async function seedProcessPacks(db: typeof DbClient): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0, skipped = 0;

  for (const pack of PROCESS_PACKS) {
    // Idempotency check.
    const existing = await db
      .select({ id: s.processes.id })
      .from(s.processes)
      .where(and(
        isNull(s.processes.tenantId),
        eq(s.processes.kind, pack.kind),
        eq(s.processes.title, pack.title),
        pack.jurisdiction ? eq(s.processes.jurisdiction, pack.jurisdiction) : isNull(s.processes.jurisdiction),
      ))
      .limit(1);
    if (existing.length > 0) { skipped++; continue; }

    // Insert process.
    const [proc] = await db.insert(s.processes).values({
      tenantId: null,
      kind: pack.kind,
      title: pack.title,
      titleAr: pack.titleAr,
      description: pack.description,
      region: pack.region,
      jurisdiction: pack.jurisdiction,
      language: pack.language,
      defaultFeeModel: pack.defaultFeeModel,
      expectedDurationDays: pack.expectedDurationDays,
      version: 1,
      isCurrent: true,
      active: true,
    }).returning({ id: s.processes.id });

    // Insert steps; collect (ordinal → id) map for slot linking.
    const stepIdByOrdinal = new Map<number, string>();
    for (const step of pack.steps) {
      const [row] = await db.insert(s.processSteps).values({
        processId: proc.id,
        ordinal: step.ordinal,
        name: step.name,
        nameAr: step.nameAr,
        dependsOnOrdinals: step.dependsOnOrdinals ?? [],
        ownerRole: step.ownerRole,
        expectedDurationDays: step.expectedDurationDays,
        isMilestone: step.isMilestone ?? false,
        optional: step.optional ?? false,
      }).returning({ id: s.processSteps.id });
      stepIdByOrdinal.set(step.ordinal, row.id);
    }

    // Insert slots (link each to its step).
    for (const slot of pack.slots) {
      await db.insert(s.processDocumentSlots).values({
        processId: proc.id,
        stepId: stepIdByOrdinal.get(slot.stepOrdinal) ?? null,
        ordinal: slot.ordinal,
        title: slot.title,
        titleAr: slot.titleAr,
        expectedKind: slot.expectedKind,
        required: slot.required ?? true,
        stage: slot.stage,
      });
    }

    inserted++;
  }

  return { inserted, skipped };
}
