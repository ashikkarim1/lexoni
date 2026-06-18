import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FolderKanban } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listDeals } from "@/lib/data/deals";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function DealsPage() {
  const session = await getSession();
  const rows = await listDeals(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={FolderKanban}
      title="Deals"
      subtitle="Buy- and sell-side M&A deals with virtual deal rooms, permissioned access, DD checklists and LOI tracking."
      bullets={["Permissioned deal rooms with per-participant audit", "DD checklists tied to the matter's process slots", "AI-extracted obligations from term sheets"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Deals" subtitle={`${rows.length} active deals.`} />
      <Card>
        <CardHeader title="Deal book" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Code name</th><th>Side</th><th>Region</th><th>Status</th><th>Value</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.codeName}</td>
                  <td><Badge tone={d.side === "buy" ? "info" : "warning"}>{d.side}</Badge></td>
                  <td className="text-caption">{d.region}</td>
                  <td><Badge tone="neutral">{d.status}</Badge></td>
                  <td className="text-end tabular-nums">{d.valueCents ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
