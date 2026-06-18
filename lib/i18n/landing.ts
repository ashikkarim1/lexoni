/**
 * Landing-page copy, bilingual, organised by the 5 "end-buys":
 *   1. More billable hours
 *   2. Faster document production
 *   3. Less associate work
 *   4. Better client experience
 *   5. More clients
 *
 * Kept in TS (not JSON) because the landing page needs structured records
 * (heading + body + proof-stat), not flat key→string lookups.
 */
export type LangPack = {
  dir: "ltr" | "rtl";
  nav: { product: string; templates: string; pricing: string; security: string; signin: string; tryFree: string };
  hero: {
    eyebrow: string; title: string; subtitle: string;
    cta1: string; cta2: string;
    trust: string;
  };
  endBuys: { title: string; subtitle: string };
  buys: Array<{
    short: string; label: string; body: string;
    proofStat: string; proofLabel: string;
  }>;
  how: { title: string; subtitle: string; steps: string[] };
  coaching: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ title: string; body: string }>;
    sampleTermLabel: string;
    sampleTermDefinition: string;
    sampleStepTitle: string;
    sampleStepWhy: string;
    sampleStepWatch: string;
    outro: string;
  };
  northStar: {
    title: string; subtitle: string; score: string; scoreLabel: string;
    green: string[]; yellow: string[]; red: string[];
    cta: string; ctaSub: string;
  };
  trust: { title: string; items: string[] };
  pricing: {
    title: string; subtitle: string;
    monthly: string; mostPopular: string;
    contactSales: string; startTrial: string;
    perMonth: string; perUser: string;
    addOns: string; addOnItems: string[];
  };
  faq: { title: string; items: Array<{ q: string; a: string }> };
  footer: { tagline: string; rights: string };
  // Phase 2, positioning around the GCC Legal Operating System.
  outcome: {
    eyebrow: string;
    title: string;
    subtitle: string;
    note: string;
  };
  osSuite: {
    eyebrow: string;
    title: string;
    subtitle: string;
    modules: Array<{ name: string; descr: string; status: "live" | "next" }>;
    statusLive: string;
    statusNext: string;
  };
  breakthroughs: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ name: string; descr: string }>;
  };
  moat: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ name: string; descr: string }>;
  };
  buyers: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: string[];
  };
};

export const EN: LangPack = {
  dir: "ltr",
  nav: { product: "Product", templates: "Templates", pricing: "Pricing", security: "Security", signin: "Sign in", tryFree: "Start 14-day trial" },
  hero: {
    eyebrow: "PRACTICE MANAGEMENT · DOCUMENT AUTOMATION · MARKETPLACE",
    title: "Produce legal work materially faster, without hiring more associates.",
    subtitle: "Lexoni.ai is the practice operating system for GCC law firms. Matters, templates, signatures, client portal, compliance, and an AI knowledge base trained on your firm's own approved work, under one roof, in English and Arabic.",
    cta1: "Start 14-day trial",
    cta2: "Book a demo",
    trust: "Used by partner-led firms in ADGM, DIFC, DMCC & Riyadh · UAE / KSA data residency · SOC 2 in progress",
  },
  endBuys: {
    title: "What you actually get",
    subtitle: "We don't sell AI. We sell five outcomes that change the economics of your firm.",
  },
  buys: [
    { short: "Efficient hours",  label: "More efficient billable hours",
      body: "Eliminate leakage. Time is captured across email, Teams, Outlook and WhatsApp, not retyped on a timesheet at 7pm. Every billable minute gets logged, attributed and matched to a clearer invoice.",
      proofStat: "Capture every hour", proofLabel: "Reduce leakage and disputed invoices" },
    { short: "Faster docs",      label: "Accelerate document production",
      body: "Pick a matter, pick a template, populate from client context, preview PDF, send for signature. Drafting becomes a flow, not an afternoon.",
      proofStat: "Accelerate drafting",  proofLabel: "Standard NDAs, SHAs and employment in a single flow" },
    { short: "Free senior time", label: "Free up time for high-value work",
      body: "Auto-draft from your firm's own approved precedents. Helpers prep, lawyers review, partners sign, and the routine drafting hours stop eating the day.",
      proofStat: "Free up senior time", proofLabel: "Helpers prep, lawyers review, partners focus on the work that pays" },
    { short: "Client experience", label: "Improve the client experience",
      body: "Branded client portal. Plain-English intake. Structured info-requests instead of email chases. WhatsApp and Outlook notifications keep everyone in sync.",
      proofStat: "Delight clients", proofLabel: "Branded portal, structured intake, no email chases" },
    { short: "More clients",      label: "Convert more intake into signed work",
      body: "Public intake page on your domain. AI triage routes to the right lawyer. Engagement letter auto-drafted and e-signed.",
      proofStat: "Shorten enquiry to engagement", proofLabel: "AI triage and auto-drafted engagement letters" },
  ],
  how: {
    title: "How a matter moves through Lexoni.ai",
    subtitle: "One workflow. No copy-paste between systems.",
    steps: [
      "Client submits an intake on your branded page (plain English).",
      "AI classifies sector + legal function + urgency. Routing assigns the right lawyer.",
      "Engagement letter is auto-drafted, partner-signed, sent for client e-signature.",
      "Matter opens with auto-populated client context (entities, signatories, jurisdiction).",
      "Document automation: select template → autopopulate → review → preview PDF → send.",
      "Signature workflow runs sequential or parallel; reminders fire on their own.",
      "Executed copy is archived to the matter. Time, fees, and compliance update automatically.",
      "The knowledge base learns from every approved matter, the next draft is faster and sharper.",
    ],
  },
  coaching: {
    eyebrow: "For lawyers who just landed in the region",
    title: "A senior at your elbow, without the awkward question.",
    subtitle: "Whether you've just moved to ADGM from the City, or you're a paralegal in your first year out of law school, Lexoni quietly coaches you through GCC practice, and protects the matter while you learn. Senior partners switch it off. Juniors keep it on. Nobody at the table needs to know.",
    items: [
      {
        title: "In-context glossary, EN & AR",
        body: "Every GCC-specific term, ADGM, DIFC, MISA, ZATCA, UBO, ESR, drag-along, Sharia-compliant, Tadawul, has a one-line definition on hover, in English or formal legal Arabic. No more silently nodding in a partner meeting.",
      },
      {
        title: "Step-by-step explainers, written by senior lawyers",
        body: "Every document slot in a matter tells you why it exists, the mistakes juniors most often make, and the exact next move. Written by senior corporate partners, not by an LLM guessing.",
      },
      {
        title: "Mistake-prevention guardrails",
        body: "Before any send-for-signature or mark-signed, you walk a quick checklist, party names, dates, jurisdiction, senior sign-off. The things juniors get disciplined for, gated before they happen.",
      },
      {
        title: "An AI prompt that teaches you to ask better",
        body: "Vague request? The system suggests how to sharpen it before sending, add jurisdiction, language, parties, term-sheet constraints. You ship better drafts and you learn how to brief AI like a senior.",
      },
    ],
    sampleTermLabel: "UBO",
    sampleTermDefinition: "Ultimate Beneficial Owner, the natural person who ultimately owns or controls a legal entity. Common pitfall: indirect ownership through nominees or trusts still counts.",
    sampleStepTitle: "KYC / UBO Declaration",
    sampleStepWhy: "Why this step: verifies the client's identity, source of funds and ultimate beneficial owners. Required by AML and audit.",
    sampleStepWatch: "Watch out for: stale KYC older than 12 months, refresh on every new matter.",
    outro: "Switch it off the day you make partner. Until then, no shame in keeping one at your elbow.",
  },
  northStar: {
    title: "The North Star, a Client Health Score on every entity in your book",
    subtitle: "Your lawyer opens any client and sees one number, one tab. Governance, compliance, contracts, and filings, green, yellow, red. One click to draft the fix.",
    score: "96", scoreLabel: "Client Health · Alistair Holdings Ltd (managed by Sara A.)",
    green: [
      "Governance: all board approvals up to date",
      "Licences: ADGM trade licence renewed by our firm",
      "Contracts: 0 expiring in the next 30 days",
      "Engagement letter on file, in date",
    ],
    yellow: [
      "Client's VP-Engineering employment contract expires in 45 days (renewal draft queued for review)",
      "DIFC ESR notification due in 90 days, checklist generated",
    ],
    red: [
      "ADGM annual filing, due in 14 days · 1-click fix below",
    ],
    cta: "1-click: AI drafts the resolution + filing pack → assigned lawyer reviews → file with the regulator.",
    ctaSub: "Recurring legal workflows your clients need every month, governance, compliance, contracts, filings, become a continuous service line for your firm instead of a fire-drill at the deadline.",
  },
  trust: {
    title: "Built for how GCC law firms actually buy",
    items: [
      "UAE & KSA data residency. EU DR site for international clients.",
      "Chinese-wall security: lawyers only see matters they are assigned to. Partner visibility is configurable.",
      "Multi-firm collaboration: master firm controls; participants get scoped workspaces.",
      "GDPR + UAE PDPL + KSA PDPL covered out of the box: RoPA, consent register, 30-day DSR clock.",
      "Append-only audit log: every view, download, export, signature.",
      "ADGM-compliant e-signatures with tamper-evident certificate.",
      "White-label: your domain, your brand, your sender identity.",
      "Microsoft 365, Outlook, Teams, WhatsApp Business, DocuSign, ZATCA, all wired in.",
    ],
  },
  pricing: {
    title: "Plans that scale with your firm",
    subtitle: "14-day trial. Full functionality. No credit card.",
    monthly: "Billed monthly · cancel anytime",
    mostPopular: "Most popular",
    contactSales: "Contact sales",
    startTrial: "Start trial",
    perMonth: "/mo",
    perUser: "users",
    addOns: "Add-on revenue we offer (and you can resell)",
    addOnItems: [
      "Document generation credits, $0.25 to $1.00 per document",
      "Marketplace template commission, 15 to 20% of sale price",
      "Legal referral fee, where permitted by local regulation",
      "White-label setup, $2,500 to $25,000 one-off",
    ],
  },
  faq: {
    title: "Frequently asked",
    items: [
      { q: "Does the AI train on our client data?",
        a: "No. AI only learns from items your firm explicitly approves for training. Client confidential data is excluded by default. You see every learned item in the Knowledge Base." },
      { q: "Can we run on our own private cloud?",
        a: "Yes, Enterprise plans include private cloud in UAE or KSA with single-tenant isolation. Customer-managed encryption keys available." },
      { q: "How does the Chinese wall work?",
        a: "Lawyers see only matters they are explicitly assigned to. Partner visibility is configurable per firm (assigned-only or all-firm). Every access event is recorded for ethical-wall audit." },
      { q: "What about multi-firm matters?",
        a: "The master firm owns the matter and controls participants. Co-counsel, specialists, foreign and local counsel get scoped workspaces, they never see unrelated matters, billing, or internal notes." },
      { q: "How long to go live?",
        a: "Most firms are live on the trial in under an hour. White-label and integrations take 1–2 weeks depending on scope." },
      { q: "What's the junior-lawyer coaching layer?",
        a: "A discreet mode every lawyer can toggle from the topbar. It underlines GCC-specific terms with hover definitions in EN or AR, explains why each document step exists and the mistakes juniors most often make, gates send-for-signature behind a checklist, and coaches AI prompts. Off by default for partners; on by default for paralegals and lawyer-helpers. Nothing in the matter changes, only what the user sees." },
    ],
  },
  footer: { tagline: "The practice operating system for GCC law firms.", rights: "All rights reserved." },
  outcome: {
    eyebrow: "POSITIONING",
    title: "Tell us the outcome. We build the legal path.",
    subtitle: "Existing legal vendors sell document storage and billing. We sell the outcome, open a Saudi subsidiary, list on ADX, raise a Series B, and the platform plans, executes and tracks every step. Outcomes, regulator-mapped, residency-pinned, EN + AR from day one.",
    note: "GCC-native. Outcome-first. Institutionally-memorised. Not another legal app.",
  },
  osSuite: {
    eyebrow: "THE GCC LEGAL OPERATING SYSTEM",
    title: "One operating system. Twelve outcome-driven modules.",
    subtitle: "iManage, NetDocuments and Clio were built around documents and billable hours. Lexoni is built around outcomes, every module shares the same process engine, the same knowledge graph, the same regulator-mapped calendar.",
    modules: [
      { name: "Corporate Secretary OS", descr: "Board, AGM, resolutions, statutory filings, register of directors / shareholders.", status: "live" },
      { name: "Company Formation OS", descr: "End-to-end: UAE (ADGM, DIFC, mainland) + KSA (MISA, regional HQ).", status: "live" },
      { name: "Workflow OS", descr: "Process engine + packs. Excel-replacing checklists, dependencies, approvals.", status: "live" },
      { name: "Governance OS", descr: "Approval chains, related-party, conflicts, ethical walls, default-deny isolation.", status: "live" },
      { name: "Billing OS", descr: "Passive time, WIP, VAT-aware invoicing, ZATCA, collections, profitability.", status: "live" },
      { name: "Regulatory OS", descr: "UAE + KSA compliance calendar with T-30 / T-7 / T-1 reminders.", status: "live" },
      { name: "Document Management OS", descr: "Matter-centric storage, email capture, document timeline, precedent library. Goodbye SharePoint.", status: "next" },
      { name: "Knowledge OS", descr: "Search across 20 years of contracts + opinions + memos. Clause-level retrieval.", status: "next" },
      { name: "IPO OS", descr: "ADX, Nasdaq Dubai, Tadawul, listing prep, prospectus, regulator filings.", status: "next" },
      { name: "M&A OS", descr: "Buy-side + sell-side; LOI → SPA → close; permissioned deal rooms; DD checklists.", status: "next" },
      { name: "Fund Launch OS", descr: "ADGM RFL / QIF, DIFC QIF, Cayman feeder structures with regulator-mapped tasks.", status: "next" },
      { name: "AI Legal Copilot", descr: "Matter copilot + institutional memory + autonomous matter builder + regulatory intel.", status: "next" },
    ],
    statusLive: "Live",
    statusNext: "Shipping next",
  },
  breakthroughs: {
    eyebrow: "WHAT NOBODY ELSE HAS BUILT",
    title: "Five capabilities your current system cannot do.",
    subtitle: "Built for partners who say: lawyers don't want software, they want the legal work done.",
    items: [
      { name: "Legal Matter Copilot", descr: "Type \"take this company public on ADX\" and the system generates the required steps, timeline, regulators, filings, responsible lawyers, templates, estimated fees and risk flags, instantly. Legal GPS, not legal software." },
      { name: "Institutional Memory AI", descr: "Ask \"have we ever done this before?\", get the answer in seconds, with prior matter, lead lawyer, year, and the relevant clauses. Every firm's twenty years of work, searchable in plain English." },
      { name: "Autonomous Matter Builder", descr: "A client requests \"we need a Saudi subsidiary\" and the platform opens the matter, assigns the lawyer, builds the task tree, drafts the first documents, estimates cost and timeline, all under 90 seconds. No manual setup." },
      { name: "Regulatory Change Intelligence", descr: "We monitor UAE and KSA gazettes, ADGM, DIFC, ADX, Tadawul, ZATCA. When a regulation lands, we tell you \"this affects 147 of your clients, 38 need action in 90 days\", with a draft client memo in EN and AR." },
      { name: "AI Partner Brain", descr: "Trained on your firm's own work product, style, precedents and opinions. Ask \"how would our M&A team structure this?\" and get an answer in your firm's voice, citing your firm's precedents. Not ChatGPT, your firm." },
    ],
  },
  moat: {
    eyebrow: "WHY NO ONE IN THE REGION WILL CATCH US",
    title: "Four defensible IP layers, by design.",
    subtitle: "Most AI products are LLM wrappers. Investors know this. Our moat is proprietary workflows, structured datasets, and reasoning over them, the kind of moat existing vendors cannot retrofit onto a document-storage core.",
    items: [
      { name: "Dynamic Legal Workflow Generation", descr: "Given an outcome, the system emits a complete legal execution path, tasks, documents, dependencies, regulators, deadlines, by reasoning over a typed process ontology and the firm's historicals. Hard to copy without our process graph." },
      { name: "Legal Knowledge Graph", descr: "Typed graph linking clients → matters → entities → contracts → clauses → regulations → filings → lawyers. AI reasons across relationships, not flat documents. Hard to copy without our data schema and the firm's data." },
      { name: "Regulatory Impact Engine", descr: "Maps every new regulation through (regulator → client → contract → entity → required action). Hard to copy without our regulator-source pipeline, our knowledge graph, and clause-level extraction in one system." },
      { name: "Legal Outcome Prediction Layer", descr: "Trained on the firm's closed-loop historical matters; predicts cost, duration and execution risk before the engagement letter is signed. Hard to copy without the firm's own historicals." },
    ],
  },
  buyers: {
    eyebrow: "WHO BUYS THIS",
    title: "Same operating system. Six distribution channels.",
    subtitle: "Outcome-driven workflows + regulator intelligence + institutional memory are valuable far beyond a law firm. The same OS sells into:",
    items: [
      "Law firms, every regional firm with five or more lawyers",
      "Corporate secretaries, ADGM, DIFC, DMCC, RAKEZ, MISA-licensed firms",
      "Family offices, captable, governance, related-party oversight",
      "Investment banks, M&A workflows, IPO prep, regulator filings",
      "Accounting firms, tax + corporate compliance on the same calendar",
      "Government entities, managing outside-counsel oversight",
    ],
  },
};

export const AR: LangPack = {
  dir: "rtl",
  nav: { product: "المنتج", templates: "النماذج", pricing: "الأسعار", security: "الأمان", signin: "تسجيل الدخول", tryFree: "ابدأ تجربة 14 يوماً" },
  hero: {
    eyebrow: "إدارة الممارسة · أتمتة الوثائق · سوق قانوني",
    title: "أنجز الأعمال القانونية بشكل أسرع جوهرياً, دون توظيف محامين إضافيين.",
    subtitle: "Lexoni.ai هو نظام تشغيل الممارسة لمكاتب المحاماة الخليجية. القضايا والنماذج والتوقيعات وبوابة العميل والامتثال وقاعدة معرفية بالذكاء الاصطناعي مدربة على أعمال مكتبك المعتمدة, كل ذلك تحت سقف واحد، باللغتين العربية والإنجليزية.",
    cta1: "ابدأ تجربة 14 يوماً",
    cta2: "احجز عرضاً توضيحياً",
    trust: "مستخدم من قبل مكاتب رائدة في أبوظبي العالمية ومركز دبي المالي ومنطقة دبي للسلع والرياض · بيانات داخل الإمارات / السعودية · شهادة SOC 2 قيد الإنجاز",
  },
  endBuys: {
    title: "ما تحصل عليه فعلياً",
    subtitle: "نحن لا نبيع ذكاءً اصطناعياً. نبيع خمس نتائج تُغيّر اقتصاديات مكتبك.",
  },
  buys: [
    { short: "ساعات أكثر كفاءة",   label: "ساعات قابلة للفوترة أكثر كفاءة",
      body: "أوقف التسرّب. تُلتقط الساعات من البريد وTeams وOutlook وواتساب, لا تُعاد كتابتها في كشف ساعات السابعة مساءً. كل دقيقة قابلة للفوترة تُسجَّل وتُنسب وتُترجَم إلى فاتورة أوضح.",
      proofStat: "التقاط كل ساعة", proofLabel: "تقليل التسرّب والفواتير المُتنازع عليها" },
    { short: "وثائق أسرع",         label: "تسريع إنتاج الوثائق",
      body: "اختر القضية، اختر النموذج، استورد بيانات العميل تلقائياً، اعرض PDF، أرسل للتوقيع. تصبح الصياغة تدفّقاً سلساً، لا عبئاً يلتهم بعد الظهر.",
      proofStat: "تسريع الصياغة",  proofLabel: "NDA وSHA وعقود التوظيف في تدفّق واحد" },
    { short: "تفريغ وقت الأقدمين",  label: "تفريغ الوقت للعمل الأعلى قيمة",
      body: "صياغة تلقائية من السوابق المعتمدة لمكتبك. المساعدون يجهّزون، المحامون يراجعون، الشركاء يوقّعون, وتتوقّف ساعات الصياغة الروتينية عن ابتلاع اليوم.",
      proofStat: "تفريغ وقت الأقدمين", proofLabel: "المساعدون يجهّزون، المحامون يراجعون، الشركاء يركّزون على العمل الأعلى قيمة" },
    { short: "تجربة العميل",        label: "تحسين تجربة العميل",
      body: "بوابة عميل بعلامتك التجارية. استقبال بلغة دارجة. طلبات بيانات منظّمة بدل مطاردات البريد. إشعارات واتساب وOutlook تُبقي الجميع على تزامن.",
      proofStat: "إسعاد العملاء", proofLabel: "بوابة بعلامتك، استقبال منظّم، لا مطاردة بريد" },
    { short: "تحويل أكثر",          label: "تحويل الاستفسارات إلى ارتباطات موقّعة",
      body: "صفحة استقبال على نطاقك. توجيه ذكي للمحامي الأنسب. خطاب تعاقد يُصاغ تلقائياً ويُوقَّع رقمياً.",
      proofStat: "اختصار الاستفسار إلى التعاقد", proofLabel: "توجيه ذكي وخطابات تعاقد مُصاغة تلقائياً" },
  ],
  how: {
    title: "كيف تتدفق القضية داخل Lexoni.ai",
    subtitle: "سير عمل واحد. لا نسخ ولصق بين الأنظمة.",
    steps: [
      "العميل يقدّم استقبالاً على صفحتك المُعلَّمة (لغة دارجة).",
      "الذكاء الاصطناعي يصنّف القطاع والوظيفة القانونية والإلحاح. التوجيه يُعيّن المحامي الأنسب.",
      "خطاب التعاقد يُصاغ تلقائياً ويوقّعه الشريك ويُرسل للعميل للتوقيع الرقمي.",
      "تُفتح القضية ببيانات العميل تلقائياً (المنشآت، المخوّلون، الاختصاص).",
      "أتمتة الوثائق: اختر نموذجاً ← امتلأ تلقائياً ← راجع ← اعرض PDF ← أرسل.",
      "تدفق التوقيع يعمل بالتسلسل أو بالتوازي؛ التذكيرات تعمل وحدها.",
      "النسخة النهائية تُؤرشف داخل القضية. الوقت والرسوم والامتثال تُحدَّث تلقائياً.",
      "قاعدة المعرفة تتعلم من كل قضية معتمدة, المسودة التالية تكون أسرع وأذكى.",
    ],
  },
  coaching: {
    eyebrow: "للمحامين الذين وصلوا المنطقة للتو",
    title: "محامٍ أقدم بجانبك, دون السؤال المُحرِج.",
    subtitle: "سواء انتقلت إلى سوق أبوظبي العالمي قادماً من لندن، أو كنت معاوناً في عامك الأول بعد التخرّج، Lexoni يُرشدك بصمت في الممارسة الخليجية, ويحمي القضية بينما تتعلّم. الشركاء يُطفئونه. المساعدون يُبقونه مُفعَّلاً. لا أحد حول الطاولة يحتاج أن يعلم.",
    items: [
      {
        title: "قاموس قانوني سياقي, إنجليزي وعربي",
        body: "كل مصطلح خليجي محدد, ADGM وDIFC وMISA وZATCA والمستفيد الحقيقي والجوهر الاقتصادي وحق الإلزام بالبيع والمتوافق مع الشريعة وتداول, له تعريف موجز بسطر واحد عند المرور فوقه، بالإنجليزية أو الفصحى القانونية. لن تومئ صامتاً في اجتماع الشريك بعد اليوم.",
      },
      {
        title: "شرح كل خطوة بقلم محامين أقدم",
        body: "كل خانة وثيقة في القضية تخبرك بغرضها، وبالأخطاء الأكثر شيوعاً لدى المساعدين، وبالخطوة التالية بالضبط. مكتوبة من شركاء قانون شركات أقدم، لا من نموذج لغوي يخمّن.",
      },
      {
        title: "حواجز ضد الأخطاء",
        body: "قبل أي إرسال للتوقيع أو وسم بالتوقيع، تَمشي بقائمة تحقّق سريعة, أسماء الأطراف، التواريخ، الاختصاص، توقيع الأقدم. الأشياء التي تجلب التأديب على المساعد، تُحجَب قبل أن تحدث.",
      },
      {
        title: "موجّه ذكاء اصطناعي يعلّمك كيف تسأل أفضل",
        body: "طلب غامض؟ النظام يقترح كيف تصقله قبل الإرسال, أضف الاختصاص واللغة والأطراف وقيود كراسة الشروط. تخرج بمسودات أفضل، وتتعلّم كيف توجّه الذكاء الاصطناعي كما يفعل الأقدم.",
      },
    ],
    sampleTermLabel: "المستفيد الحقيقي",
    sampleTermDefinition: "الشخص الطبيعي الذي يملك أو يسيطر فعلياً على الكيان القانوني. خطأ شائع: الملكية غير المباشرة عبر وكلاء أو صناديق تُحتسب أيضاً.",
    sampleStepTitle: "إقرار «اعرف عميلك» والمستفيد الحقيقي",
    sampleStepWhy: "غرض الخطوة: التحقّق من هوية العميل ومصدر أمواله والمستفيد الحقيقي. مطلوبة لمكافحة غسل الأموال وللتدقيق.",
    sampleStepWatch: "احذر من: بيانات KYC تجاوزت 12 شهراً, جدّدها مع كل قضية جديدة.",
    outro: "أوقفه في اليوم الذي تصبح فيه شريكاً. حتى ذلك الحين، لا عيب في أن يكون شريك بجانبك.",
  },
  northStar: {
    title: "النجم الشمالي, مؤشر صحة العميل لكل كيان في محفظتك",
    subtitle: "يفتح محاميك أي عميل ويرى رقماً واحداً وتبويباً واحداً. الحوكمة، الامتثال، العقود، والإيداعات, أخضر، أصفر، أحمر. بضغطة واحدة تُسوَّد المعالجة.",
    score: "96", scoreLabel: "صحة العميل · Alistair Holdings Ltd (يديرها سارة)",
    green: [
      "الحوكمة: كل موافقات المجلس مُحدَّثة",
      "التراخيص: تم تجديد الرخصة التجارية في ADGM بواسطة مكتبنا",
      "العقود: 0 منتهية خلال الـ 30 يوماً القادمة",
      "خطاب التعاقد على الملف وساري المفعول",
    ],
    yellow: [
      "عقد نائب رئيس الهندسة لدى العميل ينتهي خلال 45 يوماً (مسودة تجديد بانتظار المراجعة)",
      "إخطار ESR في DIFC مستحق خلال 90 يوماً, قائمة التحقق جاهزة",
    ],
    red: [
      "الإيداع السنوي في ADGM, مستحق خلال 14 يوماً · معالجة بضغطة واحدة أدناه",
    ],
    cta: "بضغطة واحدة: الذكاء الاصطناعي يُسوّد القرار وملف الإيداع ← المحامي المُعيَّن يراجع ← يُودَع لدى الجهة المُنظِّمة.",
    ctaSub: "سير العمل القانوني المتكرر الذي يحتاجه عملاؤك شهرياً, حوكمة وامتثال وعقود وإيداعات, يتحول إلى خط خدمة مستمر لمكتبك بدلاً من سباق المواعيد النهائية.",
  },
  trust: {
    title: "مصمّم لكيفية شراء مكاتب المحاماة الخليجية فعلياً",
    items: [
      "بيانات مقيمة في الإمارات والسعودية. موقع تعافٍ في الاتحاد الأوروبي للعملاء الدوليين.",
      "حاجز صيني: المحامي يرى فقط القضايا المُعيَّن إليها. صلاحية الشركاء قابلة للتهيئة.",
      "تعاون متعدد المكاتب: المكتب الرئيسي يتحكم؛ المشاركون يحصلون على نطاق محدود.",
      "GDPR + قانون البيانات الإماراتي + السعودي مُغطّى من البداية: سجلّ المعالجة، سجلّ الموافقات، عدّاد 30 يوماً لطلبات أصحاب البيانات.",
      "سجل تدقيق مُضاف-فقط: كل عرض وتنزيل وتصدير وتوقيع.",
      "توقيع إلكتروني متوافق مع ADGM وشهادة غير قابلة للتلاعب.",
      "علامة بيضاء: نطاقك، علامتك، هوية المرسل الخاصة بك.",
      "Microsoft 365، Outlook، Teams، واتساب، DocuSign، ZATCA, كلها مربوطة.",
    ],
  },
  pricing: {
    title: "خطط تنمو مع مكتبك",
    subtitle: "تجربة 14 يوماً. وظائف كاملة. بدون بطاقة ائتمان.",
    monthly: "فوترة شهرية · ألغِ في أي وقت",
    mostPopular: "الأكثر شيوعاً",
    contactSales: "تواصل مع المبيعات",
    startTrial: "ابدأ التجربة",
    perMonth: "/شهرياً",
    perUser: "مستخدمين",
    addOns: "إيرادات إضافية نقدّمها (ويمكنك إعادة بيعها)",
    addOnItems: [
      "أرصدة توليد وثائق, 0.25 إلى 1.00 دولار لكل وثيقة",
      "عمولة السوق على النماذج, 15 إلى 20% من سعر البيع",
      "رسوم إحالة قانونية, حيث يسمح التنظيم المحلي",
      "إعداد العلامة البيضاء, 2,500 إلى 25,000 دولار لمرة واحدة",
    ],
  },
  faq: {
    title: "الأسئلة الشائعة",
    items: [
      { q: "هل يتدرب الذكاء الاصطناعي على بيانات عملائنا؟",
        a: "لا. الذكاء الاصطناعي يتعلم فقط من العناصر التي يعتمدها مكتبك صراحةً للتدريب. بيانات العميل السرية مُستبعدة افتراضياً. ترى كل عنصر مُتعلَّم في قاعدة المعرفة." },
      { q: "هل يمكن تشغيلنا على سحابة خاصة بنا؟",
        a: "نعم, خطط الشركات تشمل سحابة خاصة في الإمارات أو السعودية بعزل أحادي المستأجر، مع إمكانية مفاتيح تشفير يديرها العميل." },
      { q: "كيف يعمل الحاجز الصيني؟",
        a: "المحامون يرون فقط القضايا المُعيَّنين إليها. صلاحية الشركاء قابلة للتهيئة لكل مكتب (مُعيَّن فقط أو كل المكتب). كل وصول يُسجَّل للتدقيق الأخلاقي." },
      { q: "ماذا عن القضايا متعددة المكاتب؟",
        a: "المكتب الرئيسي يملك القضية ويتحكم بالمشاركين. المحامون المعاونون والمتخصصون والمكاتب الأجنبية والمحلية يحصلون على نطاق عمل محدود, لا يرون قضايا أو فواتير أو ملاحظات داخلية لا تخصهم." },
      { q: "كم من الوقت يستغرق الإطلاق؟",
        a: "معظم المكاتب تعمل بالتجربة خلال أقل من ساعة. العلامة البيضاء والتكاملات تأخذ 1-2 أسبوع حسب النطاق." },
      { q: "ما هي طبقة إرشاد المحامين المساعدين؟",
        a: "وضع تشغيل خفي يمكن لأي محامٍ تفعيله من الشريط العلوي. يضع خطاً تحت المصطلحات الخليجية المحددة مع تعريف عند المرور بالإنجليزية أو العربية، ويشرح غرض كل خطوة وثيقة والأخطاء الأكثر شيوعاً لدى المساعدين، ويُلزم بقائمة تحقّق قبل الإرسال للتوقيع، ويُرشد موجّهات الذكاء الاصطناعي. متوقّف افتراضياً للشركاء؛ مُفعَّل افتراضياً للمعاونين والمساعدين. لا يتغيّر شيء في القضية, فقط ما يراه المستخدم." },
    ],
  },
  footer: { tagline: "نظام تشغيل الممارسة لمكاتب المحاماة الخليجية.", rights: "جميع الحقوق محفوظة." },
  outcome: {
    eyebrow: "موقعنا",
    title: "أخبرنا بالنتيجة, نبني المسار القانوني.",
    subtitle: "الموردون الحاليون يبيعون تخزين الوثائق والفوترة. نحن نبيع النتيجة, افتح شركة تابعة في السعودية، اطرح في سوق أبوظبي، اجمع جولة Series B, والمنصة تخطّط وتنفّذ وتتابع كل خطوة. نتائج معتمدة من المنظّمين، مثبّتة الإقامة، باللغتين العربية والإنجليزية منذ اليوم الأول.",
    note: "خليجي المنشأ. مدفوع بالنتائج. ذاكرة مؤسسية. ليس تطبيقاً قانونياً آخر.",
  },
  osSuite: {
    eyebrow: "نظام التشغيل القانوني الخليجي",
    title: "نظام تشغيل واحد. اثنا عشر وحدة مدفوعة بالنتائج.",
    subtitle: "iManage وNetDocuments وClio بُنيت حول الوثائق والساعات القابلة للفوترة. Lexoni بُني حول النتائج, كل وحدة تشترك في نفس محرك العمليات، ونفس الرسم البياني المعرفي، ونفس تقويم الامتثال المعتمد من المنظّمين.",
    modules: [
      { name: "نظام أمين الشركة", descr: "مجلس الإدارة، الجمعية العمومية، القرارات، الإيداعات القانونية، سجلات المديرين والمساهمين.", status: "live" },
      { name: "نظام تأسيس الشركات", descr: "من البداية للنهاية: الإمارات (أبوظبي العالمية، دبي المالي، البر الرئيسي) + السعودية (وزارة الاستثمار، المقر الإقليمي).", status: "live" },
      { name: "نظام سير العمل", descr: "محرك العمليات + الحزم. قوائم تحقّق وتبعيات وموافقات تستبدل ملفات Excel.", status: "live" },
      { name: "نظام الحوكمة", descr: "سلاسل الموافقات، الأطراف ذات العلاقة، التعارضات، الجدران الأخلاقية, عزل افتراضي بالرفض.", status: "live" },
      { name: "نظام الفوترة", descr: "تسجيل الوقت السلبي، الأعمال غير المُفوترة، فواتير بضريبة القيمة المضافة، ZATCA، التحصيل، الربحية.", status: "live" },
      { name: "نظام التنظيم", descr: "تقويم امتثال الإمارات + السعودية مع تذكيرات T-30 / T-7 / T-1.", status: "live" },
      { name: "نظام إدارة الوثائق", descr: "تخزين محوره القضية، التقاط البريد، الجدول الزمني للوثائق، مكتبة السوابق. وداعاً لـSharePoint.", status: "next" },
      { name: "نظام المعرفة", descr: "بحث عبر 20 عاماً من العقود والآراء والمذكرات. استرجاع على مستوى البند.", status: "next" },
      { name: "نظام الاكتتاب العام", descr: "أسواق أبوظبي، ناسداك دبي، تداول, التحضير للإدراج، النشرة، الإيداعات التنظيمية.", status: "next" },
      { name: "نظام الاندماج والاستحواذ", descr: "جانب الشراء + جانب البيع؛ خطاب النوايا → SPA → الإغلاق؛ غرف بيانات بصلاحيات؛ قوائم العناية الواجبة.", status: "next" },
      { name: "نظام إطلاق الصناديق", descr: "صناديق محدودة / مؤهلة في أبوظبي العالمية، صناديق مؤهلة في دبي المالي، هياكل تغذية كايمان مع مهام معتمدة من المنظّمين.", status: "next" },
      { name: "مساعد الذكاء الاصطناعي القانوني", descr: "مساعد القضايا + الذاكرة المؤسسية + بناء القضايا الذاتي + الذكاء التنظيمي.", status: "next" },
    ],
    statusLive: "مُشغَّل",
    statusNext: "قريباً",
  },
  breakthroughs: {
    eyebrow: "ما لم يبنه أحد آخر",
    title: "خمس قدرات لا يستطيع نظامك الحالي تأديتها.",
    subtitle: "مبنية للشركاء الذين يقولون: المحامون لا يريدون برمجيات، يريدون إنجاز العمل القانوني.",
    items: [
      { name: "مساعد القضايا القانونية", descr: "اكتب \"اطرح هذه الشركة في سوق أبوظبي\" والنظام يولّد الخطوات المطلوبة والجدول الزمني والمنظّمين والإيداعات والمحامين المسؤولين والنماذج والأتعاب التقديرية وإشارات المخاطر, فوراً. GPS قانوني، لا برنامج قانوني." },
      { name: "ذاكرة المؤسسة بالذكاء الاصطناعي", descr: "اسأل \"هل سبق أن نفّذنا هذا؟\", احصل على الجواب في ثوانٍ، مع القضية السابقة والمحامي الرئيسي والسنة والبنود ذات الصلة. عشرون عاماً من عمل كل مكتب، قابلة للبحث بلغة بسيطة." },
      { name: "البناء الذاتي للقضايا", descr: "يطلب العميل \"نحتاج شركة سعودية تابعة\" والمنصة تفتح القضية وتعيّن المحامي وتبني شجرة المهام وتصوغ الوثائق الأولى وتقدّر التكلفة والجدول الزمني, كل ذلك في أقل من 90 ثانية. بدون إعداد يدوي." },
      { name: "ذكاء التغيير التنظيمي", descr: "نراقب الجريدتين الرسميتين الإماراتية والسعودية، أبوظبي العالمية، دبي المالي، أسواق أبوظبي، تداول، ZATCA. عندما يصدر تنظيم، نخبرك \"هذا يؤثر على 147 عميلاً، 38 منهم يحتاجون إجراءً خلال 90 يوماً\", مع مذكرة عميل مسودة بالإنجليزية والعربية." },
      { name: "عقل الشريك بالذكاء الاصطناعي", descr: "مدرَّب على نتاج مكتبك وأسلوبه وسوابقه وآرائه. اسأل \"كيف سيهيكل فريق الاندماج والاستحواذ لدينا هذا؟\" واحصل على إجابة بصوت مكتبك تستشهد بسوابق مكتبك. ليس ChatGPT, مكتبك." },
    ],
  },
  moat: {
    eyebrow: "لماذا لن يلحق بنا أحد في المنطقة",
    title: "أربع طبقات ملكية فكرية قابلة للدفاع, بالتصميم.",
    subtitle: "معظم منتجات الذكاء الاصطناعي مجرد أغلفة LLM. المستثمرون يعرفون ذلك. الميزة التنافسية لدينا هي سير العمل الخاص، ومجموعات البيانات المنظَّمة، والاستدلال عليها, نوع من الميزة لا يستطيع الموردون الحاليون تركيبه على نواة تخزين وثائق.",
    items: [
      { name: "توليد سير العمل القانوني الديناميكي", descr: "بناءً على نتيجة، يصدر النظام مساراً تنفيذياً قانونياً كاملاً, مهام، وثائق، تبعيات، منظّمون، مواعيد نهائية, عبر الاستدلال على رسم بياني للعمليات وتاريخ المكتب. صعب النسخ بدون رسمنا البياني." },
      { name: "الرسم البياني للمعرفة القانونية", descr: "رسم بياني نوعي يربط العملاء → القضايا → الكيانات → العقود → البنود → التنظيمات → الإيداعات → المحامين. يستدل الذكاء الاصطناعي عبر العلاقات لا الوثائق المسطّحة. صعب النسخ بدون مخطط بياناتنا وبيانات المكتب." },
      { name: "محرك الأثر التنظيمي", descr: "يرسم كل تنظيم جديد عبر (المنظّم → العميل → العقد → الكيان → الإجراء المطلوب). صعب النسخ بدون خط أنابيب مصادرنا التنظيمي، ورسمنا البياني المعرفي، واستخراج البنود في نظام واحد." },
      { name: "طبقة التنبؤ بالنتائج القانونية", descr: "مدرّبة على القضايا التاريخية المغلقة للمكتب؛ تتنبأ بالتكلفة والمدة ومخاطر التنفيذ قبل توقيع خطاب التكليف. صعب النسخ بدون تاريخ المكتب نفسه." },
    ],
  },
  buyers: {
    eyebrow: "من يشتري هذا",
    title: "نظام تشغيل واحد. ست قنوات توزيع.",
    subtitle: "سير العمل المدفوع بالنتائج + الذكاء التنظيمي + الذاكرة المؤسسية قيِّم بكثير خارج مكاتب المحاماة. نفس نظام التشغيل يُباع إلى:",
    items: [
      "مكاتب المحاماة, كل مكتب إقليمي بخمسة محامين أو أكثر",
      "أمناء الشركات, المرخّصون في أبوظبي العالمية ودبي المالي والسلع وراكز ووزارة الاستثمار",
      "مكاتب العائلات, جداول الملكية، الحوكمة، رقابة الأطراف ذات العلاقة",
      "بنوك الاستثمار, سير عمل الاندماج والاستحواذ، تحضير الاكتتاب، الإيداعات التنظيمية",
      "مكاتب المحاسبة, الضريبة + الامتثال الشركاتي في نفس التقويم",
      "الجهات الحكومية, إدارة الإشراف على المحامين الخارجيين",
    ],
  },
};
