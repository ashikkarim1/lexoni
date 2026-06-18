import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Gavel } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listBoardMeetings } from "@/lib/data/governance";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function BoardPage() {
  const session = await getSession();
  const rows = await listBoardMeetings(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Gavel}
      title="Board meetings"
      subtitle="Scheduled board, AGM, EGM and committee meetings across the managed companies, with quorum tracking and minutes."
      bullets={["Auto-drafted notices and agendas from the firm template", "Quorum + attendance per meeting", "Minutes lifecycle into resolutions"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Board meetings" subtitle={`${rows.length} meetings scheduled across the managed companies.`} />
      <Card>
        <CardHeader title="Board calendar" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Meeting</th><th>Company</th><th>Kind</th><th>Scheduled</th><th>Quorum</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.title}</td>
                  <td className="text-body-sm">{m.companyName}</td>
                  <td><Badge tone="info">{m.kind}</Badge></td>
                  <td className="text-caption">{m.scheduledAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td className="text-caption tabular-nums">{m.quorum}</td>
                  <td><Badge tone={m.status === "completed" ? "success" : "neutral"}>{m.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
