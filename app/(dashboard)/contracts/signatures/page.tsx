import { PageHeader } from "@/components/ui/PageHeader";
import { Kpi } from "@/components/ui/Kpi";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pen, Send, CheckCircle2, Clock } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listWorkflows } from "@/lib/data/signatures";
import { t } from "@/lib/i18n";
import { NewWorkflowButton } from "./NewWorkflowButton";
import { SendWorkflowButton } from "./SendWorkflowButton";

const STATUS_TONE: Record<string, "info" | "warning" | "danger" | "neutral" | "success"> = {
  draft:     "neutral",
  in_flight: "info",
  complete:  "success",
  declined:  "danger",
  expired:   "neutral",
};
const PARTY_STATUS_TONE: Record<string, "info" | "warning" | "danger" | "neutral" | "success"> = {
  pending:   "neutral",
  notified:  "info",
  viewed:    "warning",
  signed:    "success",
  declined:  "danger",
  expired:   "neutral",
};

export default async function SignaturesPage() {
  const session = await getSession();
  const locale = session.locale;
  const workflows = await listWorkflows(session);

  const counters = {
    drafts:    workflows.filter((w) => w.status === "draft").length,
    inFlight:  workflows.filter((w) => w.status === "in_flight").length,
    complete:  workflows.filter((w) => w.status === "complete").length,
    declined:  workflows.filter((w) => w.status === "declined").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.signatures")}
        title={t(locale, "signatures.title")}
        subtitle={t(locale, "signatures.subtitle")}
        actions={<NewWorkflowButton locale={locale} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t(locale, "signatures.kpi.drafts")}   value={counters.drafts}   icon={Pen}          delta={t(locale, "signatures.kpi.draftsDelta")}   deltaTone="neutral" />
        <Kpi label={t(locale, "signatures.kpi.inFlight")} value={counters.inFlight} icon={Send}         delta={t(locale, "signatures.kpi.inFlightDelta")} deltaTone="up" />
        <Kpi label={t(locale, "signatures.kpi.complete")} value={counters.complete} icon={CheckCircle2} delta={t(locale, "signatures.kpi.completeDelta")} deltaTone="up" />
        <Kpi label={t(locale, "signatures.kpi.declined")} value={counters.declined} icon={Clock}        delta={t(locale, "signatures.kpi.declinedDelta")} deltaTone={counters.declined ? "down" : "neutral"} />
      </div>

      <Card>
        <CardHeader title={t(locale, "signatures.list.title")} subtitle={t(locale, "signatures.list.subtitle")} />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "signatures.list.colDocument")}</th>
                <th>{t(locale, "signatures.list.colOrder")}</th>
                <th>{t(locale, "signatures.list.colParties")}</th>
                <th>{t(locale, "signatures.list.colStatus")}</th>
                <th>{t(locale, "signatures.list.colCreated")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((w) => (
                <tr key={w.id} className="align-top">
                  <td><div className="font-medium">{w.title}</div></td>
                  <td><Badge tone="neutral">{t(locale, `signatures.order.${w.order}`)}</Badge></td>
                  <td>
                    <ul className="space-y-1.5">
                      {w.parties.map((p) => (
                        <li key={p.id} className="text-caption flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-ink">{p.ordinal}. {p.name}</span>
                          <span className="text-muted">{p.email}</span>
                          <Badge tone={PARTY_STATUS_TONE[p.status] ?? "neutral"}>{t(locale, `signatures.partyStatus.${p.status}`)}</Badge>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td><Badge tone={STATUS_TONE[w.status] ?? "neutral"}>{t(locale, `signatures.workflowStatus.${w.status}`)}</Badge></td>
                  <td className="text-caption text-muted">{w.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="text-end">
                    {w.status === "draft" && <SendWorkflowButton locale={locale} id={w.id} />}
                    {w.status !== "draft" && <span className="text-caption text-muted">-</span>}
                  </td>
                </tr>
              ))}
              {workflows.length === 0 && (
                <tr><td colSpan={6} className="text-center text-body-sm text-muted py-8">{t(locale, "signatures.list.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
