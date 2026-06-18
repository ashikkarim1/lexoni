/**
 * Companies + corporate-secretary read layer. Backs /companies, /directors,
 * /shareholders, /officers (officers live on the same table as directors via
 * role), /captable, /ownership. Tenant-scoped reads only.
 */
import { asc, eq, inArray } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import type { Session } from "@/lib/auth/session";

export type CompanyRow = {
  id: string;
  legalName: string;
  legalNameAr: string | null;
  jurisdiction: string;
  region: string;
  licenseNo: string | null;
  incorporationDate: Date | null;
  status: string;
  parentCompanyId: string | null;
};

export async function listCompanies(session: Session): Promise<CompanyRow[]> {
  if (!dbReady) return [];
  return db
    .select()
    .from(s.companies)
    .where(tenantScope(session, s.companies))
    .orderBy(asc(s.companies.legalName));
}

export type DirectorRow = {
  id: string;
  companyId: string;
  companyName: string;
  fullName: string;
  nationality: string | null;
  role: string;
  appointedAt: Date | null;
  resignedAt: Date | null;
};

export async function listOfficers(session: Session, opts: { role?: "director" | "officer" } = {}): Promise<DirectorRow[]> {
  if (!dbReady) return [];
  const rows = await db
    .select({
      id: s.directors.id,
      companyId: s.directors.companyId,
      companyName: s.companies.legalName,
      fullName: s.directors.fullName,
      nationality: s.directors.nationality,
      role: s.directors.role,
      appointedAt: s.directors.appointedAt,
      resignedAt: s.directors.resignedAt,
    })
    .from(s.directors)
    .innerJoin(s.companies, eq(s.companies.id, s.directors.companyId))
    .where(tenantScope(session, s.companies))
    .orderBy(asc(s.companies.legalName), asc(s.directors.fullName));
  if (!opts.role) return rows;
  // Treat "director" / "chair" / "independent" as directors; everything else as officer.
  const isDirectorRole = (r: string) => /director|chair|independent|observer/i.test(r);
  return rows.filter((r) => opts.role === "director" ? isDirectorRole(r.role) : !isDirectorRole(r.role));
}

export type ShareholderRow = {
  id: string;
  companyId: string;
  companyName: string;
  holderName: string;
  holderKind: string;
  countryOfResidence: string | null;
  isUbo: boolean;
};

export async function listShareholders(session: Session): Promise<ShareholderRow[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.shareholders.id,
      companyId: s.shareholders.companyId,
      companyName: s.companies.legalName,
      holderName: s.shareholders.holderName,
      holderKind: s.shareholders.holderKind,
      countryOfResidence: s.shareholders.countryOfResidence,
      isUbo: s.shareholders.isUbo,
    })
    .from(s.shareholders)
    .innerJoin(s.companies, eq(s.companies.id, s.shareholders.companyId))
    .where(tenantScope(session, s.companies))
    .orderBy(asc(s.companies.legalName));
}

export type CapTableEntry = {
  id: string;
  companyId: string;
  companyName: string;
  shareholderName: string;
  shareClassName: string;
  quantity: number;
  parValueCents: number;
  certificateNo: string | null;
  issuedAt: Date;
};

export async function listCapTable(session: Session): Promise<CapTableEntry[]> {
  if (!dbReady) return [];
  return db
    .select({
      id: s.captableEntries.id,
      companyId: s.captableEntries.companyId,
      companyName: s.companies.legalName,
      shareholderName: s.shareholders.holderName,
      shareClassName: s.shareClasses.name,
      quantity: s.captableEntries.quantity,
      parValueCents: s.shareClasses.parValueCents,
      certificateNo: s.captableEntries.certificateNo,
      issuedAt: s.captableEntries.issuedAt,
    })
    .from(s.captableEntries)
    .innerJoin(s.companies, eq(s.companies.id, s.captableEntries.companyId))
    .innerJoin(s.shareholders, eq(s.shareholders.id, s.captableEntries.shareholderId))
    .innerJoin(s.shareClasses, eq(s.shareClasses.id, s.captableEntries.shareClassId))
    .where(tenantScope(session, s.companies));
}

void inArray;
