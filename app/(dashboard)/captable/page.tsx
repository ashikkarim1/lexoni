import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScrollText } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listCapTable } from "@/lib/data/companies";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function CapTablePage() {
  const session = await getSession();
  const rows = await listCapTable(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={ScrollText}
      title="Cap tables"
      subtitle="Share class, ownership and certificate tracking across every managed entity."
      bullets={["Multiple share classes per company with preferences", "Issuance, transfer and certificate history", "Diluted vs. fully-diluted views"]}
    />
  );

  const byCompany = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = byCompany.get(r.companyId) ?? [];
    arr.push(r);
    byCompany.set(r.companyId, arr);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cap tables" subtitle={`${rows.length} cap-table entries across ${byCompany.size} companies.`} />
      {Array.from(byCompany.entries()).map(([cid, entries]) => (
        <Card key={cid}>
          <CardHeader title={entries[0].companyName} subtitle={`${entries.length} entries`} />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Shareholder</th><th>Class</th><th className="text-end">Quantity</th><th className="text-end">Par (cents)</th><th>Certificate</th><th>Issued</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="font-medium">{e.shareholderName}</td>
                    <td><Badge tone="info">{e.shareClassName}</Badge></td>
                    <td className="text-end tabular-nums">{e.quantity.toLocaleString()}</td>
                    <td className="text-end tabular-nums text-muted">{e.parValueCents}</td>
                    <td className="text-caption font-mono">{e.certificateNo ?? "-"}</td>
                    <td className="text-caption text-muted">{e.issuedAt.toISOString().slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
