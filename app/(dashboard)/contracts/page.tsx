import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileText } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listContracts } from "@/lib/data/contracts";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

const STATUS_TONE: Record<string, "info" | "warning" | "success" | "neutral" | "danger"> = {
  draft: "neutral", in_review: "info", negotiating: "warning",
  out_for_signature: "warning", executed: "success", expired: "neutral", terminated: "danger",
};

export default async function ContractsPage() {
  const session = await getSession();
  const rows = await listContracts(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={FileText}
      title="Contracts"
      subtitle="Every active contract across your client book - NDAs, SHAs, employment, service, JV, distribution - with risk score and lifecycle status."
      bullets={["Risk-scored contract list with AI-derived 0-100", "Renewal calendar with 7 / 30 / 90 day reminders", "Obligation extraction from executed contracts"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" subtitle={`${rows.length} contracts across your book.`} />
      <Card>
        <CardHeader title="Contract register" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Title</th><th>Kind</th><th>Counterparty</th><th>Region</th><th>Status</th><th>Risk</th><th>Expiry</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.title}</td>
                  <td><Badge tone="info">{c.kind}</Badge></td>
                  <td className="text-body-sm">{c.counterparty ?? "-"}</td>
                  <td className="text-caption">{c.region}</td>
                  <td><Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{c.status.replace(/_/g, " ")}</Badge></td>
                  <td>
                    <div className="flex items-center gap-2 w-24">
                      <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                        <div className={`h-full rounded ${(c.riskScore ?? 0) > 60 ? "bg-danger-600" : (c.riskScore ?? 0) > 30 ? "bg-warning-500" : "bg-success-600"}`} style={{ width: `${c.riskScore ?? 0}%` }} />
                      </div>
                      <span className="text-caption tabular-nums">{c.riskScore ?? 0}</span>
                    </div>
                  </td>
                  <td className="text-caption text-muted">{c.expiryDate?.toISOString().slice(0, 10) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
