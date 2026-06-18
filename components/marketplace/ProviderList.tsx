import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Store } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listProviders } from "@/lib/data/providers";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export async function ProviderList({
  kind,
  title,
  subtitle,
}: {
  kind: string;
  title: string;
  subtitle: string;
}) {
  const session = await getSession();
  const rows = await listProviders(session, kind);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Store}
      title={title}
      subtitle={subtitle}
      bullets={["Vetted, verified providers across UAE + KSA", "Pricing, expertise and industry tags per provider", "Direct proposal flow back into the firm"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={`${rows.length} providers · ${subtitle}`} />
      <Card>
        <CardHeader title="Marketplace" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Provider</th><th>Region</th><th>Expertise</th><th>Pricing from</th><th>Rating</th><th>Verified</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-caption">{p.region}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">{(p.expertise ?? []).slice(0, 4).map((e) => <Badge key={e} tone="neutral">{e}</Badge>)}</div>
                  </td>
                  <td className="text-caption tabular-nums">{p.pricingFrom ? `$${(p.pricingFrom / 100).toLocaleString()}` : "-"}</td>
                  <td className="text-caption tabular-nums">{p.ratingAvg ?? "-"}</td>
                  <td>{p.verified ? <Badge tone="success">verified</Badge> : <Badge tone="neutral">unverified</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
