/**
 * GCC legal glossary — drives the <Term> hover tooltips in coaching mode.
 *
 * Each entry has a canonical id, a label shown to the user, and a definition
 * in both English and Arabic. Aliases let the same definition fire for
 * "ADGM" and "Abu Dhabi Global Market", etc. Keep definitions short — one
 * crisp sentence + a "watch out for" line when there is a common pitfall.
 */
export type GlossaryEntry = {
  id: string;
  /** What the underlined label says when the term is rendered. */
  label: { en: string; ar: string };
  /** Aliases the matcher will recognise (case-insensitive). */
  aliases: string[];
  /** One-sentence definition. */
  definition: { en: string; ar: string };
  /** Optional pitfall — surfaces as a small "Watch out:" line in the popover. */
  pitfall?: { en: string; ar: string };
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: "adgm",
    label: { en: "ADGM", ar: "أبوظبي العالمي" },
    aliases: ["ADGM", "Abu Dhabi Global Market"],
    definition: {
      en: "Abu Dhabi Global Market — an English common-law financial free zone with its own courts and registrar.",
      ar: "سوق أبوظبي العالمي — منطقة مالية حرة تطبّق نظام القانون العام الإنجليزي ولها محاكمها وسجلّها الخاص.",
    },
    pitfall: {
      en: "ADGM filings can't be cross-filed at DIFC — verify the registrar matches the entity.",
      ar: "إيداعات ADGM لا تُقبل في مركز دبي المالي — تحقّق أن السجل المختص يطابق الكيان.",
    },
  },
  {
    id: "difc",
    label: { en: "DIFC", ar: "مركز دبي المالي" },
    aliases: ["DIFC", "Dubai International Financial Centre"],
    definition: {
      en: "Dubai International Financial Centre — common-law free zone in Dubai with the DIFC Courts and an independent registrar.",
      ar: "مركز دبي المالي العالمي — منطقة حرة بنظام القانون العام تتبع محاكم المركز وسجلاً مستقلاً.",
    },
  },
  {
    id: "dmcc",
    label: { en: "DMCC", ar: "مركز دبي للسلع المتعددة" },
    aliases: ["DMCC", "Dubai Multi Commodities Centre"],
    definition: {
      en: "Dubai Multi Commodities Centre — a commercial free zone for trading, services and SPVs.",
      ar: "مركز دبي للسلع المتعددة — منطقة حرة تجارية للتداول والخدمات والشركات ذات الغرض الخاص.",
    },
  },
  {
    id: "misa",
    label: { en: "MISA", ar: "وزارة الاستثمار السعودية" },
    aliases: ["MISA", "Ministry of Investment of Saudi Arabia", "SAGIA"],
    definition: {
      en: "Ministry of Investment of Saudi Arabia — issues the foreign-investment licence required to incorporate a KSA entity with non-Saudi shareholders.",
      ar: "وزارة الاستثمار السعودية — تُصدر ترخيص الاستثمار الأجنبي اللازم لتأسيس كيان سعودي بمساهمين غير سعوديين.",
    },
  },
  {
    id: "cma",
    label: { en: "CMA", ar: "هيئة السوق المالية" },
    aliases: ["CMA", "Capital Market Authority"],
    definition: {
      en: "Capital Market Authority — Saudi Arabia's securities regulator (IPOs, prospectuses, listed-company conduct).",
      ar: "هيئة السوق المالية — الجهة المنظِّمة للأوراق المالية في السعودية (الإدراجات، نشرات الإصدار، سلوك الشركات المدرَجة).",
    },
  },
  {
    id: "zatca",
    label: { en: "ZATCA", ar: "هيئة الزكاة والضريبة" },
    aliases: ["ZATCA", "Zakat, Tax and Customs Authority"],
    definition: {
      en: "Saudi Zakat, Tax and Customs Authority — handles VAT, corporate income tax, zakat and e-invoicing (Fatoora).",
      ar: "هيئة الزكاة والضريبة والجمارك — تُعنى بضريبة القيمة المضافة والضريبة على الدخل والزكاة والفوترة الإلكترونية (فاتورة).",
    },
  },
  {
    id: "kyc",
    label: { en: "KYC", ar: "تعريف العميل" },
    aliases: ["KYC", "Know Your Customer", "Know-Your-Customer"],
    definition: {
      en: "Know Your Customer — verification of a client's identity, source of funds and ownership chain before engagement.",
      ar: "إجراءات «اعرف عميلك» — التحقّق من هوية العميل ومصدر أمواله وسلسلة الملكية قبل التعاقد.",
    },
    pitfall: {
      en: "Stale KYC (>12 months) is a common audit finding — refresh on every new matter.",
      ar: "تجاوز عمر بيانات KYC لـ 12 شهراً ملاحظة شائعة في التدقيق — جدّدها مع كل قضية جديدة.",
    },
  },
  {
    id: "ubo",
    label: { en: "UBO", ar: "المستفيد الحقيقي" },
    aliases: ["UBO", "Ultimate Beneficial Owner", "Beneficial Owner"],
    definition: {
      en: "Ultimate Beneficial Owner — the natural person who ultimately owns or controls a legal entity (typically ≥25% threshold in the UAE & KSA).",
      ar: "المستفيد الحقيقي — الشخص الطبيعي الذي يملك أو يسيطر فعلياً على الكيان (عادةً ≥25٪ في الإمارات والسعودية).",
    },
    pitfall: {
      en: "Indirect ownership through nominees or trusts still counts — trace the chain to a natural person.",
      ar: "الملكية غير المباشرة عبر وكلاء أو صناديق تُحتسب أيضاً — تتبّع السلسلة حتى الشخص الطبيعي.",
    },
  },
  {
    id: "esr",
    label: { en: "ESR", ar: "متطلبات الجوهر الاقتصادي" },
    aliases: ["ESR", "Economic Substance Regulations"],
    definition: {
      en: "Economic Substance Regulations — UAE rules requiring relevant entities to demonstrate real economic activity in the UAE.",
      ar: "أنظمة الجوهر الاقتصادي — قواعد إماراتية تُلزم الكيانات المعنية بإثبات نشاط اقتصادي فعلي داخل الدولة.",
    },
  },
  {
    id: "moa",
    label: { en: "MOA", ar: "عقد التأسيس" },
    aliases: ["MOA", "Memorandum of Association"],
    definition: {
      en: "Memorandum of Association — the founding document setting out an entity's name, objects, capital and shareholder structure.",
      ar: "عقد التأسيس — الوثيقة المؤسسة التي تحدد اسم الكيان وأغراضه ورأسماله وهيكل المساهمين.",
    },
  },
  {
    id: "aoa",
    label: { en: "AOA", ar: "النظام الأساسي" },
    aliases: ["AOA", "Articles of Association"],
    definition: {
      en: "Articles of Association — the rules governing the internal management of a company (board, voting, share transfers).",
      ar: "النظام الأساسي — القواعد التي تنظم الإدارة الداخلية للشركة (المجلس، التصويت، نقل الأسهم).",
    },
  },
  {
    id: "sha",
    label: { en: "SHA", ar: "اتفاقية المساهمين" },
    aliases: ["SHA", "Shareholders Agreement", "Shareholders' Agreement"],
    definition: {
      en: "Shareholders' Agreement — contract among shareholders covering governance, transfer restrictions, exit rights and protective provisions.",
      ar: "اتفاقية المساهمين — عقد بين المساهمين يغطي الحوكمة وقيود النقل وحقوق الخروج والأحكام الحمائية.",
    },
  },
  {
    id: "spa",
    label: { en: "SPA", ar: "اتفاقية البيع والشراء" },
    aliases: ["SPA", "Share Purchase Agreement", "Sale and Purchase Agreement"],
    definition: {
      en: "Share Purchase Agreement — the principal sale document in an M&A or secondary transaction.",
      ar: "اتفاقية بيع وشراء الأسهم — الوثيقة الرئيسة للبيع في صفقات الاندماج والاستحواذ أو الصفقات الثانوية.",
    },
  },
  {
    id: "nda",
    label: { en: "NDA", ar: "اتفاقية السرية" },
    aliases: ["NDA", "Non-Disclosure Agreement", "Confidentiality Agreement"],
    definition: {
      en: "Non-Disclosure Agreement — mutual or one-way confidentiality undertaking signed before sharing sensitive information.",
      ar: "اتفاقية عدم الإفصاح — تعهّد سرية متبادل أو أحادي يوقَّع قبل تبادل المعلومات الحساسة.",
    },
  },
  {
    id: "jv",
    label: { en: "JV", ar: "مشروع مشترك" },
    aliases: ["JV", "Joint Venture"],
    definition: {
      en: "Joint Venture — a structure where two or more parties pool resources for a defined commercial purpose, usually via a newly formed entity.",
      ar: "المشروع المشترك — هيكل يجمع طرفين أو أكثر لتحقيق غرض تجاري محدد، غالباً عبر كيان جديد.",
    },
  },
  {
    id: "drag_along",
    label: { en: "drag-along", ar: "حق الإلزام بالبيع" },
    aliases: ["drag-along", "drag along"],
    definition: {
      en: "Drag-along right — lets majority shareholders force minority shareholders to join a sale on the same terms.",
      ar: "حق الإلزام بالبيع — يخوّل الأغلبية إلزام الأقلية بالانضمام إلى عملية بيع بنفس الشروط.",
    },
  },
  {
    id: "tag_along",
    label: { en: "tag-along", ar: "حق المشاركة في البيع" },
    aliases: ["tag-along", "tag along"],
    definition: {
      en: "Tag-along right — lets minority shareholders join a sale by the majority on the same per-share terms.",
      ar: "حق المشاركة في البيع — يخوّل الأقلية الانضمام إلى عملية بيع الأغلبية بنفس الشروط للسهم الواحد.",
    },
  },
  {
    id: "rofr",
    label: { en: "ROFR", ar: "حق الشفعة" },
    aliases: ["ROFR", "right of first refusal", "Right of First Refusal"],
    definition: {
      en: "Right of First Refusal — the right to match a third-party offer before the seller can accept it.",
      ar: "حق الأولوية في الرفض — الحق في مطابقة عرض طرف ثالث قبل أن يقبله البائع.",
    },
  },
  {
    id: "sharia",
    label: { en: "Sharia-compliant", ar: "متوافق مع الشريعة" },
    aliases: ["Sharia-compliant", "Shariah-compliant", "Sharia compliant"],
    definition: {
      en: "A structure or instrument that complies with Islamic-finance principles (no interest, no excessive uncertainty, asset-backed where required).",
      ar: "هيكل أو أداة تتوافق مع مبادئ التمويل الإسلامي (لا فائدة، لا غرر مفرط، مع تغطية بالأصول حيث يلزم).",
    },
  },
  {
    id: "tadawul",
    label: { en: "Tadawul", ar: "تداول" },
    aliases: ["Tadawul"],
    definition: {
      en: "The Saudi Stock Exchange — venue for the Main Market and Nomu (parallel market) listings.",
      ar: "تداول — السوق المالية السعودية، مقرّ الإدراج في السوق الرئيسية وموازي (نمو).",
    },
  },
];

const INDEX: Map<string, GlossaryEntry> = (() => {
  const m = new Map<string, GlossaryEntry>();
  for (const e of GLOSSARY) {
    for (const a of e.aliases) m.set(a.toLowerCase(), e);
  }
  return m;
})();

export function findTerm(input: string): GlossaryEntry | undefined {
  return INDEX.get(input.trim().toLowerCase());
}
