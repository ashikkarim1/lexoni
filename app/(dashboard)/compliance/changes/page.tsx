import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { Radar, Building2, FileText, Users, TrendingUp } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listAssessmentsForFirm, listRecentUpdates } from "@/lib/regulatory/impact";
import { ModuleEmpty } from "@/components/ui/ModuleShell";
import { ChangesActions } from "./ChangesActions";

export const dynamic = "force-dynamic";

const SEV_TONE: Record<string, "info" | "warning" | "danger" | "neutral"> = {
  info: "neutral", low: "info", medium: "warning", high: "danger", critical: "danger",
};

export default async function Page() {
  const session = await getSession();
  const [assessments, updates] = await Promise.all([
    listAssessmentsForFirm(session, 30),
    listRecentUpdates(30),
  ]);

  if (assessments.length === 0 && updates.length === 0) {
    return (
      <div className="space-y-4">
        <ChangesActions updates={updates} mode="empty" />
        <ModuleEmpty
          icon={Radar}
          title="Regulatory Change Intelligence"
          subtitle="When UAE / KSA / ADGM / DFSA / ADX / Tadawul / ZATCA push a rule change, we tell you which of your clients, contracts, entities are affected - and draft the per-client memo."
          bullets={[
            "Daily ingest from regulator gazettes + RSS feeds (paste-an-update API for the demo)",
            "Rule-engine match through the firm's clients + contracts + entities",
            "Per-client memo EN + AR + ordered action list",
            "Estimated fee opportunity per assessment",
          ]}
        />
      </div>
    );
  }

  const totalClients = assessments.reduce((a, n) => a + n.affectedClientCount, 0);
  const totalContracts = assessments.reduce((a, n) => a + n.affectedContractCount, 0);
  const totalCompanies = assessments.reduce((a, n) => a + n.affectedCompanyCount, 0);
  const totalFee = assessments.reduce((a, n) => a + (n.estimatedFeeCents ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regulatory Change Intelligence"
        subtitle="Every rule change run through your client + contract + entity register, with action lists and partner memos."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Clients impacted (last 30)"  value={totalClients}   icon={Users}     delta="across all updates"  deltaTone="neutral" />
        <Kpi label="Contracts impacted"           value={totalContracts} icon={FileText}  delta="amendments queued"   deltaTone="neutral" />
        <Kpi label="Entities impacted"            value={totalCompanies} icon={Building2} delta="across the book"     deltaTone="neutral" />
        <Kpi label="Est. fee opportunity"         value={`$${Math.round(totalFee / 100).toLocaleString()}`} icon={TrendingUp} delta="across recent assessments" deltaTone="up" />
      </div>

      <ChangesActions updates={updates} mode="standard" />

      {assessments.length > 0 && (
        <Card>
          <CardHeader title={`Recent assessments · ${assessments.length}`} subtitle="The impact engine matched these updates through your firm's data." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Update</th><th>Regulator</th><th>Severity</th><th>Affected</th><th>Est. fee</th><th>When</th></tr></thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="align-top">
                    <td><div className="font-medium max-w-md">{a.title}</div><div className="text-caption text-muted">Published {a.publishedAt.toISOString().slice(0, 10)}</div></td>
                    <td><Badge tone="info">{a.regulator}</Badge> <span className="text-caption text-muted">{a.region}</span></td>
                    <td><Badge tone={SEV_TONE[a.severity]}>{a.severity}</Badge></td>
                    <td className="text-caption">
                      <Badge tone="neutral">{a.affectedClientCount} clients</Badge>{" "}
                      <Badge tone="neutral">{a.affectedCompanyCount} entities</Badge>{" "}
                      <Badge tone="neutral">{a.affectedContractCount} contracts</Badge>{" "}
                      <Badge tone="neutral">{a.affectedMatterCount} matters</Badge>
                    </td>
                    <td className="tabular-nums">{a.estimatedFeeCents ? `$${Math.round(a.estimatedFeeCents / 100).toLocaleString()}` : "-"}</td>
                    <td className="text-caption text-muted">{a.createdAt.toISOString().slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {updates.length > 0 && (
        <Card>
          <CardHeader title="Latest regulatory updates" subtitle="Click ASSESS to run the impact engine for an update." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Update</th><th>Regulator</th><th>Region</th><th>Published</th><th>Severity</th><th>Status</th></tr></thead>
              <tbody>
                {updates.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium max-w-md">{u.title}</td>
                    <td><Badge tone="info">{u.regulator}</Badge></td>
                    <td className="text-caption">{u.region}</td>
                    <td className="text-caption text-muted">{u.publishedAt.toISOString().slice(0, 10)}</td>
                    <td><Badge tone={SEV_TONE[u.severity]}>{u.severity}</Badge></td>
                    <td><Badge tone={u.status === "assessed" ? "success" : u.status === "broadcast" ? "info" : "neutral"}>{u.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
