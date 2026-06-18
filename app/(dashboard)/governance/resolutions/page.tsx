import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileCheck2 } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listResolutions } from "@/lib/data/governance";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function ResolutionsPage() {
  const session = await getSession();
  const rows = await listResolutions(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={FileCheck2}
      title="Resolutions"
      subtitle="Versioned board and shareholder resolutions across every managed company - draft, approved, signed, with a complete audit trail."
      bullets={["(parentId, version, isCurrent) versioning for every resolution", "Auto-draft from the firm's resolution template library", "Signed-by + date proof on every executed resolution"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Resolutions" subtitle={`${rows.length} resolutions across the managed companies.`} />
      <Card>
        <CardHeader title="Resolution register" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Title</th><th>Company</th><th>Version</th><th>Status</th><th>Signed</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.title}</td>
                  <td className="text-body-sm">{r.companyName}</td>
                  <td><Badge tone={r.isCurrent ? "success" : "neutral"}>v{r.version}{r.isCurrent ? "" : " (old)"}</Badge></td>
                  <td><Badge tone={r.status === "signed" ? "success" : "info"}>{r.status}</Badge></td>
                  <td className="text-caption text-muted">{r.signedAt?.toISOString().slice(0, 10) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
