/**
 * AI-driven engagement-letter drafting.
 *
 * Given the intake summary (or a manually-entered client + scope), the firm
 * name, and an optional firm template, produce a markdown engagement letter
 * ready for partner review. When no ANTHROPIC_API_KEY is set we fall back to
 * a deterministic stub assembled from the inputs so the demo always works.
 *
 * Returns markdown that renders cleanly in the public viewer. No HTML, no
 * smart quotes — the viewer adds presentation.
 */
import Anthropic from "@anthropic-ai/sdk";

export type DraftEngagementArgs = {
  firmName: string;
  clientName: string;
  region: "UAE" | "KSA";
  legalFunction: string;     // e.g. "fundraising", "litigation"
  sector?: string;
  intakeSummary?: string;
  feeArrangement: "fixed" | "hourly" | "retainer" | "hybrid" | "contingency";
  feeQuoteUsd: number;
  currency: "AED" | "SAR" | "USD";
  jurisdiction: string;      // e.g. "ADGM", "DIFC", "MISA"
  language: "en" | "ar";
  firmTemplateBody?: string;
};

export type DraftEngagementResult = {
  bodyMd: string;
  scopeOfWork: string;
  generatedBy: "ai" | "stub";
};

export async function draftEngagementLetterAi(args: DraftEngagementArgs): Promise<DraftEngagementResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return stubDraft(args);

  const system = [
    `You are a senior ${args.region === "KSA" ? "Saudi" : "UAE"} corporate partner drafting an engagement letter.`,
    `Produce a single markdown engagement letter ready for a partner to review and sign.`,
    `Sections (in this order): Parties · Scope of services · Fee arrangement · Invoicing & out-of-pocket · Confidentiality & data residency · Conflicts · Term & termination · Governing law and dispute resolution · Acceptance.`,
    args.language === "ar"
      ? `Write in formal legal Arabic (الفصحى القانونية), not literal translation.`
      : `Write in precise legal English, partner voice.`,
    `Include the fee arrangement and quote verbatim from the inputs. Do not invent additional fees.`,
    `Reference the GCC compliance regime that applies (UAE PDPL Federal Decree-Law No. 45 of 2021 for UAE matters; KSA PDPL for KSA matters; GDPR where the client is EU-facing).`,
    `End with a markdown signature table for "Signed for the Firm" / "Signed for the Client".`,
    `Output ONLY the markdown body — no preamble, no code fence.`,
  ].join(" ");

  const userPrompt = [
    `Firm: ${args.firmName}`,
    `Client: ${args.clientName}`,
    `Region: ${args.region}`,
    `Jurisdiction: ${args.jurisdiction}`,
    `Legal function: ${args.legalFunction}`,
    args.sector ? `Sector: ${args.sector}` : null,
    `Fee arrangement: ${args.feeArrangement}`,
    `Fee quote: ${args.currency} ${args.feeQuoteUsd.toLocaleString()}`,
    args.intakeSummary ? `\nIntake summary from the client:\n"""\n${args.intakeSummary}\n"""` : null,
    args.firmTemplateBody ? `\nFirm template (use the structure + tone, replace placeholders with concrete inputs):\n"""\n${args.firmTemplateBody}\n"""` : null,
  ].filter(Boolean).join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 2200,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });
    const bodyMd = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return {
      bodyMd,
      scopeOfWork: deriveScope(args),
      generatedBy: "ai",
    };
  } catch {
    return stubDraft(args);
  }
}

function deriveScope(args: DraftEngagementArgs): string {
  return `Provide legal services to ${args.clientName} in connection with ${args.legalFunction.replace(/_/g, " ")}${args.sector ? ` (${args.sector.replace(/_/g, " ")})` : ""} in ${args.region}.`;
}

function stubDraft(args: DraftEngagementArgs): DraftEngagementResult {
  const ar = args.language === "ar";
  const scope = deriveScope(args);
  const quote = `${args.currency} ${args.feeQuoteUsd.toLocaleString()}`;
  const seat = args.region === "KSA" ? "the Saudi Center for Commercial Arbitration" : "ADGM Courts";

  const bodyMd = ar
    ? `# خطاب التعاقد

**بين**  ${args.firmName} ("المكتب")
**و**     ${args.clientName} ("العميل")
**القضية** ${args.legalFunction.replace(/_/g, " ")}
**المنطقة** ${args.region}

## 1. نطاق الخدمات
${scope}

سيتولى المكتب:
- مراجعة الملف وإجراء فحص تعارض المصالح خلال 24 ساعة.
- تقديم المشورة الكتابية وإعداد الوثائق المطلوبة.
- تمثيل العميل أمام الجهات التنظيمية والمحاكم المختصة.
- الحفاظ على السرية وفق القواعد المهنية.

## 2. ترتيبات الأتعاب
**النوع:** ${args.feeArrangement.toUpperCase()}
**العرض:** ${quote} (شامل المصاريف الاعتيادية؛ باستثناء الضريبة وأتعاب الخبراء).

دورة الفوترة: شهرية، مستحقة خلال 30 يوماً.

## 3. السرية وحماية البيانات
يعالج المكتب بيانات العميل وفق ${args.region === "KSA" ? "نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي م/19 وتعديلاته" : "قانون حماية البيانات الإماراتي (المرسوم بقانون اتحادي رقم 45 لسنة 2021)"}. توطين البيانات: ${args.region}.

## 4. المدة والإنهاء
يبقى التعاقد سارياً حتى إنجاز القضية أو إنهائه بإشعار كتابي مدته 30 يوماً من أحد الطرفين. لأي طرف الإنهاء فوراً عند الإخلال الجوهري.

## 5. القانون الحاكم والاختصاص
يحكم هذا التعاقد قانون ${args.region === "KSA" ? "المملكة العربية السعودية" : "دولة الإمارات العربية المتحدة"}. وتُحال النزاعات إلى ${seat}.

---

بالتوقيع أدناه، يؤكد العميل قبول هذه الشروط.

| موقّع عن المكتب | موقّع عن العميل |
|---|---|
| _______________ | _______________ |
| الاسم، المنصب  | الاسم، المنصب  |
| التاريخ        | التاريخ        |
`
    : `# Engagement Letter

**Between**  ${args.firmName} (the "Firm")
**And**       ${args.clientName} (the "Client")
**Matter**    ${args.legalFunction.replace(/_/g, " ")}
**Region**    ${args.region}

## 1. Scope of services
${scope}

The Firm will:
- Review the matter and complete a conflicts check within 24 hours.
- Provide written advice and draft any required documents.
- Represent the Client before relevant regulators or tribunals.
- Maintain confidentiality consistent with applicable bar rules.

## 2. Fee arrangement
**Type:** ${args.feeArrangement.toUpperCase()}
**Quote:** ${quote} (inclusive of standard disbursements; excludes VAT and out-of-pocket expert fees)

Invoicing cadence: monthly, payable within 30 days.

## 3. Confidentiality & data residency
The Firm processes Client data in accordance with ${args.region === "KSA" ? "the KSA PDPL (Royal Decree M/19)" : "the UAE PDPL (Federal Decree-Law No. 45 of 2021)"} and, where applicable, GDPR. Records of processing activities (Article 30 RoPA) are maintained. Primary data residency: ${args.region}.

## 4. Term and termination
This engagement remains in force until the matter is concluded or terminated by either party on 30 days' written notice. Either party may terminate immediately for material breach.

## 5. Governing law and dispute resolution
This engagement is governed by the laws of ${args.region === "KSA" ? "the Kingdom of Saudi Arabia" : "the United Arab Emirates"}. Disputes shall be referred to ${seat}.

---

By signing below, the Client confirms acceptance of these terms.

| Signed for the Firm | Signed for the Client |
|---|---|
| ___________________ | ___________________ |
| Name, Title         | Name, Title         |
| Date                | Date                |
`;
  return { bodyMd, scopeOfWork: scope, generatedBy: "stub" };
}
