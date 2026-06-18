/**
 * KSA Go-Public (Tadawul / CMA) process pack.
 *
 * Captures how good corporate work is done for a Saudi IPO: ordered
 * workstream steps, the required document set, jurisdiction-specific timing,
 * and the external-dependency waits the delay engine should flag (CMA
 * pre-clearance, bookbuilding window, Tadawul listing approval).
 *
 * Authored as data so the seed script (and any future "fork to firm library"
 * UX) can consume the same definition. Bilingual EN + AR titles throughout —
 * a KSA matter must instantiate the document set in either language.
 */

export type KsaStepDef = {
  ordinal: number;
  name: string;
  nameAr: string;
  ownerRole: "partner" | "lawyer" | "assistant" | "client";
  expectedDurationDays: number;
  /** External dependency that the delay engine should flag as a wait. */
  externalDependency?: "CMA" | "TADAWUL" | "ZATCA" | "Underwriters" | "Auditors";
  isMilestone?: boolean;
};

export const KSA_GO_PUBLIC_STEPS: KsaStepDef[] = [
  { ordinal: 1,  name: "Engagement & kick-off",            nameAr: "التعاقد وانطلاق العمل",            ownerRole: "partner",   expectedDurationDays: 5 },
  { ordinal: 2,  name: "Due diligence & data room",        nameAr: "العناية الواجبة وغرفة البيانات",   ownerRole: "lawyer",    expectedDurationDays: 30 },
  { ordinal: 3,  name: "Corporate housekeeping",           nameAr: "ترتيب الحوكمة الداخلية",           ownerRole: "lawyer",    expectedDurationDays: 21 },
  { ordinal: 4,  name: "Prospectus drafting",              nameAr: "إعداد نشرة الإصدار",               ownerRole: "partner",   expectedDurationDays: 45, isMilestone: true },
  { ordinal: 5,  name: "Auditor sign-off",                 nameAr: "مصادقة المراجع الخارجي",           ownerRole: "client",    expectedDurationDays: 21, externalDependency: "Auditors" },
  { ordinal: 6,  name: "CMA application & pre-clearance",  nameAr: "ملف هيئة السوق المالية والتصفية",  ownerRole: "partner",   expectedDurationDays: 60, externalDependency: "CMA", isMilestone: true },
  { ordinal: 7,  name: "Underwriting agreement",           nameAr: "اتفاقية التغطية",                  ownerRole: "lawyer",    expectedDurationDays: 14, externalDependency: "Underwriters" },
  { ordinal: 8,  name: "Roadshow & bookbuilding",          nameAr: "الجولة الترويجية وبناء الأوامر",   ownerRole: "client",    expectedDurationDays: 21 },
  { ordinal: 9,  name: "Allocation & price fixing",        nameAr: "التخصيص وتحديد السعر",             ownerRole: "partner",   expectedDurationDays: 5,  isMilestone: true },
  { ordinal: 10, name: "Tadawul listing approval",         nameAr: "موافقة الإدراج في تداول",           ownerRole: "partner",   expectedDurationDays: 14, externalDependency: "TADAWUL" },
  { ordinal: 11, name: "Listing day & first-day trading",  nameAr: "يوم الإدراج وأول جلسة تداول",       ownerRole: "client",    expectedDurationDays: 1,  isMilestone: true },
  { ordinal: 12, name: "Post-listing reporting setup",     nameAr: "ضبط الإفصاحات بعد الإدراج",        ownerRole: "lawyer",    expectedDurationDays: 14 },
];

export type KsaSlotDef = {
  ordinal: number;
  title: string;
  titleAr: string;
  expectedKind: string;
  stage: "Pre-filing" | "Filing" | "Marketing" | "Listing" | "Post-listing";
  required: boolean;
  stepOrdinal: number;
};

export const KSA_GO_PUBLIC_SLOTS: KsaSlotDef[] = [
  { ordinal: 1,  title: "Engagement Letter",                          titleAr: "خطاب التعاقد",                      expectedKind: "Engagement",        stage: "Pre-filing",  required: true,  stepOrdinal: 1 },
  { ordinal: 2,  title: "Due Diligence Report",                       titleAr: "تقرير العناية الواجبة",             expectedKind: "Report",            stage: "Pre-filing",  required: true,  stepOrdinal: 2 },
  { ordinal: 3,  title: "Corporate Restructuring Resolutions",        titleAr: "قرارات إعادة الهيكلة المؤسسية",     expectedKind: "Board Resolution",  stage: "Pre-filing",  required: true,  stepOrdinal: 3 },
  { ordinal: 4,  title: "Articles of Association (amended)",          titleAr: "النظام الأساسي (المُعدَّل)",         expectedKind: "AOA",               stage: "Pre-filing",  required: true,  stepOrdinal: 3 },
  { ordinal: 5,  title: "Prospectus — English",                       titleAr: "نشرة الإصدار — الإنجليزية",          expectedKind: "Prospectus",        stage: "Filing",      required: true,  stepOrdinal: 4 },
  { ordinal: 6,  title: "Prospectus — Arabic",                        titleAr: "نشرة الإصدار — العربية",             expectedKind: "Prospectus",        stage: "Filing",      required: true,  stepOrdinal: 4 },
  { ordinal: 7,  title: "Auditor's Comfort Letter",                   titleAr: "خطاب الراحة من المراجع",            expectedKind: "Letter",            stage: "Filing",      required: true,  stepOrdinal: 5 },
  { ordinal: 8,  title: "Fairness Opinion",                           titleAr: "رأي العدالة",                       expectedKind: "Opinion",           stage: "Filing",      required: true,  stepOrdinal: 5 },
  { ordinal: 9,  title: "CMA Application Pack",                       titleAr: "ملف طلب هيئة السوق المالية",        expectedKind: "Filing",            stage: "Filing",      required: true,  stepOrdinal: 6 },
  { ordinal: 10, title: "Underwriting Agreement",                     titleAr: "اتفاقية التغطية",                   expectedKind: "Agreement",         stage: "Filing",      required: true,  stepOrdinal: 7 },
  { ordinal: 11, title: "Subscription Agreement",                     titleAr: "اتفاقية الاكتتاب",                  expectedKind: "Agreement",         stage: "Marketing",   required: true,  stepOrdinal: 7 },
  { ordinal: 12, title: "Roadshow Pack",                              titleAr: "ملف الجولة الترويجية",              expectedKind: "Marketing Pack",    stage: "Marketing",   required: true,  stepOrdinal: 8 },
  { ordinal: 13, title: "Allocation Schedule",                        titleAr: "جدول التخصيص",                      expectedKind: "Schedule",          stage: "Marketing",   required: true,  stepOrdinal: 9 },
  { ordinal: 14, title: "Final Pricing Notice",                       titleAr: "إعلان السعر النهائي",               expectedKind: "Notice",            stage: "Marketing",   required: true,  stepOrdinal: 9 },
  { ordinal: 15, title: "Tadawul Listing Application",                titleAr: "طلب الإدراج في تداول",              expectedKind: "Filing",            stage: "Listing",     required: true,  stepOrdinal: 10 },
  { ordinal: 16, title: "Listing Agreement (Tadawul)",                titleAr: "اتفاقية الإدراج (تداول)",            expectedKind: "Agreement",         stage: "Listing",     required: true,  stepOrdinal: 10 },
  { ordinal: 17, title: "Post-Listing Disclosure Calendar",           titleAr: "تقويم الإفصاحات بعد الإدراج",       expectedKind: "Calendar",          stage: "Post-listing",required: true,  stepOrdinal: 12 },
  { ordinal: 18, title: "Insider Trading Policy",                     titleAr: "سياسة تداول المطّلعين",              expectedKind: "Policy",            stage: "Post-listing",required: false, stepOrdinal: 12 },
];

export const KSA_GO_PUBLIC_META = {
  kind: "go_public" as const,
  title: "KSA Go-Public (Tadawul / CMA)",
  titleAr: "الطرح العام في المملكة العربية السعودية",
  region: "KSA" as const,
  jurisdiction: "MISA / CMA",
  defaultFeeModel: "milestone",
  expectedDurationDays: 240,
  language: "en", // matter language is chosen per-instance; this is the catalogue default
};
