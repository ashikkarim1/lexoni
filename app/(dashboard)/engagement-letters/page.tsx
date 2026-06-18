import { PageHeader } from "@/components/ui/PageHeader";
import { Kpi } from "@/components/ui/Kpi";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileSignature, Sparkles, CheckCircle2, Send } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listEngagementLetters } from "@/lib/data/engagement";
import { t } from "@/lib/i18n";
import { GenerateButton } from "./GenerateButton";
import { SendButton } from "./SendButton";
import { FirmSignButton } from "./FirmSignButton";

const STATUS_TONE: Record<string, "info" | "warning" | "danger" | "neutral" | "success"> = {
  draft:        "neutral",
  sent:         "info",
  viewed:       "warning",
  countersigned:"warning",
  executed:     "success",
  declined:     "danger",
  expired:      "neutral",
};

export default async function EngagementLettersPage() {
  const session = await getSession();
  const locale = session.locale;
  const rows = await listEngagementLetters(session);

  const counters = {
    drafts:    rows.filter((r) => r.status === "draft").length,
    sent:      rows.filter((r) => r.status === "sent" || r.status === "viewed").length,
    countersigned: rows.filter((r) => r.status === "countersigned").length,
    executed:  rows.filter((r) => r.status === "executed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.engagement")}
        title={t(locale, "engagement.title")}
        subtitle={t(locale, "engagement.subtitle")}
        actions={<GenerateButton locale={locale} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t(locale, "engagement.kpi.draft")}         value={counters.drafts}        icon={FileSignature} delta={t(locale, "engagement.kpi.draftDelta")} deltaTone="neutral" />
        <Kpi label={t(locale, "engagement.kpi.sent")}          value={counters.sent}          icon={Send}          delta={t(locale, "engagement.kpi.sentDelta")} deltaTone="up" />
        <Kpi label={t(locale, "engagement.kpi.countersigned")} value={counters.countersigned} icon={Sparkles}      delta={t(locale, "engagement.kpi.countersignedDelta")} deltaTone={counters.countersigned ? "up" : "neutral"} />
        <Kpi label={t(locale, "engagement.kpi.executed")}      value={counters.executed}      icon={CheckCircle2}  delta={t(locale, "engagement.kpi.executedDelta")} deltaTone="up" />
      </div>

      <Card>
        <CardHeader title={t(locale, "engagement.list.title")} subtitle={t(locale, "engagement.list.subtitle")} />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "engagement.list.colClient")}</th>
                <th>{t(locale, "engagement.list.colMatter")}</th>
                <th>{t(locale, "engagement.list.colFee")}</th>
                <th>{t(locale, "engagement.list.colStatus")}</th>
                <th>{t(locale, "engagement.list.colSent")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const amount = r.feeQuoteCents != null
                  ? new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", { style: "currency", currency: r.currency, maximumFractionDigits: 0 }).format(r.feeQuoteCents / 100)
                  : "-";
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium">{r.clientName ?? "-"}</div>
                      <div className="text-caption text-muted">{r.clientEmail ?? "-"}</div>
                    </td>
                    <td>
                      <div className="text-body-sm">{r.matterTitle ?? r.scopeOfWork.slice(0, 80) + (r.scopeOfWork.length > 80 ? "…" : "")}</div>
                    </td>
                    <td className="text-body-sm tabular-nums">
                      <div>{amount}</div>
                      <div className="text-caption text-muted">{r.feeArrangement}</div>
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{t(locale, `engagement.status.${r.status}`)}</Badge>
                    </td>
                    <td className="text-caption text-muted whitespace-nowrap">
                      {r.sentAt ? r.sentAt.toISOString().slice(0, 10) : "-"}
                    </td>
                    <td className="text-end">
                      <RowActions locale={locale} id={r.id} status={r.status} />
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="text-center text-body-sm text-muted py-8">{t(locale, "engagement.list.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function RowActions({ locale, id, status }: { locale: string; id: string; status: string }) {
  if (status === "draft") return <SendButton locale={locale as "en" | "ar"} id={id} />;
  if (status === "countersigned") return <FirmSignButton locale={locale as "en" | "ar"} id={id} />;
  return <span className="text-caption text-muted">-</span>;
}
