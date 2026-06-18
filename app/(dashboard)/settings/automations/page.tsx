import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Zap } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listAutomations } from "@/lib/data/settings";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function AutomationsPage() {
  const session = await getSession();
  const rows = await listAutomations(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Zap}
      title="Automations"
      subtitle="Trigger + template recipes - welcome email on intake, engagement letter on assign, filing reminder, invoice dunning."
      bullets={["Triggers: intake received, matter opened, filing due, invoice overdue, DSR received", "Templates: live in the firm template library", "Failure tracking: run + failure counters per automation"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Automations" subtitle={`${rows.length} configured automations.`} />
      <Card>
        <CardHeader title="Recipes" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Trigger</th><th>Kind</th><th>Active</th><th className="text-end">Runs</th><th className="text-end">Failures</th><th>Last run</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.name}</td>
                  <td><Badge tone="info">{a.trigger.replace(/_/g, " ")}</Badge></td>
                  <td><Badge tone="neutral">{a.kind.replace(/_/g, " ")}</Badge></td>
                  <td>{a.active ? <Badge tone="success">active</Badge> : <Badge tone="neutral">off</Badge>}</td>
                  <td className="text-end tabular-nums">{a.runCount}</td>
                  <td className="text-end tabular-nums">{a.failureCount > 0 ? <span className="text-danger-700">{a.failureCount}</span> : a.failureCount}</td>
                  <td className="text-caption text-muted">{a.lastRunAt?.toISOString().slice(0, 16).replace("T", " ") ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
