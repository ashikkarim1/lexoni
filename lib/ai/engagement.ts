/**
 * Engagement letter generator.
 *
 * In production this calls the AI service with a region-aware template
 * + the intake summary. Here it composes the markdown deterministically so
 * the scaffold renders the same body the AI would.
 */
import type { Intake } from "@/lib/mock";

export type EngagementDraft = {
  scopeOfWork: string;
  feeArrangement: "fixed" | "hourly" | "retainer" | "hybrid" | "contingency";
  feeQuoteUsd: number;
  bodyMd: string;
};

const feeMatrix: Record<string, EngagementDraft["feeArrangement"]> = {
  fundraising:  "fixed",
  ma:           "hybrid",
  litigation:   "hourly",
  arbitration:  "hourly",
  regulatory:   "retainer",
  tax:          "retainer",
  ip_trademark: "fixed",
  ip_patent:    "fixed",
};

const quoteMatrix: Record<string, number> = {
  fundraising: 45_000, ma: 120_000, litigation: 35_000, arbitration: 80_000,
  regulatory: 18_000, tax: 22_000, ip_trademark: 6_000, ip_patent: 18_000,
};

export function draftEngagementLetter(intake: Intake, firmName: string): EngagementDraft {
  const fee  = feeMatrix[intake.aiFunction]  ?? "hourly";
  const quote = quoteMatrix[intake.aiFunction] ?? 30_000;
  const scope = `Provide legal services to ${intake.companyName} in connection with ${intake.aiFunction.replace("_", " ")} (${intake.aiSector.replace("_", " ")}) in ${intake.region}.`;

  const bodyMd = `# Engagement Letter

**Between**  ${firmName} (the "Firm")
**And**       ${intake.companyName} (the "Client")
**Matter**    ${intake.aiFunction.replace("_", " ")} — ${intake.aiSector.replace("_", " ")}
**Region**    ${intake.region}
**Reference** ${intake.reference}

## 1. Scope of services
${scope}

Specifically, the Firm will:
- Review the matter and confirm conflicts of interest within 24 hours
- Provide written advice and draft any required documents
- Represent the Client before relevant regulators or tribunals
- Maintain confidentiality consistent with applicable bar rules

## 2. Fee arrangement
**Type:** ${fee.toUpperCase()}
**Quote:** USD ${quote.toLocaleString()} (inclusive of standard disbursements; excludes VAT and out-of-pocket expert fees)

Invoicing cadence: monthly, payable within 30 days.

## 3. Data & confidentiality
The Firm processes Client data in accordance with the UAE PDPL (Federal Decree-Law No. 45 of 2021) and, where applicable, GDPR. Records of processing activities are maintained per Article 30 RoPA. Data residency: UAE primary.

## 4. Term and termination
This engagement remains in force until the matter is concluded or terminated by either party on 30 days' written notice. Either party may terminate immediately for material breach.

## 5. Governing law
This engagement is governed by the laws of ${intake.region === "KSA" ? "the Kingdom of Saudi Arabia" : "the United Arab Emirates"}. Disputes shall be referred to ${intake.region === "KSA" ? "the Saudi Center for Commercial Arbitration" : "ADGM Courts"}.

---

By signing below, the Client confirms acceptance of these terms.

| Signed for the Firm | Signed for the Client |
|---|---|
| ___________________ | ___________________ |
| Name, Title         | Name, Title         |
| Date                | Date                |
`;
  return { scopeOfWork: scope, feeArrangement: fee, feeQuoteUsd: quote, bodyMd };
}
