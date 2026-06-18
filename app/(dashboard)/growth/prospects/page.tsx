import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Compass } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listProspects } from "@/lib/data/prospects";
import { ModuleEmpty } from "@/components/ui/ModuleShell";
import { AddProspectButton } from "./AddProspectButton";
import { ProspectRowActions } from "./ProspectRowActions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  new: "warning", queued: "warning", contacted: "info", engaged: "success", won: "success", lost: "danger", cold: "neutral",
};

const fmtUsd = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export default async function Page() {
  const session = await getSession();
  const rows = await listProspects(session);

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Prospect queue"
          subtitle="The companies the firm is actively pursuing. Add manually, or let the regulator engine push lookalike leads."
          actions={<AddProspectButton />}
        />
        <ModuleEmpty
          icon={Compass}
          title="No prospects yet"
          subtitle="Start by adding a lookalike target manually, or run the regulator-impact engine and turn affected non-clients into a queue."
          bullets={["Lookalike scorer uses your top historicals on industry × region × deal kind", "Regulator-driven leads land here from /compliance/changes", "Connect to your CRM later - Salesforce + HubSpot in roadmap"]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospect queue"
        subtitle={`${rows.length} prospects · sorted by lookalike score`}
        actions={<AddProspectButton />}
      />
      <Card>
        <CardHeader title="Queue" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Prospect</th><th>Industry / Region</th><th>Source</th><th>Predicted fee</th><th>Lookalike</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="font-medium">{p.legalName}</div>
                    {p.contactName && <div className="text-caption text-muted">{p.contactName}{p.contactRole ? ` · ${p.contactRole}` : ""}</div>}
                  </td>
                  <td className="text-body-sm">{p.industry ?? "-"}<br /><span className="text-caption text-muted">{p.region}{p.jurisdiction ? ` · ${p.jurisdiction}` : ""}</span></td>
                  <td><Badge tone={p.source === "regulatory_impact" ? "warning" : "neutral"}>{p.source.replace(/_/g, " ")}</Badge></td>
                  <td className="text-caption tabular-nums">{p.predictedFeeCents ? fmtUsd(p.predictedFeeCents) : "-"}</td>
                  <td>
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                        <div className={`h-full rounded ${p.lookalikeScore >= 70 ? "bg-success-600" : p.lookalikeScore >= 40 ? "bg-warning-500" : "bg-danger-500"}`} style={{ width: `${p.lookalikeScore}%` }} />
                      </div>
                      <span className="text-caption tabular-nums">{p.lookalikeScore}</span>
                    </div>
                  </td>
                  <td><Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status}</Badge></td>
                  <td><ProspectRowActions id={p.id} status={p.status} hasEmail={!!p.contactEmail} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
