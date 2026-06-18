import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GitBranch } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listRoutingRules } from "@/lib/data/settings";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function RoutingPage() {
  const session = await getSession();
  const rows = await listRoutingRules(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={GitBranch}
      title="Routing rules"
      subtitle="Top-down priority. First match wins. Each rule matches sector × legal function × region and assigns to a specific lawyer (with a fallback)."
      bullets={["Per-rule predicate: sectors[], functions[], regions[], languages[], minUrgency", "Action: assignUserId + fallbackUserId + alsoNotify[]", "Diagnostics: matched count + last matched timestamp"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Routing rules" subtitle={`${rows.length} rules evaluated top-down on every new intake.`} />
      <Card>
        <CardHeader title="Rules" subtitle="Evaluated by priority; first match wins." />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th className="text-end">Priority</th><th>Rule</th><th>Match</th><th>Action</th><th>Active</th><th className="text-end">Matched</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-end tabular-nums">{r.priority}</td>
                  <td className="font-medium">{r.name}</td>
                  <td className="text-caption text-muted max-w-md"><code className="font-mono">{JSON.stringify(r.match)}</code></td>
                  <td className="text-caption text-muted max-w-md"><code className="font-mono">{JSON.stringify(r.action)}</code></td>
                  <td>{r.active ? <Badge tone="success">on</Badge> : <Badge tone="neutral">off</Badge>}</td>
                  <td className="text-end tabular-nums">{r.matchedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
