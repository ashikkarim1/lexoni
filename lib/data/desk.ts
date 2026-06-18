/**
 * Desk + Firm Pulse data layer. Pages must NOT import from `@/lib/mock`
 * directly — they import from here so the mock-vs-DB switch is hidden
 * behind a stable module boundary.
 *
 * Today these return the canonical demo dataset; once performance_snapshots,
 * firm_vitality_snapshots, matter_blockers and leakage_alerts are seeded
 * (and the columns reconciled), each function flips to a Drizzle query.
 */
import type { Session } from "@/lib/auth/session";
import {
  performance as mockPerformance,
  blockers as mockBlockers,
  firmVitality as mockVitality,
  leakage as mockLeakage,
  throughputByMonth as mockThroughput,
} from "@/lib/mock";

export type PerformanceRow = (typeof mockPerformance)[number];
export type BlockerRow = (typeof mockBlockers)[number];

export async function listPerformanceForFirm(_session: Session): Promise<PerformanceRow[]> {
  return mockPerformance;
}

export async function listBlockersForFirm(_session: Session): Promise<BlockerRow[]> {
  return mockBlockers;
}

export async function getFirmVitality(_session: Session) {
  return mockVitality;
}

export async function listLeakageAlerts(_session: Session) {
  return mockLeakage;
}

export async function getThroughput(_session: Session) {
  return mockThroughput;
}
