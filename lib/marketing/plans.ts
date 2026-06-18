/**
 * Marketing pricing tiers used by the landing page and the in-product
 * /pricing screen. Lives outside `@/lib/mock` because this is real
 * product pricing, not demo data — moving it here lets pages avoid the
 * mock import path while we keep one canonical source.
 */
export { plans, type Plan } from "@/lib/mock";
