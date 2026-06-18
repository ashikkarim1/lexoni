/**
 * Single source of truth for status → tone mappings. Imported by every page
 * that renders a status badge so visual treatment never drifts.
 */
import type { Tone } from "@/components/ui/Badge";

/** Matter document slot — ordered status flow. */
export const SLOT_STATUS_TONE: Record<string, Tone> = {
  not_started:        "neutral",
  drafting:           "info",
  in_review:          "warning",
  approved:           "success",
  out_for_signature:  "warning",
  signed:             "success",
  filed:              "success",
  waived:             "neutral",
};

/** Severity (blockers, leakage). */
export const SEVERITY_TONE: Record<string, Tone> = {
  critical: "danger",
  high:     "danger",
  medium:   "warning",
  low:      "neutral",
};

/** Conflict outcome. */
export const CONFLICT_OUTCOME_TONE: Record<string, Tone> = {
  clear:     "success",
  potential: "warning",
  confirmed: "danger",
  waived:    "neutral",
};

/** Promotion-readiness band. */
export const PROMOTION_BAND_TONE: Record<string, Tone> = {
  overdue:     "danger",
  ready:       "success",
  approaching: "warning",
  developing:  "info",
  not_yet:     "neutral",
};

/** Access-log action. */
export const ACCESS_ACTION_TONE: Record<string, Tone> = {
  view:     "neutral",
  download: "info",
  export:   "warning",
  print:    "neutral",
};
