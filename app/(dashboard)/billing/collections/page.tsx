import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { Receipt, Bell, AlertTriangle, AlertCircle } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { getAgingSummary } from "@/lib/data/collections";
import { ModuleEmpty } from "@/components/ui/ModuleShell";
import { RemindButton } from "./RemindButton";

export const dynamic = "force-dynamic";

const BUCKET_TONE: Record<string, "info" | "warning" | "danger"> = {
  "0-30": "info", "31-60": "warning", "61-90": "danger", "90+": "danger",
};

export default async function CollectionsPage() {
  const session = await getSession();
  const summary = await getAgingSummary(session);

  if (summary.rows.length === 0) {
    return <ModuleEmpty
      icon={Receipt}
      title="Collections"
      subtitle="Aging buckets, dunning automation, and per-client outstanding balances. Empty until invoices are issued."
      bullets={["0–30 / 31–60 / 61–90 / 90+ day aging", "One-click polite reminder via Resend", "Audit trail on every reminder sent"]}
    />;
  }

  const fmt = (cents: number, ccy: string) => `${ccy} ${(cents / 100).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Collections" subtitle={`${summary.rows.length} open invoices · total outstanding ${fmt(summary.totalOutstandingCents, summary.rows[0]?.currency ?? "AED")}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(["0-30", "31-60", "61-90", "90+"] as const).map((b) => (
          <Kpi
            key={b}
            label={b === "0-30" ? "Current (0-30d)" : `${b}d overdue`}
            value={fmt(summary.buckets[b].cents, summary.rows[0]?.currency ?? "AED")}
            icon={b === "0-30" ? Receipt : b === "31-60" ? Bell : b === "61-90" ? AlertTriangle : AlertCircle}
            delta={`${summary.buckets[b].count} invoices`}
            deltaTone={b === "90+" ? "down" : b === "0-30" ? "up" : "neutral"}
          />
        ))}
      </div>
      <Card>
        <CardHeader title="Open invoices" subtitle="Sorted by days overdue. Send a polite reminder with one click." />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Client</th><th>Matter</th><th>Due</th><th>Outstanding</th><th>Bucket</th><th>Reminders</th><th>Action</th></tr></thead>
            <tbody>
              {summary.rows
                .sort((a, b) => b.daysOverdue - a.daysOverdue)
                .map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="font-medium font-mono text-caption">{r.invoiceNumber}</td>
                  <td>
                    <div className="text-body-sm">{r.clientName ?? "-"}</div>
                    <div className="text-caption text-muted">{r.clientEmail ?? "no email on file"}</div>
                  </td>
                  <td className="text-body-sm">{r.caseTitle ?? "-"}</td>
                  <td className="text-caption">
                    {r.dueAt ? r.dueAt.toISOString().slice(0, 10) : "-"}
                    {r.daysOverdue > 0 && <div className="text-caption text-danger-700">{r.daysOverdue}d overdue</div>}
                  </td>
                  <td className="tabular-nums">{fmt(r.outstandingCents, r.currency)}</td>
                  <td><Badge tone={BUCKET_TONE[r.bucket]}>{r.bucket}</Badge></td>
                  <td className="text-caption">
                    {r.remindersSent === 0 ? <span className="text-muted">none</span> : (
                      <>
                        <Badge tone="info">{r.remindersSent} sent</Badge>
                        {r.lastReminderAt && <div className="text-caption text-muted mt-0.5">last {r.lastReminderAt.toISOString().slice(0, 10)}</div>}
                      </>
                    )}
                  </td>
                  <td><RemindButton invoiceId={r.id} hasEmail={!!r.clientEmail} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
