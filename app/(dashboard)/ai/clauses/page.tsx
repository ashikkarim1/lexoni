import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Library } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listClauses } from "@/lib/data/templates";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function ClausesPage() {
  const session = await getSession();
  const rows = await listClauses(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Library}
      title="Clause library"
      subtitle="The firm's reusable clauses surfaced into AI drafts. Region- and language-tagged so the right clause lands in the right matter."
      bullets={["Tagged for retrieval at draft time", "Walled at AI context assembly (non-members can't pull them)", "Usage counter so popular clauses surface first"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Clause library" subtitle={`${rows.length} firm clauses available for AI drafting.`} />
      <Card>
        <CardHeader title="Clauses" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Title</th><th>Region / lang</th><th>Tags</th><th className="text-end">Usage</th><th>Version</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.title}</td>
                  <td className="text-caption">{c.region} · {c.language.toUpperCase()}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">{(c.tags ?? []).map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}</div>
                  </td>
                  <td className="text-end tabular-nums">{c.usageCount.toLocaleString()}</td>
                  <td className="text-caption">v{c.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
