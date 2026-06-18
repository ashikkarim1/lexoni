import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldAlert } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listContracts } from "@/lib/data/contracts";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function RiskPage() {
  const session = await getSession();
  const rows = (await listContracts(session)).sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={ShieldAlert}
      title="Contract risk"
      subtitle="AI-derived risk score (0-100) across every contract - highlights uncapped liability, broad indemnity, IP assignment, governing-law mismatch."
      bullets={["Per-clause risk attribution", "Drill into the source clause from any flag", "Partner sign-off on risk acceptance"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Contract risk" subtitle="AI-derived risk · highest first." />
      <Card>
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Contract</th><th>Counterparty</th><th>Region</th><th>Risk</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.title}</td>
                  <td className="text-body-sm">{c.counterparty ?? "-"}</td>
                  <td className="text-caption">{c.region}</td>
                  <td>
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                        <div className={`h-full rounded ${(c.riskScore ?? 0) > 60 ? "bg-danger-600" : (c.riskScore ?? 0) > 30 ? "bg-warning-500" : "bg-success-600"}`} style={{ width: `${c.riskScore ?? 0}%` }} />
                      </div>
                      <span className="text-caption tabular-nums">{c.riskScore ?? 0}</span>
                    </div>
                  </td>
                  <td><Badge tone="info">{c.status.replace(/_/g, " ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
