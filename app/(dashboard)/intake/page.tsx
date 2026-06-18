import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { Inbox, Sparkles, UserCheck, AlertOctagon } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listIntakes } from "@/lib/data/intake";
import { ModuleEmpty } from "@/components/ui/ModuleShell";
import { BuildMatterButton } from "./BuildMatterButton";

const STATUS_TONE: Record<string, "info" | "warning" | "success" | "neutral" | "danger"> = {
  new: "warning", triaging: "warning", assigned: "info", engaged: "success", rejected: "danger", spam: "neutral",
};
const URG_TONE: Record<string, "info" | "warning" | "danger" | "neutral"> = {
  critical: "danger", high: "warning", medium: "info", low: "neutral",
};

export default async function IntakePage() {
  const session = await getSession();
  const intakes = await listIntakes(session);

  if (intakes.length === 0) return (
    <ModuleEmpty
      icon={Inbox}
      title="New-client intake"
      subtitle="Plain-English enquiries from your public intake page. AI classifies sector + legal function + urgency; routing picks the right lawyer."
      bullets={["Public intake form lives at /apply", "Auto-acknowledged via Resend within 60 seconds", "Auto-converted to a matter when the engagement letter is counter-signed"]}
      primary={{ label: "Preview the public form", href: "/apply" }}
    />
  );

  const newCount = intakes.filter((i) => i.status === "new").length;
  const triagingCount = intakes.filter((i) => i.status === "triaging").length;
  const assigned = intakes.filter((i) => i.status === "assigned" || i.status === "engaged").length;
  const critical = intakes.filter((i) => i.aiUrgency === "critical").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New client intake"
        subtitle="Plain-English enquiries, AI-classified and routed to the right lawyer."
        actions={<Link href="/apply" className="btn-secondary btn-sm">Preview client form</Link>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="New"          value={newCount}     icon={Inbox}        delta="last 24h"           deltaTone="neutral" />
        <Kpi label="In triage"    value={triagingCount}icon={Sparkles}     delta="awaiting partner"   deltaTone="neutral" />
        <Kpi label="Assigned"     value={assigned}     icon={UserCheck}    delta="this week"          deltaTone="up" />
        <Kpi label="Critical"     value={critical}     icon={AlertOctagon} delta="needs partner now"  deltaTone="down" />
      </div>

      <Card>
        <CardHeader title="Intake queue" subtitle="Click a row to see the full description and AI's routing suggestion." />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Ref</th><th>From</th><th>Brief</th><th>AI classification</th><th>Routed to</th><th>Status</th><th>Auto-build</th></tr></thead>
            <tbody>
              {intakes.map((i) => (
                <tr key={i.id} className="align-top">
                  <td className="font-mono text-caption">{i.reference}</td>
                  <td>
                    <div className="font-medium">{i.contactName}</div>
                    <div className="text-caption text-muted">{i.companyName ?? i.contactEmail}</div>
                  </td>
                  <td className="text-caption max-w-md line-clamp-2">{i.plainEnglish}</td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {i.aiSector && <Badge tone="info">{i.aiSector.replace(/_/g, " ")}</Badge>}
                      {i.aiFunction && <Badge tone="info">{i.aiFunction.replace(/_/g, " ")}</Badge>}
                      {i.aiUrgency && <Badge tone={URG_TONE[i.aiUrgency] ?? "neutral"}>{i.aiUrgency}</Badge>}
                    </div>
                    {i.aiConfidence != null && <div className="text-caption text-muted mt-1">{i.aiConfidence}% confidence</div>}
                  </td>
                  <td className="text-body-sm">{i.routedToName ?? "-"}</td>
                  <td><Badge tone={STATUS_TONE[i.status] ?? "neutral"}>{i.status}</Badge></td>
                  <td><BuildMatterButton intakeId={i.id} status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
