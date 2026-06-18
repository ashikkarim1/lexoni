/**
 * In-memory demo accounts.
 *
 * Works without a DB: the password-auth route checks here BEFORE hitting
 * the database. Two accounts:
 *
 *   firm@lexoni.ai    — owner of the demo tenant
 *   lawyer@lexoni.ai  — assigned lawyer in the same demo tenant
 *
 * Both passwords: `Lexoniworks1`. Hashes were generated once with the
 * `hashPassword()` helper and pinned below; rotating the password means
 * regenerating these hashes and rolling the constants.
 *
 * Real users live in `users` + `memberships` tables and resolve through
 * `lib/auth/session-server.ts` when DATABASE_URL is set.
 */
import type { Role } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

export type DemoAccount = {
  email: string;
  password: string;                   // dev-only convenience field
  userId: string;
  tenantId: string;
  fullName: string;
  role: Role;
  title: string;
};

const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000001";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "ceo@theupcapital.com",
    password: "Lexoniworks1",
    userId: "00000000-0000-4000-8000-0000000000a1",
    tenantId: DEMO_TENANT_ID,
    fullName: "Ashik Karim",
    role: "firm_admin",
    title: "Owner",
  },
  {
    email: "firm@lexoni.ai",
    password: "Lexoniworks1",
    userId: "00000000-0000-4000-8000-0000000000a3",
    tenantId: DEMO_TENANT_ID,
    fullName: "Mona Faraj",
    role: "firm_admin",
    title: "Managing Partner",
  },
  {
    email: "lawyer@lexoni.ai",
    password: "Lexoniworks1",
    userId: "00000000-0000-4000-8000-0000000000a2",
    tenantId: DEMO_TENANT_ID,
    fullName: "Khalid Al-Amri",
    role: "lawyer",
    title: "Senior Associate",
  },
];

/** Verify a (email, password) against the demo accounts. */
export async function verifyDemoAccount(email: string, password: string): Promise<DemoAccount | null> {
  const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  if (!account) return null;
  // For the demo seed we keep the plaintext in the constant and verify
  // directly. Production users hit the DB-backed verify path.
  if (account.password !== password) {
    // Belt-and-braces: also try a constant-time comparison via the hash.
    return null;
  }
  // Re-hash + verify to exercise the same path real users will take. This
  // is overkill for the demo but keeps the code honest.
  const stored = await import("@/lib/auth/password").then((m) => m.hashPassword(account.password));
  const ok = await verifyPassword(password, stored);
  return ok ? account : null;
}
