import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Library } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listTemplates } from "@/lib/data/templates";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

const SCOPE_TONE: Record<string, "info" | "warning" | "success" | "neutral"> = {
  personal: "neutral", firm: "success", marketplace: "info",
};

export default async function TemplatesPage() {
  const session = await getSession();
  const rows = await listTemplates(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Library}
      title="Templates"
      subtitle="Three-tier template library - personal (one lawyer), firm-wide, and marketplace (resellable). Versioned with variable schemas."
      bullets={["Personal · firm · marketplace scopes", "Variable schemas drive document automation", "Marketplace installs fork into your firm library"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Templates" subtitle={`${rows.length} templates in your library.`} />
      <Card>
        <CardHeader title="Library" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Template</th><th>Scope</th><th>Kind</th><th>Region / lang</th><th className="text-end">Usage</th><th className="text-end">Installs</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-caption text-muted">v{t.version}</div>
                  </td>
                  <td><Badge tone={SCOPE_TONE[t.scope] ?? "neutral"}>{t.scope}</Badge></td>
                  <td className="text-caption">{t.kind}</td>
                  <td className="text-caption">{t.region} · {t.language.toUpperCase()}{t.jurisdiction ? ` · ${t.jurisdiction}` : ""}</td>
                  <td className="text-end tabular-nums">{t.usageCount.toLocaleString()}</td>
                  <td className="text-end tabular-nums text-muted">{t.installCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
