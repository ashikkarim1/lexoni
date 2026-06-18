import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Plug } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listIntegrations } from "@/lib/data/settings";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  connected: "success", disconnected: "neutral", error: "danger",
};

export default async function IntegrationsPage() {
  const session = await getSession();
  const rows = await listIntegrations(session);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Plug}
      title="Integrations"
      subtitle="Microsoft 365, Outlook, Teams, WhatsApp Business, DocuSign, ZATCA, Google Workspace, Slack - wired in for passive time capture and document storage."
      bullets={["OAuth-based, per-tenant secrets vaulted", "Last-sync tracking and connection-health checks", "Activity events feed straight into the time-confirm sweep"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" subtitle={`${rows.length} integrations configured.`} />
      <Card>
        <CardHeader title="Connections" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Service</th><th>Status</th><th>Connected</th><th>Last sync</th></tr></thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium uppercase tracking-wide text-caption">{i.kind.replace(/_/g, " ")}</td>
                  <td><Badge tone={STATUS_TONE[i.status] ?? "neutral"}>{i.status}</Badge></td>
                  <td className="text-caption text-muted">{i.connectedAt?.toISOString().slice(0, 10) ?? "-"}</td>
                  <td className="text-caption text-muted">{i.lastSyncedAt?.toISOString().slice(0, 16).replace("T", " ") ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
