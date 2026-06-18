/**
 * Enums shared between schema.ts and schema.process.ts.
 *
 * Lives in its own file to avoid a CJS load-order cycle: schema.ts ends with
 * `export * from "./schema.process"`, esbuild's CJS transform hoists that
 * re-export to the top of the module, and schema.process.ts then accesses
 * `regionEnum` before schema.ts has finished initialising its consts —
 * `ReferenceError: Cannot access 'regionEnum' before initialization`.
 *
 * Keep cross-file enums here; both schemas re-export so existing
 * `import { regionEnum } from "@/lib/db/schema"` callers keep working.
 */
import { pgEnum } from "drizzle-orm/pg-core";

export const regionEnum = pgEnum("region", ["UAE", "KSA", "QAT", "BHR", "KWT", "OMN", "GLOBAL"]);
