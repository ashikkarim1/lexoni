import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Scale } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listMatters } from "@/lib/data/matters";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function CasesPage() {
  const session = await getSession();
  const rows = await listMatters(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Scale}
      title="Cases"
      subtitle="Every matter on your book - litigation, advisory, regulatory, M&A - with status, lead, and fee model."
      bullets={["Process-ordered slot status on every matter", "Lead lawyer + supervision edges", "Auto-opened when an engagement letter is counter-signed"]}
      primary={{ label: "Open the intake queue", href: "/intake" }}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Cases" subtitle={`${rows.length} matters across your firm.`} />
      <Card>
        <CardHeader title="Matter book" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Matter</th><th>Client</th><th>Lead</th><th>Region</th><th>Process</th><th>Progress</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/matters/${m.id}`} className="font-medium hover:underline">{m.title}</Link>
                    <div className="text-caption text-muted">#{m.matterNumber}</div>
                  </td>
                  <td className="text-body-sm">{m.client}</td>
                  <td className="text-body-sm">{m.lead}</td>
                  <td className="text-caption">{m.region}</td>
                  <td><Badge tone="info">{m.processTitle}</Badge></td>
                  <td>
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                        <div className="h-full bg-primary-600 rounded" style={{ width: `${m.progressPct}%` }} />
                      </div>
                      <span className="text-caption tabular-nums">{m.progressPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
