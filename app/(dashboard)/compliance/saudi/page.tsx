import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listFilings } from "@/lib/data/compliance";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function SaudiCompliancePage() {
  const session = await getSession();
  const rows = (await listFilings(session)).filter((r) => r.region === "KSA");
  if (rows.length === 0) return (
    <ModuleEmpty
      icon={ShieldCheck}
      title="Saudi compliance"
      subtitle="MISA, CMA, ZATCA, Qiwa, Muqeem - VAT, Nitaqat, MISA license, CMA filings."
      bullets={["Filings land on /compliance/calendar", "T-30 / T-7 / T-1 reminders to the assignee", "ZATCA e-invoicing under hardening"]}
      primary={{ label: "Open the compliance calendar", href: "/compliance/calendar" }}
    />
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Saudi compliance" subtitle={`${rows.length} active KSA filings.`} />
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
