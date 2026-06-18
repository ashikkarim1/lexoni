import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Brain } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listKnowledge } from "@/lib/data/templates";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function KnowledgePage() {
  const session = await getSession();
  const rows = await listKnowledge(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Brain}
      title="Knowledge base"
      subtitle="Searchable across firm-approved templates, clauses, precedents and legal opinions. AI trains only on items marked approved + learnable."
      bullets={["Approval + learn-from-this gates per item", "Tagged for retrieval at draft time", "Excluded by default for client-confidential data"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Knowledge base" subtitle={`${rows.length} items in the firm's knowledge base.`} />
      <Card>
        <CardHeader title="Items" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Item</th><th>Kind</th><th>Region / lang</th><th>Tags</th><th>Approved</th><th>Trains AI</th></tr></thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id}>
                  <td className="font-medium">{k.title}</td>
                  <td><Badge tone="info">{k.kind}</Badge></td>
                  <td className="text-caption">{k.region} · {k.language.toUpperCase()}{k.jurisdiction ? ` · ${k.jurisdiction}` : ""}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">{(k.tags ?? []).map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}</div>
                  </td>
                  <td>{k.approved ? <Badge tone="success">approved</Badge> : <Badge tone="warning">pending</Badge>}</td>
                  <td>{k.learnFromThis ? <Badge tone="info">yes</Badge> : <Badge tone="neutral">no</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
