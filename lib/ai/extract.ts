/**
 * Document auto-extraction.
 *
 * Given the parsed plain text of a contract / brief / regulatory filing,
 * pull structured insights: parties, dates, jurisdiction, governing law,
 * obligations, risks, novel clauses, and a one-line document classification.
 *
 * Output schema is locked — the matter workspace renders it directly. The
 * Anthropic system prompt instructs the model to return strict JSON; we
 * parse defensively. When no ANTHROPIC_API_KEY is set we return a
 * deterministic mock so the UI always has content to render.
 */
import Anthropic from "@anthropic-ai/sdk";

export type Party = { name: string; role: string };
export type DateEntry = { label: string; iso: string | null; raw: string };
export type Obligation = { party: string; obligation: string };
export type Risk = { severity: "low" | "medium" | "high"; title: string; body: string };
export type Clause = { title: string; summary: string };

export type DocumentInsights = {
  documentType: string;
  jurisdiction: string | null;
  governingLaw: string | null;
  language: "en" | "ar" | "mixed" | "other";
  parties: Party[];
  keyDates: DateEntry[];
  obligations: Obligation[];
  risks: Risk[];
  novelClauses: Clause[];
  summary: string;
  generatedBy: "ai" | "stub";
};

const MAX_INPUT_CHARS = 60_000;

export async function extractDocumentInsights(args: {
  text: string;
  filename: string;
  jurisdictionHint?: string | null;
  language?: "en" | "ar";
}): Promise<DocumentInsights> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const text = (args.text ?? "").slice(0, MAX_INPUT_CHARS);

  if (!apiKey) return stubInsights(args.filename, args.language ?? "en");

  const system = [
    "You are a senior GCC corporate-law analyst extracting structured insights from a single document.",
    "Respond ONLY with a JSON object that matches the provided schema — no prose, no markdown fence.",
    "Be conservative: if a field cannot be determined, return null / empty array rather than guessing.",
    "For Arabic documents, populate the same English schema keys but keep proper-noun values in their original Arabic script.",
  ].join(" ");

  const userPrompt = [
    `Document filename: ${args.filename}`,
    args.jurisdictionHint ? `Likely jurisdiction (hint): ${args.jurisdictionHint}` : null,
    "",
    "Schema (TypeScript):",
    "{",
    '  "documentType": string;            // e.g. "NDA", "SHA", "Employment Agreement", "Prospectus", "Engagement Letter"',
    '  "jurisdiction": string | null;     // e.g. "DIFC", "ADGM", "DMCC", "MISA", "CMA"',
    '  "governingLaw": string | null;',
    '  "language": "en" | "ar" | "mixed" | "other";',
    '  "parties": Array<{ "name": string; "role": string }>;',
    '  "keyDates": Array<{ "label": string; "iso": string | null; "raw": string }>;',
    '  "obligations": Array<{ "party": string; "obligation": string }>;   // up to 8',
    '  "risks": Array<{ "severity": "low"|"medium"|"high"; "title": string; "body": string }>;  // up to 6',
    '  "novelClauses": Array<{ "title": string; "summary": string }>;     // up to 4, clauses that diverge from market standard',
    '  "summary": string;                 // one-sentence plain-English summary',
    "}",
    "",
    "Document text:",
    "------",
    text,
    "------",
  ].filter(Boolean).join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });
    const out = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const parsed = parseInsightsJson(out);
    return { ...parsed, generatedBy: "ai" };
  } catch {
    return stubInsights(args.filename, args.language ?? "en");
  }
}

function parseInsightsJson(raw: string): Omit<DocumentInsights, "generatedBy"> {
  // Strip code fences if the model wrapped it anyway.
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  let obj: Partial<DocumentInsights> = {};
  try { obj = JSON.parse(cleaned) as Partial<DocumentInsights>; } catch { /* fall through */ }
  return {
    documentType:  typeof obj.documentType === "string" ? obj.documentType : "Document",
    jurisdiction:  typeof obj.jurisdiction === "string" ? obj.jurisdiction : null,
    governingLaw:  typeof obj.governingLaw === "string" ? obj.governingLaw : null,
    language:      obj.language === "ar" || obj.language === "mixed" || obj.language === "other" ? obj.language : "en",
    parties:       Array.isArray(obj.parties) ? obj.parties.slice(0, 12) as Party[] : [],
    keyDates:      Array.isArray(obj.keyDates) ? obj.keyDates.slice(0, 12) as DateEntry[] : [],
    obligations:   Array.isArray(obj.obligations) ? obj.obligations.slice(0, 8) as Obligation[] : [],
    risks:         Array.isArray(obj.risks) ? obj.risks.slice(0, 6) as Risk[] : [],
    novelClauses:  Array.isArray(obj.novelClauses) ? obj.novelClauses.slice(0, 4) as Clause[] : [],
    summary:       typeof obj.summary === "string" ? obj.summary : "",
  };
}

function stubInsights(filename: string, language: "en" | "ar"): DocumentInsights {
  const isAr = language === "ar";
  return {
    documentType: isAr ? "وثيقة" : "Document",
    jurisdiction: null,
    governingLaw: null,
    language,
    parties: [],
    keyDates: [],
    obligations: [],
    risks: [
      {
        severity: "low",
        title: isAr ? "تشغيل تجريبي" : "AI auto-extraction is in stub mode",
        body: isAr
          ? `لم يتم تعيين ANTHROPIC_API_KEY، لذلك لم تُستخرج بيانات حقيقية من ${filename}. عيّن المفتاح لتفعيل استخراج الأطراف والتواريخ والمخاطر.`
          : `ANTHROPIC_API_KEY is unset, so no real data was extracted from ${filename}. Set the key to enable extraction of parties, dates, obligations and risks.`,
      },
    ],
    novelClauses: [],
    summary: isAr
      ? "تم رفع الوثيقة وتحليل نصها. عيّن مفتاح Anthropic لاستخراج البصائر التلقائية."
      : "Document uploaded and parsed. Set the Anthropic key to populate auto-extracted insights.",
    generatedBy: "stub",
  };
}
