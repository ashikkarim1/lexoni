import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileSearch } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listDealDocs } from "@/lib/data/deals";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function DueDiligencePage() {
  const session = await getSession();
  const rows = await listDealDocs(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={FileSearch}
      title="Due diligence"
      subtitle="Deal-room documents organised by folder, with version history and permissioned access."
      bullets={["Per-deal folder structure", "Versioned uploads with current flag", "Access audit per participant firm"]}
    />
  );

  const byDeal = new Map<string, typeof rows>();
  for (const r of rows) { const arr = byDeal.get(r.dealId) ?? []; arr.push(r); byDeal.set(r.dealId, arr); }

  return (
    <div className="space-y-6">
      <PageHeader title="Due diligence" subtitle={`${rows.length} documents across ${byDeal.size} deal rooms.`} />
      <Card>
        <CardHeader title="Deal room documents" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Document</th><th>Folder</th><th>Version</th><th>Current</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.title}</td>
                  <td className="text-caption font-mono">{d.folder}</td>
                  <td className="text-caption">v{d.version}</td>
                  <td>{d.isCurrent ? <Badge tone="success">current</Badge> : <Badge tone="neutral">old</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
