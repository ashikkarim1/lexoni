import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users2 } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import { getSession } from "@/lib/auth/session-server";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function CollaboratorsPage() {
  const session = await getSession();
  if (!dbReady) {
    return <ModuleEmpty icon={Users2} title="Collaborators" subtitle="Co-counsel and specialist firms on multi-firm matters." />;
  }
  const rows = await db
    .select({
      id: s.matterCollaborators.id,
      caseId: s.matterCollaborators.caseId,
      collaboratorTenantId: s.matterCollaborators.collaboratorTenantId,
      role: s.matterCollaborators.role,
      canUploadDocs: s.matterCollaborators.canUploadDocs,
      canCommentDocs: s.matterCollaborators.canCommentDocs,
      canDraftDocs: s.matterCollaborators.canDraftDocs,
      canViewBilling: s.matterCollaborators.canViewBilling,
      invitedAt: s.matterCollaborators.invitedAt,
      acceptedAt: s.matterCollaborators.acceptedAt,
      matterTitle: s.cases.title,
      matterNumber: s.cases.matterNumber,
      firmName: s.tenants.name,
    })
    .from(s.matterCollaborators)
    .innerJoin(s.cases, eq(s.cases.id, s.matterCollaborators.caseId))
    .innerJoin(s.tenants, eq(s.tenants.id, s.matterCollaborators.collaboratorTenantId))
    .where(tenantScope(session, s.cases));

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Users2}
      title="Collaborators"
      subtitle="Co-counsel, specialist, foreign-counsel and local-counsel collaborators on your matters. Permissioned and audited."
      bullets={["Per-matter participant invites with role + capabilities", "Chinese-wall isolation between firms by default", "Every access logged for ethical-wall audit"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Collaborators" subtitle={`${rows.length} participant firms across your matters.`} />
      <Card>
        <CardHeader title="Multi-firm participants" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Firm</th><th>Matter</th><th>Role</th><th>Permissions</th><th>Invited</th><th>Accepted</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.firmName}</td>
                  <td>
                    <div className="text-body-sm">{r.matterTitle}</div>
                    <div className="text-caption text-muted">#{r.matterNumber}</div>
                  </td>
                  <td><Badge tone="info">{r.role}</Badge></td>
                  <td className="text-caption flex flex-wrap gap-1">
                    {r.canUploadDocs && <Badge tone="neutral">upload</Badge>}
                    {r.canCommentDocs && <Badge tone="neutral">comment</Badge>}
                    {r.canDraftDocs && <Badge tone="neutral">draft</Badge>}
                    {r.canViewBilling && <Badge tone="warning">billing</Badge>}
                  </td>
                  <td className="text-caption text-muted">{r.invitedAt.toISOString().slice(0, 10)}</td>
                  <td className="text-caption text-muted">{r.acceptedAt?.toISOString().slice(0, 10) ?? <Badge tone="warning">pending</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
