import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listOfficers } from "@/lib/data/companies";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function DirectorsPage() {
  const session = await getSession();
  const rows = await listOfficers(session, { role: "director" });

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Users}
      title="Directors"
      subtitle="Board members across every managed company - appointment and resignation history, nationality, and authorised-signatory rights."
      bullets={["Board composition over time", "Independence and conflicts checks per appointment", "Resolutions and AGM eligibility"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Directors" subtitle={`${rows.length} appointments across the managed companies.`} />
      <Card>
        <CardHeader title="Director register" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Director</th><th>Role</th><th>Company</th><th>Nationality</th><th>Appointed</th><th>Resigned</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.fullName}</td>
                  <td><Badge tone={/chair/i.test(d.role) ? "info" : "neutral"}>{d.role}</Badge></td>
                  <td className="text-body-sm">{d.companyName}</td>
                  <td className="text-caption text-muted">{d.nationality ?? "-"}</td>
                  <td className="text-caption text-muted">{d.appointedAt?.toISOString().slice(0, 10) ?? "-"}</td>
                  <td className="text-caption text-muted">{d.resignedAt?.toISOString().slice(0, 10) ?? <Badge tone="success">Active</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
