/**
 * Per-step coaching: why this slot exists, common mistakes, what to do next.
 *
 * Keyed off the slot's `expectedKind` (NDA, MOA, AOA, KYC, …) and falls back
 * to a generic explainer. Authored by senior corporate lawyers so juniors see
 * the same advice they'd get at the partner's elbow. EN + AR.
 */
export type StepCoaching = {
  why: { en: string; ar: string };
  mistakes: Array<{ en: string; ar: string }>;
  next: { en: string; ar: string };
};

const BY_KIND: Record<string, StepCoaching> = {
  Engagement: {
    why: {
      en: "Defines the scope, fee model and conflicts position. Without it signed, no privileged work should begin.",
      ar: "تُحدّد نطاق العمل ونموذج الأتعاب وموقف التعارض. لا يبدأ العمل المتميّز قبل توقيعها.",
    },
    mistakes: [
      { en: "Forgetting to list the legal entity exactly as registered — registrars reject mismatched names.", ar: "إغفال إدراج اسم الكيان كما هو في السجل — تُرفض الإيداعات بسبب التطابق غير الدقيق." },
      { en: "Leaving the fee arrangement vague — leads to disputes later.", ar: "ترك ترتيب الأتعاب غامضاً — يقود لخلافات لاحقة." },
    ],
    next: {
      en: "Once countersigned, file it to the matter and open the KYC slot.",
      ar: "بعد التوقيع المتبادل، أودِعها في القضية وافتح خانة «اعرف عميلك».",
    },
  },
  KYC: {
    why: {
      en: "Verifies the client's identity, source of funds and ultimate beneficial owners. Required by AML and audit.",
      ar: "تتحقّق من هوية العميل ومصدر أمواله والمستفيد الحقيقي. مطلوبة لمكافحة غسل الأموال وللتدقيق.",
    },
    mistakes: [
      { en: "Accepting a name alone — always cross-check passport / Emirates ID copies.", ar: "الاكتفاء بالاسم — تحقّق دائماً من صور جواز السفر/الهوية الإماراتية." },
      { en: "Missing the UBO at 25%+ — trace ownership to a natural person.", ar: "إغفال المستفيد الحقيقي عند 25٪+ — تتبّع الملكية حتى الشخص الطبيعي." },
    ],
    next: {
      en: "Attach UBO declarations to the matter, then move to the MOA.",
      ar: "أرفق إقرارات المستفيد الحقيقي بالقضية، ثم انتقل إلى عقد التأسيس.",
    },
  },
  MOA: {
    why: {
      en: "The founding document. Sets the entity's name, objects, share capital and shareholder list — the registrar checks every line.",
      ar: "الوثيقة المؤسسة. تحدد الاسم والأغراض ورأس المال وقائمة المساهمين — السجل يدقّق كل سطر.",
    },
    mistakes: [
      { en: "Currency and authorised capital mismatched between the MOA and the registrar form.", ar: "اختلاف العملة ورأس المال المرخّص بين العقد ونموذج السجل." },
      { en: "Object clauses too narrow — limits what the entity can later do.", ar: "تضييق أغراض النشاط — يحدّ من قدرة الكيان على التوسّع لاحقاً." },
    ],
    next: {
      en: "Send to the lead lawyer for review before any signing block goes in.",
      ar: "أرسلها للمحامي الرئيسي للمراجعة قبل إدراج أي خانة توقيع.",
    },
  },
  AOA: {
    why: {
      en: "The internal rulebook — board composition, voting thresholds, share transfer mechanics. Sets the governance defaults for years.",
      ar: "الكتاب الداخلي للقواعد — تشكيل المجلس وحدود التصويت وآليات نقل الأسهم. يضبط افتراضيات الحوكمة لسنوات.",
    },
    mistakes: [
      { en: "Quorum and voting clauses that contradict the SHA — investors will flag it.", ar: "أحكام النصاب والتصويت تتعارض مع اتفاقية المساهمين — سيرصدها المستثمرون." },
      { en: "Pre-emption rights forgotten — minorities lose protection.", ar: "إغفال حقوق الأفضلية — تضيع حماية الأقلية." },
    ],
    next: {
      en: "Cross-check the AOA against the SHA. Conflicts get resolved by amending one or the other.",
      ar: "قارن النظام الأساسي مع اتفاقية المساهمين. أي تعارض يُسوّى بتعديل إحداهما.",
    },
  },
  SHA: {
    why: {
      en: "The deal economics + protections live here: vesting, drag/tag rights, anti-dilution, board seats, exit waterfall.",
      ar: "اقتصاديات الصفقة وضماناتها هنا: الاستحقاق التدريجي، حقوق الإلزام والمشاركة، الحماية من التخفيف، مقاعد المجلس، شلال الخروج.",
    },
    mistakes: [
      { en: "Drag-along threshold too low — minorities revolt; too high — locks deals.", ar: "حد حق الإلزام بالبيع منخفض جداً — تعترض الأقلية؛ مرتفع جداً — يجمّد الصفقات." },
      { en: "No fallback for deadlocked board votes.", ar: "لا توجد آلية احتياطية لحالة تعادل أصوات المجلس." },
    ],
    next: {
      en: "Negotiate alongside the term sheet; only finalise after both sides ack the cap table.",
      ar: "تفاوض بالتوازي مع كراسة الشروط؛ لا تختمها إلا بعد إقرار الطرفين لجدول رأس المال.",
    },
  },
  "Board Resolution": {
    why: {
      en: "Formal record of a board decision (approve incorporation, issue shares, appoint signatories). Registrars and banks require it.",
      ar: "محضر رسمي لقرار مجلس الإدارة (اعتماد التأسيس، إصدار الأسهم، تعيين المخوّلين). يطلبه السجل والبنوك.",
    },
    mistakes: [
      { en: "Quorum not met — the resolution is void on appeal.", ar: "عدم اكتمال النصاب — يبطل القرار عند الطعن." },
      { en: "Signatory list misaligned with the AOA's authorised representatives.", ar: "قائمة المخوّلين بالتوقيع لا تتطابق مع المخوّلين في النظام الأساسي." },
    ],
    next: {
      en: "Once signed, lodge with the registrar and update the signatory bank file.",
      ar: "بعد التوقيع، أودِعها في السجل وحدّث ملف المخوّلين لدى البنك.",
    },
  },
  Filing: {
    why: {
      en: "The act that creates legal effect with the regulator. Until filed, the matter is paperwork only.",
      ar: "الإجراء الذي يُكسب القرار أثره القانوني أمام الجهة المُنظِّمة. قبل الإيداع، تبقى الأوراق بلا أثر.",
    },
    mistakes: [
      { en: "Missing a regulator-specific schedule — the application is bounced.", ar: "إغفال ملحق مطلوب من الجهة المُنظِّمة — تُعاد الطلبية." },
      { en: "Submitting outside the regulator's business hours window.", ar: "الإيداع خارج ساعات عمل الجهة المُنظِّمة." },
    ],
    next: {
      en: "Track the reference number and chase a confirmation before invoicing.",
      ar: "تابع الرقم المرجعي واطلب التأكيد قبل إصدار الفاتورة.",
    },
  },
  Register: {
    why: {
      en: "Statutory book — register of directors, register of members. Must be kept current or the firm faces fines.",
      ar: "سجل قانوني — سجل المديرين وسجل الأعضاء. يجب تحديثه باستمرار لتفادي الغرامات.",
    },
    mistakes: [
      { en: "Old appointments not crossed out — the register reads as though everyone still serves.", ar: "عدم شطب التعيينات القديمة — يبدو السجل كأن الجميع لا يزالون في مناصبهم." },
    ],
    next: {
      en: "Print and counter-sign the register; archive a PDF to the matter.",
      ar: "اطبع السجل ووقّعه بشكل متبادل؛ احفظ نسخة PDF في القضية.",
    },
  },
  "Share Certificate": {
    why: {
      en: "Evidence of share ownership. Often required for bank account opening and any later transfer.",
      ar: "إثبات ملكية الأسهم. يُطلب غالباً لفتح الحساب البنكي ولأي نقل لاحق.",
    },
    mistakes: [
      { en: "Certificate numbers don't match the share register.", ar: "أرقام الشهادات لا تطابق سجل الأسهم." },
    ],
    next: {
      en: "Hand-deliver originals or send via tracked courier; keep a scanned copy.",
      ar: "سلّم النسخ الأصلية يداً بيد أو عبر شركة شحن متتبَّعة؛ احتفظ بنسخة ممسوحة.",
    },
  },
  "Term Sheet": {
    why: {
      en: "Captures commercial intent before legal drafting starts. Cheap to revise; binding fragments (exclusivity, confidentiality) often included.",
      ar: "تُوثّق النية التجارية قبل بدء الصياغة القانونية. تعديلها سهل؛ غالباً تتضمن بنوداً مُلزِمة (الحصرية، السرية).",
    },
    mistakes: [
      { en: "Treating non-binding sections as binding — read the binding clauses carefully.", ar: "اعتبار الأقسام غير المُلزِمة مُلزِمة — اقرأ البنود المُلزِمة بعناية." },
    ],
    next: {
      en: "Use it as the source of truth for the SHA / SPA draft.",
      ar: "استخدمها مصدراً مرجعياً لمسودة اتفاقية المساهمين أو البيع والشراء.",
    },
  },
};

const GENERIC: StepCoaching = {
  why: {
    en: "A required step in this process. Filling it correctly keeps the matter on its expected path.",
    ar: "خطوة لازمة في هذا المسار. إنجازها بشكل صحيح يُبقي القضية على مسارها المتوقَّع.",
  },
  mistakes: [
    { en: "Treating it as paperwork rather than checking the underlying facts.", ar: "التعامل معها كأوراق دون التحقّق من الحقائق الأساسية." },
  ],
  next: {
    en: "Send to your reviewer when ready; never advance without a second pair of eyes.",
    ar: "أرسلها للمراجِع عند الجاهزية؛ لا تتقدّم بدون مراجعة من شخص ثانٍ.",
  },
};

export function coachingForKind(kind: string): StepCoaching {
  return BY_KIND[kind] ?? GENERIC;
}
