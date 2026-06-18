import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import { getSession } from "@/lib/auth/session-server";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function PortalPage() {
  const session = await getSession();
  if (!dbReady) {
    return <ModuleEmpty icon={Users} title="Client portal" subtitle="Structured info requests for your clients via the branded portal." />;
  }
  const rows = await db
    .select({
      id: s.infoRequests.id,
      title: s.infoRequests.title,
      status: s.infoRequests.status,
      dueAt: s.infoRequests.dueAt,
      submittedAt: s.infoRequests.submittedAt,
      caseTitle: s.cases.title,
      caseNumber: s.cases.matterNumber,
    })
    .from(s.infoRequests)
    .leftJoin(s.cases, eq(s.cases.id, s.infoRequests.caseId))
    .where(tenantScope(session, s.infoRequests))
    .orderBy(desc(s.infoRequests.createdAt));

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Users}
      title="Client portal"
      subtitle="Branded client portal - structured info requests instead of email chases."
      bullets={["JSON-schema fields the client fills in", "Auto-routed back into the matter slot", "Bilingual + RTL for Arabic clients"]}
    />
  );

  const STATUS_TONE: Record<string, "info" | "warning" | "success" | "neutral"> = {
    draft: "neutral", sent: "info", partial: "warning", received: "success", cancelled: "neutral",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Client portal" subtitle={`${rows.length} info requests open with clients.`} />
      <Card>
        <CardHeader title="Info requests" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Title</th><th>Matter</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.title}</td>
                  <td>{r.caseTitle ? <><div className="text-body-sm">{r.caseTitle}</div><div className="text-caption text-muted">#{r.caseNumber}</div></> : "-"}</td>
                  <td className="text-caption text-muted">{r.dueAt?.toISOString().slice(0, 10) ?? "-"}</td>
                  <td><Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
