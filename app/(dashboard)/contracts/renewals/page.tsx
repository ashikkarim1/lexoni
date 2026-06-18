import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RefreshCw } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listExpiringContracts } from "@/lib/data/contracts";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function RenewalsPage() {
  const session = await getSession();
  const rows = await listExpiringContracts(session, 365);
  const now = Date.now();
  const daysTo = (d: Date) => Math.ceil((d.getTime() - now) / 86400_000);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={RefreshCw}
      title="Renewals"
      subtitle="Contracts coming up for renewal in the next 12 months, with AI-generated renewal drafts ready for partner review."
      bullets={["7 / 30 / 90 day reminders via email", "Auto-draft renewal terms from the executed version", "Counterparty status: silent, in talks, declined"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Renewals" subtitle={`${rows.length} contracts expiring in the next 12 months.`} />
      <Card>
        <CardHeader title="Coming up for renewal" subtitle="Sorted by soonest expiry." />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Contract</th><th>Counterparty</th><th>Expiry</th><th>Time to renew</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const d = c.expiryDate ? daysTo(c.expiryDate) : null;
                const urgent = d != null && d <= 30;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-caption text-muted">{c.kind}</div>
                    </td>
                    <td className="text-body-sm">{c.counterparty ?? "-"}</td>
                    <td className="text-caption">{c.expiryDate?.toISOString().slice(0, 10) ?? "-"}</td>
                    <td className={`text-body-sm tabular-nums ${urgent ? "text-danger-700 font-medium" : "text-muted"}`}>{d != null ? `${d} d` : "-"}</td>
                    <td><Badge tone={c.status === "executed" ? "success" : "info"}>{c.status.replace(/_/g, " ")}</Badge></td>
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
