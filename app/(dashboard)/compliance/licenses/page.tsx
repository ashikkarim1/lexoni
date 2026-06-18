import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BadgeCheck } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import { getSession } from "@/lib/auth/session-server";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function LicensesPage() {
  const session = await getSession();
  if (!dbReady) {
    return <ModuleEmpty icon={BadgeCheck} title="License renewals" subtitle="Trade-license renewals across every managed company." />;
  }
  const rows = await db
    .select({
      id: s.licenses.id,
      companyName: s.companies.legalName,
      authority: s.licenses.authority,
      number: s.licenses.number,
      issuedAt: s.licenses.issuedAt,
      expiresAt: s.licenses.expiresAt,
      status: s.licenses.status,
    })
    .from(s.licenses)
    .innerJoin(s.companies, eq(s.companies.id, s.licenses.companyId))
    .where(tenantScope(session, s.companies))
    .orderBy(s.licenses.expiresAt);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={BadgeCheck}
      title="License renewals"
      subtitle="Trade-license renewals across every managed company. Auto-reminders 90 / 30 / 7 days before expiry."
      bullets={["Per-authority license tracking (ADGM, DIFC, DMCC, MISA, …)", "Renewal pack auto-drafted from the firm template", "Evidence URL on filing"]}
    />
  );

  const now = Date.now();
  return (
    <div className="space-y-6">
      <PageHeader title="License renewals" subtitle={`${rows.length} licenses tracked across the managed companies.`} />
      <Card>
        <CardHeader title="Licenses" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Company</th><th>Authority</th><th>Number</th><th>Issued</th><th>Expires</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((l) => {
                const days = Math.ceil((l.expiresAt.getTime() - now) / 86400_000);
                const urgent = days <= 30 && days > 0;
                const expired = days <= 0;
                return (
                  <tr key={l.id}>
                    <td className="font-medium">{l.companyName}</td>
                    <td><Badge tone="info">{l.authority}</Badge></td>
                    <td className="text-caption font-mono">{l.number}</td>
                    <td className="text-caption text-muted">{l.issuedAt.toISOString().slice(0, 10)}</td>
                    <td className={`text-caption tabular-nums ${expired ? "text-danger-700 font-medium" : urgent ? "text-warning-700" : "text-muted"}`}>{l.expiresAt.toISOString().slice(0, 10)} ({expired ? "expired" : `${days}d`})</td>
                    <td><Badge tone={l.status === "active" ? "success" : "neutral"}>{l.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
