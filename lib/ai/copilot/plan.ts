/**
 * Legal Matter Copilot — outcome → process plan.
 *
 * Given a plain-English outcome ("list on ADX", "open a Saudi subsidiary",
 * "raise a Series B in DIFC"), the planner generates a complete legal
 * execution plan:
 *
 *   {
 *     title, kind, region, jurisdiction, expectedDurationDays,
 *     steps:    [ { ordinal, name, ownerRole, expectedDurationDays, isMilestone, dependsOnOrdinals[] } ],
 *     slots:    [ { ordinal, title, expectedKind, stepOrdinal, stage } ],
 *     regulators: [ { name, role } ],
 *     risks:    [ { severity, title, mitigation } ],
 *     estimatedFeeCentsRange: [low, high],
 *     timelineConfidenceBand: { low, high },        // days, 80% band
 *     confidence: 0-100,
 *     citationsToHistoricals: [ matterId, ... ],
 *   }
 *
 * The planner is grounded in two things:
 *   (a) The platform's existing global process packs (PROCESS_PACKS) — used
 *       as few-shot exemplars for shape.
 *   (b) The firm's institutional memory — the top-N retrieved chunks for
 *       the outcome are passed as context so the plan is shaped by *this*
 *       firm's historicals when they exist.
 *
 * Falls back to a deterministic plan picker (matches against PROCESS_PACKS
 * by keyword) when no Anthropic key is set, so the demo works offline.
 */
import { retrieve } from "@/lib/knowledge";
import { PROCESS_PACKS } from "@/lib/seed/process-packs";
import type { Session } from "@/lib/auth/session";

export type CopilotPlanStep = {
  ordinal: number;
  name: string;
  nameAr?: string;
  ownerRole?: string;
  expectedDurationDays?: number;
  isMilestone?: boolean;
  dependsOnOrdinals?: number[];
};

export type CopilotPlanSlot = {
  ordinal: number;
  title: string;
  titleAr?: string;
  expectedKind: string;
  stepOrdinal: number;
  stage?: string;
  required?: boolean;
};

export type CopilotPlan = {
  title: string;
  kind: string;
  region: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL";
  jurisdiction: string | null;
  expectedDurationDays: number;
  defaultFeeModel: "hourly" | "fixed" | "retainer" | "milestone";
  steps: CopilotPlanStep[];
  slots: CopilotPlanSlot[];
  regulators: Array<{ name: string; role: string }>;
  risks: Array<{ severity: "low" | "medium" | "high"; title: string; mitigation: string }>;
  estimatedFeeCentsRange: [number, number];
  timelineConfidenceBand: { low: number; high: number };
  confidence: number;
  citationsToHistoricals: Array<{ id: string; title: string; sourceKind: string }>;
  modelLabel: string;
};

export async function generatePlan(
  session: Session,
  args: { outcome: string; region?: "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL"; jurisdiction?: string | null },
): Promise<CopilotPlan> {
  const outcome = args.outcome.trim();
  if (!outcome) throw new Error("outcome is required");

  // Retrieve firm historicals — bounded so the prompt stays small.
  const chunks = await retrieve(session, outcome, { limit: 6 });
  const citations = chunks.map((c) => ({ id: c.sourceId, title: c.sourceTitle, sourceKind: c.sourceKind }));

  // Pick a baseline pack — closest-matching global pack by keyword. Even
  // when the AI is on, this serves as a deterministic anchor.
  const baseline = pickClosestPack(outcome);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const plan = await generatePlanWithAnthropic(outcome, baseline, chunks, args);
      return { ...plan, citationsToHistoricals: citations, modelLabel: "claude" };
    } catch {
      return { ...deterministicPlan(outcome, baseline, args), citationsToHistoricals: citations, modelLabel: "deterministic-fallback" };
    }
  }
  return { ...deterministicPlan(outcome, baseline, args), citationsToHistoricals: citations, modelLabel: "deterministic" };
}

function pickClosestPack(outcome: string) {
  const q = outcome.toLowerCase();
  // Tuned keyword → pack mapping for the eight global packs.
  if (/(adx|abu dhabi|securities exchange)/i.test(outcome) && /(list|ipo|public)/i.test(outcome)) return PROCESS_PACKS.find((p) => p.title.includes("ADX"))!;
  if (/(nasdaq dubai|dfsa|difc)/i.test(outcome) && /(list|ipo|public)/i.test(outcome)) return PROCESS_PACKS.find((p) => p.title.includes("Nasdaq Dubai"))!;
  if (/(tadawul|saudi exchange)/i.test(outcome) && /(list|ipo|public)/i.test(outcome)) return PROCESS_PACKS.find((p) => p.title.includes("ADX"))!; // closest baseline
  if (/(fund|qif|rfl|spv)/.test(q)) return PROCESS_PACKS.find((p) => p.title.includes("Fund launch"))!;
  if (/(patent|invention|trademark)/.test(q)) return PROCESS_PACKS.find((p) => p.title.includes("Patent"))!;
  if (/(litigat|court|claim|dispute|sue|defen)/.test(q)) return PROCESS_PACKS.find((p) => p.title.includes("Litigation"))!;
  if (/(employ|terminat|mohre|mol|grievance|labour)/.test(q)) return PROCESS_PACKS.find((p) => p.title.includes("Employment"))!;
  if (/(acquir|buy.?side|target|bidder)/.test(q)) return PROCESS_PACKS.find((p) => p.title.includes("Buy-side"))!;
  if (/(sell.?side|dispos|exit|sale of)/.test(q)) return PROCESS_PACKS.find((p) => p.title.includes("Sell-side"))!;
  // Default: M&A buy-side as the most generic deal pack.
  return PROCESS_PACKS.find((p) => p.title.includes("Buy-side"))!;
}

function deterministicPlan(outcome: string, base: typeof PROCESS_PACKS[number], args: { region?: CopilotPlan["region"]; jurisdiction?: string | null }): Omit<CopilotPlan, "citationsToHistoricals" | "modelLabel"> {
  return {
    title: `${base.title} — derived from: "${outcome}"`,
    kind: base.kind,
    region: args.region ?? base.region as CopilotPlan["region"],
    jurisdiction: args.jurisdiction ?? base.jurisdiction,
    expectedDurationDays: base.expectedDurationDays,
    defaultFeeModel: base.defaultFeeModel,
    steps: base.steps.map((st) => ({
      ordinal: st.ordinal,
      name: st.name,
      nameAr: st.nameAr,
      ownerRole: st.ownerRole,
      expectedDurationDays: st.expectedDurationDays,
      isMilestone: st.isMilestone,
      dependsOnOrdinals: st.dependsOnOrdinals,
    })),
    slots: base.slots.map((sl) => ({
      ordinal: sl.ordinal,
      title: sl.title,
      titleAr: sl.titleAr,
      expectedKind: sl.expectedKind,
      stepOrdinal: sl.stepOrdinal,
      stage: sl.stage,
      required: sl.required,
    })),
    regulators: regulatorsForPack(base),
    risks: defaultRisks(base.kind, outcome),
    estimatedFeeCentsRange: feeRangeFor(base),
    timelineConfidenceBand: { low: Math.round(base.expectedDurationDays * 0.85), high: Math.round(base.expectedDurationDays * 1.25) },
    confidence: 55, // deterministic — capped below the AI's confidence to make it clear
  };
}

function regulatorsForPack(p: typeof PROCESS_PACKS[number]): Array<{ name: string; role: string }> {
  const t = p.title.toLowerCase();
  if (t.includes("adx")) return [
    { name: "ADX", role: "Listing authority" },
    { name: "SCA (UAE Securities and Commodities Authority)", role: "Prospectus approval" },
  ];
  if (t.includes("nasdaq dubai")) return [
    { name: "Nasdaq Dubai", role: "Listing authority" },
    { name: "DFSA", role: "Prospectus approval (DIFC)" },
  ];
  if (t.includes("fund launch")) return [
    { name: "FSRA (ADGM)", role: "Fund authorisation" },
    { name: "DFSA (DIFC)", role: "Alternative authorisation" },
    { name: "CIMA (Cayman)", role: "Feeder vehicle authorisation" },
  ];
  if (t.includes("employment")) return [
    { name: "MoHRE (UAE)", role: "Conciliation & enforcement" },
    { name: "MoL (KSA)", role: "Conciliation & enforcement" },
  ];
  if (t.includes("patent")) return [{ name: "Patent Office (UAE / KSA / GCC)", role: "Examination + grant" }];
  if (t.includes("litigation")) return [{ name: "Civil Court", role: "First-instance + appeal" }];
  return [];
}

function defaultRisks(kind: string, outcome: string): Array<{ severity: "low" | "medium" | "high"; title: string; mitigation: string }> {
  const risks: Array<{ severity: "low" | "medium" | "high"; title: string; mitigation: string }> = [];
  if (kind === "go_public") {
    risks.push(
      { severity: "high", title: "Regulator timing risk — prospectus comments cycle", mitigation: "Pre-filing meeting with the authority; bank pre-clearance of audit." },
      { severity: "medium", title: "Market window risk", mitigation: "Flexible deal windows; build out a contingent debt facility." },
      { severity: "medium", title: "Related-party transaction disclosure", mitigation: "Independent committee + fairness opinion." },
    );
  } else if (kind === "ma_buyside" || kind === "ma_sellside") {
    risks.push(
      { severity: "high",   title: "Concentration of warranties / indemnity caps", mitigation: "W&I insurance + tiered cap structure." },
      { severity: "medium", title: "Foreign-investor ownership thresholds (KSA / UAE FDI)", mitigation: "Structure check + pre-clearance." },
    );
  } else if (kind === "fundraising_round") {
    risks.push(
      { severity: "medium", title: "Anchor-investor side letters",       mitigation: "Most-favoured-nation clause for early committers." },
      { severity: "medium", title: "Regulator timing on fund authorisation", mitigation: "Pre-filing engagement; phased close." },
    );
  } else if (kind === "dispute_litigation") {
    risks.push(
      { severity: "high",   title: "Limitation / time-bar exposure",     mitigation: "Demand letter + protective filing." },
      { severity: "medium", title: "Adverse cost award",                  mitigation: "ATE insurance or staged budget review." },
    );
  } else if (kind === "employment_matter") {
    risks.push({ severity: "high", title: "Statutory conciliation window", mitigation: "File the conciliation request inside the statutory window — don't litigate first." });
  }
  if (/saudi|ksa/i.test(outcome)) {
    risks.push({ severity: "medium", title: "Nitaqat / Saudisation compliance", mitigation: "Check workforce ratio pre-close; flag in the SPA." });
  }
  return risks;
}

function feeRangeFor(p: typeof PROCESS_PACKS[number]): [number, number] {
  // Heuristic fee ranges in cents (USD). Deliberately wide for the demo.
  const t = p.title.toLowerCase();
  if (t.includes("adx") || t.includes("nasdaq dubai")) return [120_000_00, 350_000_00];
  if (t.includes("fund launch")) return [50_000_00, 150_000_00];
  if (t.includes("ma —")) return [80_000_00, 250_000_00];
  if (t.includes("patent")) return [8_000_00, 25_000_00];
  if (t.includes("litigation")) return [35_000_00, 120_000_00];
  if (t.includes("employment")) return [6_000_00, 18_000_00];
  return [20_000_00, 80_000_00];
}

async function generatePlanWithAnthropic(
  outcome: string,
  baseline: typeof PROCESS_PACKS[number],
  chunks: Awaited<ReturnType<typeof retrieve>>,
  args: { region?: CopilotPlan["region"]; jurisdiction?: string | null },
): Promise<Omit<CopilotPlan, "citationsToHistoricals" | "modelLabel">> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sys = `You are a senior partner at a GCC law firm. Generate a legal execution plan from the user's plain-English outcome.

Output ONLY a JSON object matching this shape — no commentary:

{
  "title": "M&A — Buy-side mandate", "kind": "ma_buyside",
  "region": "UAE", "jurisdiction": "ADGM",
  "expectedDurationDays": 180, "defaultFeeModel": "milestone",
  "steps": [{"ordinal":1, "name":"...", "ownerRole":"partner|associate|lawyer|paralegal|client|regulator", "expectedDurationDays":3, "isMilestone":true, "dependsOnOrdinals":[]}],
  "slots": [{"ordinal":1, "title":"...", "expectedKind":"SPA|LOI|NDA|...", "stepOrdinal":1, "stage":"Origination", "required":true}],
  "regulators": [{"name":"...", "role":"..."}],
  "risks": [{"severity":"low|medium|high", "title":"...", "mitigation":"..."}],
  "estimatedFeeCentsRange": [low, high],
  "timelineConfidenceBand": {"low": days, "high": days},
  "confidence": 0-100
}

Anchor your plan on the firm's historicals when present (cite by index [n] in step names). When historicals are sparse, mirror the structure of the supplied baseline pack but tailor the names + risks to the outcome.

Use one of these kinds: ma_buyside, ma_sellside, go_public, joint_venture, fundraising_round, licensing_regulatory, dispute_litigation, employment_matter, company_formation, restructuring, other.
Region MUST be one of: UAE, KSA, QAT, BHR, KWT, OMN, GLOBAL.`;

  const baselineDigest = `
Baseline pack: ${baseline.title} (${baseline.kind}, ${baseline.expectedDurationDays}d)
Steps: ${baseline.steps.map((s) => `${s.ordinal}. ${s.name}`).join("; ")}
Slots: ${baseline.slots.map((s) => `${s.ordinal}. ${s.title} (${s.expectedKind})`).join("; ")}`;

  const historicalsDigest = chunks.length === 0
    ? "(No firm historicals retrieved for this outcome.)"
    : chunks.map((c, i) => `[${i + 1}] ${c.sourceKind} · ${c.sourceTitle}: ${c.text.slice(0, 360)}`).join("\n");

  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 3500,
    system: sys,
    messages: [{
      role: "user",
      content: `Outcome: ${outcome}\nDesired region: ${args.region ?? "UAE"}\nDesired jurisdiction: ${args.jurisdiction ?? "(any)"}\n\n${baselineDigest}\n\nFirm historicals:\n${historicalsDigest}\n\nReturn the JSON plan now.`,
    }],
  });

  const block = msg.content.find((b) => b.type === "text");
  const raw = block && "text" in block ? block.text : "";
  const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonStr) throw new Error("Planner did not return JSON.");
  const parsed = JSON.parse(jsonStr) as Omit<CopilotPlan, "citationsToHistoricals" | "modelLabel">;

  // Normalise + guard.
  parsed.confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 60)));
  if (!parsed.estimatedFeeCentsRange || parsed.estimatedFeeCentsRange.length !== 2) {
    parsed.estimatedFeeCentsRange = feeRangeFor(baseline);
  }
  if (!parsed.timelineConfidenceBand) {
    parsed.timelineConfidenceBand = { low: Math.round(parsed.expectedDurationDays * 0.85), high: Math.round(parsed.expectedDurationDays * 1.25) };
  }
  return parsed;
}
