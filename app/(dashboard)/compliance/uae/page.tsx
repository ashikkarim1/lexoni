import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listFilings } from "@/lib/data/compliance";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function UaeCompliancePage() {
  const session = await getSession();
  const rows = (await listFilings(session)).filter((r) => r.region === "UAE");
  if (rows.length === 0) return (
    <ModuleEmpty
      icon={ShieldCheck}
      title="UAE compliance"
      subtitle="ADGM, DIFC, DMCC, IFZA, DED, RAKEZ - annual confirmations, trade-license renewals, ESR, UBO, PDPL."
      bullets={["Filings land on /compliance/calendar", "T-30 / T-7 / T-1 reminders to the assignee", "Evidence URL + audit trail on every filed task"]}
      primary={{ label: "Open the compliance calendar", href: "/compliance/calendar" }}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="UAE compliance" subtitle={`${rows.length} active UAE filings.`} />
      <Card>
        <CardHeader title="Filings" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Filing</th><th>Regulator</th><th>Company</th><th>Due</th><th>Severity</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.title}</td>
                  <td><Badge tone="info">{r.regulator}</Badge></td>
                  <td className="text-body-sm">{r.companyName ?? "-"}</td>
                  <td className="text-caption">{r.dueAt.toISOString().slice(0, 10)}</td>
                  <td><Badge tone={r.severity === "critical" || r.severity === "high" ? "danger" : "warning"}>{r.severity}</Badge></td>
                  <td><Badge tone={r.status === "filed" ? "success" : r.status === "overdue" ? "danger" : "info"}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
