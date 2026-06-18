import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Network } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listCompanies, listCapTable } from "@/lib/data/companies";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function OwnershipPage() {
  const session = await getSession();
  const [companies, capTable] = await Promise.all([
    listCompanies(session),
    listCapTable(session),
  ]);

  if (companies.length === 0) return (
    <ModuleEmpty
      icon={Network}
      title="Ownership structure"
      subtitle="The tree of who owns what across every managed entity, including parent / subsidiary relationships and ultimate beneficial owners."
      bullets={["Top-down ownership tree per group", "Parent / subsidiary lineage with effective control %", "UBO escalation on every group"]}
    />
  );

  const ownership = new Map<string, Map<string, number>>();
  for (const e of capTable) {
    const inner = ownership.get(e.companyId) ?? new Map<string, number>();
    inner.set(e.shareholderName, (inner.get(e.shareholderName) ?? 0) + e.quantity);
    ownership.set(e.companyId, inner);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ownership structure" subtitle={`Effective ownership across ${companies.length} entities.`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((c) => {
          const inner = ownership.get(c.id);
          const total = inner ? Array.from(inner.values()).reduce((a, n) => a + n, 0) : 0;
          return (
            <Card key={c.id}>
              <CardHeader title={c.legalName} subtitle={`${c.jurisdiction} · ${c.status}`} />
              <CardBody>
                {!inner || total === 0 ? (
                  <div className="text-caption text-muted">No cap-table entries recorded.</div>
                ) : (
                  <ul className="space-y-2 text-body-sm">
                    {Array.from(inner.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, qty]) => {
                        const pct = Math.round((qty / total) * 1000) / 10;
                        return (
                          <li key={name}>
                            <div className="flex justify-between gap-3 mb-1">
                              <span className="font-medium truncate">{name}</span>
                              <span className="tabular-nums text-muted">{pct.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-line rounded-full overflow-hidden">
                              <div className="h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
