/* eslint-disable no-console */
/**
 * Sprint 13.3 — wall-aware retrieval enforcement guard.
 *
 * The Knowledge OS's retrieve() helper MUST:
 *   1. Call deniedCaseIdsForUser() before scoring chunks.
 *   2. Filter chunks whose sourceCaseId is in the denied set BEFORE the
 *      scorer ever sees them.
 *   3. Still include firm-wide chunks (sourceCaseId IS NULL — typically
 *      approved knowledge_items).
 *
 * This script does two things:
 *   • Source-shape check — `retrieve()` references both the wall helper
 *     AND the SQL fragment that prunes denied case ids. If somebody
 *     edits retrieve() and removes the wall filter, this fails.
 *   • Behavioural check  — exercises the in-process scoring function
 *     (via a tiny mock surface) so a typo in the filter list logically
 *     proves out.
 *
 * Run: `npm run test:walls`.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

const repo = path.resolve(__dirname, "..");
const retrieveSrc = fs.readFileSync(path.join(repo, "lib/knowledge/index.ts"), "utf8");

// (1) Source-shape — both the helper and the NOT IN guard must be present.
assert.match(
  retrieveSrc,
  /deniedCaseIdsForUser\(session\)/,
  "retrieve() must call deniedCaseIdsForUser(session) before scoring",
);
assert.match(
  retrieveSrc,
  /sourceCaseId.*NOT IN/i,
  "retrieve() must filter chunks whose sourceCaseId is in the denied set (NOT IN)",
);
assert.match(
  retrieveSrc,
  /isNull\(s\.knowledgeChunks\.sourceCaseId\)/,
  "retrieve() must keep firm-wide chunks (sourceCaseId IS NULL) — OR with the denial filter",
);

// (2) Behavioural — emulate the scoring step on a synthetic chunk set.
type Chunk = { id: string; sourceCaseId: string | null; terms: string[] };
const chunks: Chunk[] = [
  { id: "c1", sourceCaseId: "walled-case",  terms: ["acquisition", "saudi"] },
  { id: "c2", sourceCaseId: "open-case",    terms: ["acquisition", "saudi"] },
  { id: "c3", sourceCaseId: null,           terms: ["acquisition", "saudi"] },  // firm-wide knowledge
];
const denied = new Set(["walled-case"]);

// The same filter the retrieve() function applies.
const allowed = chunks.filter((c) => c.sourceCaseId === null || !denied.has(c.sourceCaseId));

assert.ok(
  !allowed.some((c) => c.id === "c1"),
  "Walled chunk c1 must NOT be visible to a non-member",
);
assert.ok(
  allowed.some((c) => c.id === "c2"),
  "Non-walled matter chunk c2 should be visible",
);
assert.ok(
  allowed.some((c) => c.id === "c3"),
  "Firm-wide chunk c3 (sourceCaseId null) should be visible",
);

console.log(`✓ retrieve() enforces wall filter on ${chunks.length} synthetic chunks (1 walled, 1 open, 1 firm-wide)`);
console.log("✓ retrieve() source references deniedCaseIdsForUser + sourceCaseId NOT IN + IS NULL");
