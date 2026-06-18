/* eslint-disable no-console */
/**
 * Sprint 12 — seed the eight global process packs.
 *
 *   DATABASE_URL=postgres://...  npm run db:push && tsx scripts/seed-packs.ts
 *
 * Idempotent: skips packs that already exist by (kind, title, jurisdiction).
 */
import * as fs from "node:fs";
import * as path from "node:path";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnvLocal();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set — refusing to seed.");
    process.exit(1);
  }
  const { db } = await import("../lib/db/client");
  const { seedProcessPacks, PROCESS_PACKS } = await import("../lib/seed/process-packs");
  console.log(`Seeding ${PROCESS_PACKS.length} process packs…`);
  const result = await seedProcessPacks(db);
  console.log(`✓ ${result.inserted} inserted · ${result.skipped} already existed`);
  for (const p of PROCESS_PACKS) {
    console.log(`  · ${p.kind.padEnd(22)} ${p.title}${p.jurisdiction ? ` (${p.jurisdiction})` : ""}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
