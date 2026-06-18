import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listShareholders } from "@/lib/data/companies";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function ShareholdersPage() {
  const session = await getSession();
  const rows = await listShareholders(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Users}
      title="Shareholders"
      subtitle="Who owns each managed company, what kind of holder they are, and which natural person ultimately controls the entity (UBO)."
      bullets={["UBO declaration and refresh on every new matter", "Holder kind: individual, entity, trust, fund", "Per-company shareholder register tied to the cap table"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Shareholders" subtitle={`${rows.length} holders across the managed companies.`} />
      <Card>
        <CardHeader title="Shareholder register" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Holder</th><th>Kind</th><th>Company</th><th>Residence</th><th>UBO</th></tr></thead>
            <tbody>
              {rows.map((sh) => (
                <tr key={sh.id}>
                  <td className="font-medium">{sh.holderName}</td>
                  <td><Badge tone="neutral">{sh.holderKind}</Badge></td>
                  <td className="text-body-sm">{sh.companyName}</td>
                  <td className="text-caption text-muted">{sh.countryOfResidence ?? "-"}</td>
                  <td>{sh.isUbo ? <Badge tone="info">UBO</Badge> : <span className="text-caption text-muted">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
