/**
 * Word-level diff. Wraps the `diff` package and shapes output for the
 * VersionCompare UI: an ordered list of segments tagged added / removed /
 * equal, plus rollup counters.
 */
import { diffWordsWithSpace, type Change } from "diff";

export type DiffSegment = { kind: "added" | "removed" | "equal"; text: string };
export type DiffSummary = { segments: DiffSegment[]; added: number; removed: number; unchanged: number };

export function diffText(a: string, b: string): DiffSummary {
  const changes: Change[] = diffWordsWithSpace(a ?? "", b ?? "");
  const segments: DiffSegment[] = [];
  let added = 0, removed = 0, unchanged = 0;
  for (const c of changes) {
    const kind: DiffSegment["kind"] = c.added ? "added" : c.removed ? "removed" : "equal";
    segments.push({ kind, text: c.value });
    if (kind === "added") added += c.value.length;
    else if (kind === "removed") removed += c.value.length;
    else unchanged += c.value.length;
  }
  return { segments, added, removed, unchanged };
}
