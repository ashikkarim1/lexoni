import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Building2 } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listCompanies } from "@/lib/data/companies";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function CompaniesPage() {
  const session = await getSession();
  const rows = await listCompanies(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Building2}
      title="Companies"
      subtitle="Every entity your firm manages - UAE, KSA, and elsewhere - with jurisdiction, status, parent / subsidiary structure and license tracking."
      bullets={["UBO declarations and KYC", "License renewals on the compliance calendar", "Cap table + share class + register of directors"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" subtitle={`${rows.length} entities managed across UAE + KSA.`} />
      <Card>
        <CardHeader title="Managed entities" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Legal name</th><th>Jurisdiction</th><th>License</th><th>Status</th><th>Incorporated</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium">{c.legalName}</div>
                    {c.legalNameAr && <div className="text-caption text-muted">{c.legalNameAr}</div>}
                  </td>
                  <td><Badge tone="info">{c.jurisdiction}</Badge> <span className="text-caption text-muted ms-1">{c.region}</span></td>
                  <td className="text-caption font-mono">{c.licenseNo ?? "-"}</td>
                  <td><Badge tone={c.status === "active" ? "success" : "neutral"}>{c.status}</Badge></td>
                  <td className="text-caption text-muted">{c.incorporationDate?.toISOString().slice(0, 10) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
