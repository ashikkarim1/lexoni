import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Briefcase } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listOfficers } from "@/lib/data/companies";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function OfficersPage() {
  const session = await getSession();
  const rows = await listOfficers(session, { role: "officer" });

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Briefcase}
      title="Officers"
      subtitle="CEO, CFO, COO and company secretaries across the managed companies, with authorised-signatory matrices and POA tracking."
      bullets={["Officer register with full appointment history", "Authorised-signatory matrices per company", "Power-of-attorney expiry tracking"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Officers" subtitle={`${rows.length} officers across the managed companies.`} />
      <Card>
        <CardHeader title="Officer register" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Officer</th><th>Role</th><th>Company</th><th>Nationality</th><th>Appointed</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium">{o.fullName}</td>
                  <td><Badge tone="info">{o.role}</Badge></td>
                  <td className="text-body-sm">{o.companyName}</td>
                  <td className="text-caption text-muted">{o.nationality ?? "-"}</td>
                  <td className="text-caption text-muted">{o.appointedAt?.toISOString().slice(0, 10) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
