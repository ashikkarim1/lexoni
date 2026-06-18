import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Briefcase, Users, Wallet } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { snapshot } from "@/lib/data/profitability";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export const dynamic = "force-dynamic";

const fmt = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export default async function Page() {
  const session = await getSession();
  const snap = await snapshot(session);

  if (snap.matters.length === 0 && snap.lawyers.length === 0 && snap.clients.length === 0) {
    return <ModuleEmpty
      icon={TrendingUp}
      title="Profitability"
      subtitle="Per-matter realisation, per-lawyer effective rate, per-client lifetime value. Once you log billable time + issue invoices, this dashboard fills in."
      bullets={["Realisation = paid revenue ÷ billable value", "Effective rate = attributed paid revenue ÷ hours logged", "Drilled by matter / lawyer / client"]}
    />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profitability" subtitle="Where the money's actually being made - and where it isn't." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Billable value" value={fmt(snap.firmTotals.billableValueCents)} icon={Briefcase} delta="time logged × rate"     deltaTone="neutral" />
        <Kpi label="Invoiced"        value={fmt(snap.firmTotals.invoicedCents)}       icon={Wallet}     delta="all open + closed"     deltaTone="neutral" />
        <Kpi label="Paid"            value={fmt(snap.firmTotals.paidCents)}            icon={TrendingUp} delta={`realisation ${snap.firmTotals.realisationPct}%`} deltaTone="up" />
        <Kpi label="Clients tracked" value={snap.clients.length}                       icon={Users}      delta={`${snap.matters.length} matters`} deltaTone="neutral" />
      </div>

      {snap.matters.length > 0 && (
        <Card>
          <CardHeader title="By matter" subtitle="Sorted by paid revenue." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Matter</th><th>Hours</th><th>Billable value</th><th>Invoiced</th><th>Paid</th><th>Realisation</th></tr></thead>
              <tbody>
                {snap.matters.map((m) => (
                  <tr key={m.caseId}>
                    <td className="font-medium">{m.matterTitle}</td>
                    <td className="tabular-nums">{(m.billableMinutes / 60).toFixed(1)} h</td>
                    <td className="tabular-nums">{fmt(m.billableValueCents)}</td>
                    <td className="tabular-nums">{fmt(m.invoicedCents)}</td>
                    <td className="tabular-nums">{fmt(m.paidCents)}</td>
                    <td>
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                          <div className={`h-full rounded ${m.realisationPct >= 80 ? "bg-success-600" : m.realisationPct >= 50 ? "bg-warning-500" : "bg-danger-600"}`} style={{ width: `${Math.min(100, m.realisationPct)}%` }} />
                        </div>
                        <span className="text-caption tabular-nums">{m.realisationPct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {snap.lawyers.length > 0 && (
        <Card>
          <CardHeader title="By lawyer" subtitle="Attributed revenue ÷ hours logged." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Lawyer</th><th>Hours</th><th>Hourly rate</th><th>Billable value</th><th>Attributed revenue</th><th>Effective rate</th></tr></thead>
              <tbody>
                {snap.lawyers.map((l) => (
                  <tr key={l.userId}>
                    <td className="font-medium">{l.fullName}</td>
                    <td className="tabular-nums">{l.billableHours.toFixed(1)} h</td>
                    <td className="tabular-nums text-muted">{fmt(l.hourlyRateCents)} / h</td>
                    <td className="tabular-nums">{fmt(l.billableValueCents)}</td>
                    <td className="tabular-nums">{fmt(l.attributedRevenueCents)}</td>
                    <td className="tabular-nums font-medium">{fmt(l.effectiveRateCents)} <span className="text-caption text-muted">/h</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {snap.clients.length > 0 && (
        <Card>
          <CardHeader title="By client" subtitle="Lifetime value + open balance." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Invoices</th><th>Paid</th><th>Outstanding</th></tr></thead>
              <tbody>
                {snap.clients.map((c) => (
                  <tr key={c.clientTenantId}>
                    <td className="font-medium">{c.clientName}</td>
                    <td className="tabular-nums">{c.invoiceCount}</td>
                    <td className="tabular-nums">{fmt(c.paidCents)}</td>
                    <td className="tabular-nums">
                      {c.outstandingCents > 0 ? <Badge tone="warning">{fmt(c.outstandingCents)}</Badge> : <span className="text-caption text-muted">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
