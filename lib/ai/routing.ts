/**
 * Routing engine.
 *
 * Takes a classified intake (sector + legal function + region + language)
 * and produces an ordered short-list of lawyers:
 *
 *   1. Evaluate routing rules top-down by priority. First match → primary
 *      candidate + optional fallbacks.
 *   2. Score every lawyer via their expertise registry. The rule's pick is
 *      always included, plus the top-3 highest-scoring lawyers regardless,
 *      so the triage partner has alternatives.
 *
 * Pure / deterministic — easy to unit-test, no LLM calls.
 */
import type { Intake, RoutingRule, Expertise } from "@/lib/mock";

export type RouteCandidate = {
  userId?: string;
  name: string;
  score: number;     // 0-100
  reasons: string[];
  fromRuleId?: string;
};

export function routeIntake(
  intake: Intake,
  rules: RoutingRule[],
  expertise: Expertise[],
): { primary: RouteCandidate; alternates: RouteCandidate[] } {
  const sorted = [...rules].filter((r) => r.active).sort((a, b) => a.priority - b.priority);

  const matchRule = (r: RoutingRule) => {
    const sectorOk   = r.sectors.length === 0   || r.sectors.includes(intake.aiSector);
    const functionOk = r.functions.length === 0 || r.functions.includes(intake.aiFunction);
    const regionOk   = r.regions.length === 0   || r.regions.includes(intake.region);
    return sectorOk && functionOk && regionOk;
  };

  const hit = sorted.find(matchRule);

  const scored = expertise.map((e) => {
    const reasons: string[] = [];
    let score = 0;
    if (e.sectors.includes(intake.aiSector))     { score += 35; reasons.push(`sector match: ${intake.aiSector}`); }
    if (e.functions.includes(intake.aiFunction)) { score += 35; reasons.push(`function match: ${intake.aiFunction}`); }
    if (e.regions.includes(intake.region))       { score += 20; reasons.push(`region match: ${intake.region}`); }
    if (e.languages.includes(intake.language))   { score += 10; reasons.push(`language match: ${intake.language}`); }
    return { userId: e.userId, name: e.name, score, reasons } satisfies RouteCandidate;
  }).sort((a, b) => b.score - a.score);

  const primary: RouteCandidate = hit
    ? {
        name: hit.assignTo,
        score: 100,
        reasons: [`matched rule: "${hit.name}" (priority ${hit.priority})`],
        fromRuleId: hit.id,
      }
    : scored[0] ?? { name: "Triage queue", score: 0, reasons: ["no rule matched, no expertise data"] };

  const alternates = scored.filter((c) => c.name !== primary.name).slice(0, 3);
  return { primary, alternates };
}
