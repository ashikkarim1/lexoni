import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Compass, Sparkles, ShieldAlert } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listPlans } from "@/lib/data/copilot";
import { CopilotConsole } from "./CopilotConsole";

export const dynamic = "force-dynamic";

const SAMPLES = [
  "Take this company public on ADX.",
  "Open a Saudi subsidiary for our UK group.",
  "Launch an ADGM QIF feeder into a Cayman master fund.",
  "Acquire a 60% stake in a Riyadh logistics target.",
  "File a priority patent for a battery-management invention.",
];

const STATUS_TONE: Record<string, "warning" | "success" | "info" | "danger"> = {
  draft: "warning", approved: "success", instantiated: "info", rejected: "danger",
};

export default async function CopilotPage() {
  const session = await getSession();
  const plans = await listPlans(session, 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Matter Copilot"
        subtitle="Type the outcome. Get the legal path - required steps, regulators, filings, lawyers, templates, risks, fee range - in one shot."
      />

      <Card>
        <CardHeader title="Start a plan" subtitle="Plain English. The copilot is grounded in the firm's historical matters + the platform's process packs." />
        <CardBody>
          <CopilotConsole samples={SAMPLES} session={{ role: session.role }} />
        </CardBody>
      </Card>

      {plans.length > 0 && (
        <Card>
          <CardHeader title={`Recent plans · ${plans.length}`} subtitle="Draft plans await a partner's review. Approved plans can be instantiated into a live matter." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Outcome</th><th>Generated</th><th>Confidence</th><th>Steps · Slots · Risks</th><th>Status</th></tr></thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td>
                      <div className="font-medium max-w-md">{p.outcome}</div>
                      <div className="text-caption text-muted">{p.plan.title}</div>
                    </td>
                    <td className="text-caption text-muted">{p.requesterName ?? "-"}<br />{p.createdAt.toISOString().slice(0, 10)}</td>
                    <td>
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                          <div className={`h-full rounded ${p.confidence >= 70 ? "bg-success-600" : p.confidence >= 40 ? "bg-warning-500" : "bg-danger-500"}`} style={{ width: `${p.confidence}%` }} />
                        </div>
                        <span className="text-caption tabular-nums">{p.confidence}%</span>
                      </div>
                    </td>
                    <td className="text-caption">
                      <Badge tone="info">{p.plan.steps.length} steps</Badge>{" "}
                      <Badge tone="info">{p.plan.slots.length} slots</Badge>{" "}
                      {p.plan.risks.length > 0 && (
                        <Badge tone={p.plan.risks.some((r) => r.severity === "high") ? "danger" : "warning"}>
                          <ShieldAlert className="h-3 w-3 inline" /> {p.plan.risks.length} risks
                        </Badge>
                      )}
                    </td>
                    <td><Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {plans.length === 0 && (
        <Card>
          <CardBody className="text-center py-10">
            <div className="inline-flex items-center gap-2 text-muted text-body-sm">
              <Compass className="h-4 w-4" /> No plans yet. Start one above - try <span className="font-medium">"{SAMPLES[0]}"</span>.
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
