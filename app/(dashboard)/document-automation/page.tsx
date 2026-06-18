import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Layers } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import { getSession } from "@/lib/auth/session-server";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function DocumentAutomationPage() {
  const session = await getSession();
  if (!dbReady) {
    return <ModuleEmpty icon={Layers} title="Document automation" subtitle="AI-driven document generation tied to firm templates." />;
  }
  const rows = await db
    .select({
      id: s.documentGenerations.id,
      caseId: s.documentGenerations.caseId,
      matterTitle: s.cases.title,
      matterNumber: s.cases.matterNumber,
      templateTitle: s.templates.title,
      status: s.documentGenerations.status,
      estimatedMinutesSaved: s.documentGenerations.estimatedMinutesSaved,
      createdAt: s.documentGenerations.createdAt,
    })
    .from(s.documentGenerations)
    .innerJoin(s.templates, eq(s.templates.id, s.documentGenerations.templateId))
    .leftJoin(s.cases, eq(s.cases.id, s.documentGenerations.caseId))
    .where(tenantScope(session, s.documentGenerations))
    .orderBy(desc(s.documentGenerations.createdAt));

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Layers}
      title="Document automation"
      subtitle="AI-driven document generation tied to firm templates - picks a template, pulls client context, renders the doc."
      bullets={["Variable schema per template drives the autopopulate", "Wall-aware: walled clauses never leak into a non-member's generation", "Minutes-saved tracking for the ROI dashboard"]}
      primary={{ label: "Open the template library", href: "/templates" }}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Document automation" subtitle={`${rows.length} generations across your matters.`} />
      <Card>
        <CardHeader title="Runs" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Template</th><th>Matter</th><th>Status</th><th>Minutes saved</th><th>When</th></tr></thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td className="font-medium">{g.templateTitle}</td>
                  <td>
                    {g.matterTitle ? <><div className="text-body-sm">{g.matterTitle}</div><div className="text-caption text-muted">#{g.matterNumber}</div></> : "-"}
                  </td>
                  <td><Badge tone={g.status === "executed" ? "success" : "info"}>{g.status}</Badge></td>
                  <td className="text-end tabular-nums">{g.estimatedMinutesSaved ?? "-"}</td>
                  <td className="text-caption text-muted">{g.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
