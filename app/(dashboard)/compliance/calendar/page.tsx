import { PageHeader } from "@/components/ui/PageHeader";
import { Kpi } from "@/components/ui/Kpi";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CalendarClock, AlertCircle, MapPin, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listFilings, complianceCounters, reconcileOverdue } from "@/lib/data/compliance";
import { t } from "@/lib/i18n";
import { MarkFiledButton } from "./MarkFiledButton";

const SEVERITY_TONE: Record<string, "info" | "warning" | "danger" | "neutral"> = {
  critical: "danger", high: "danger", medium: "warning", low: "neutral",
};
const STATUS_TONE: Record<string, "info" | "warning" | "danger" | "neutral" | "success"> = {
  open: "info", in_progress: "info", filed: "success", overdue: "danger", waived: "neutral",
};

export default async function ComplianceCalendarPage() {
  const session = await getSession();
  const locale = session.locale;
  await reconcileOverdue(session);
  const [filings, counters] = await Promise.all([listFilings(session), complianceCounters(session)]);

  const now = new Date();
  const days = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  const groups = new Map<string, typeof filings>();
  for (const f of filings) {
    const key = `${f.dueAt.getFullYear()}-${String(f.dueAt.getMonth() + 1).padStart(2, "0")}`;
    const arr = groups.get(key) ?? [];
    arr.push(f);
    groups.set(key, arr);
  }
  const monthKeys = Array.from(groups.keys()).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.calendar")}
        title={t(locale, "compliance.calendar.title")}
        subtitle={t(locale, "compliance.calendar.subtitle")}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label={t(locale, "compliance.kpi.open")}        value={counters.open}        icon={CalendarClock} delta={t(locale, "compliance.kpi.openDelta")}        deltaTone="neutral" />
        <Kpi label={t(locale, "compliance.kpi.overdue")}     value={counters.overdue}     icon={AlertCircle}   delta={t(locale, "compliance.kpi.overdueDelta")}     deltaTone={counters.overdue ? "down" : "up"} />
        <Kpi label={t(locale, "compliance.kpi.dueWeek")}     value={counters.dueThisWeek} icon={CalendarClock} delta={t(locale, "compliance.kpi.dueWeekDelta")}     deltaTone={counters.dueThisWeek ? "neutral" : "up"} />
        <Kpi label={t(locale, "compliance.kpi.uaeOpen")}     value={counters.uaeOpen}     icon={MapPin}        delta="UAE" deltaTone="neutral" />
        <Kpi label={t(locale, "compliance.kpi.ksaOpen")}     value={counters.ksaOpen}     icon={MapPin}        delta="KSA" deltaTone="neutral" />
      </div>

      {monthKeys.map((mk) => {
        const items = groups.get(mk) ?? [];
        const [year, monthIdx] = mk.split("-").map(Number);
        const monthName = new Date(year, monthIdx - 1, 1).toLocaleString(locale === "ar" ? "ar-AE" : "en-US", { month: "long", year: "numeric" });
        return (
          <Card key={mk}>
            <CardHeader title={monthName} subtitle={t(locale, "compliance.calendar.monthSubtitle", { n: items.length })} />
            <CardBody className="!p-0">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t(locale, "compliance.calendar.colDue")}</th>
                    <th>{t(locale, "compliance.calendar.colFiling")}</th>
                    <th>{t(locale, "compliance.calendar.colRegulator")}</th>
                    <th>{t(locale, "compliance.calendar.colSeverity")}</th>
                    <th>{t(locale, "compliance.calendar.colStatus")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => {
                    const overdue = f.dueAt < now && f.status !== "filed" && f.status !== "waived";
                    const d = days(f.dueAt);
                    return (
                      <tr key={f.id}>
                        <td>
                          <div className="text-body-sm tabular-nums">{f.dueAt.toISOString().slice(0, 10)}</div>
                          {f.status !== "filed" && f.status !== "waived" && (
                            <div className={`text-caption ${overdue ? "text-danger-700 font-medium" : "text-muted"}`}>
                              {overdue ? t(locale, "compliance.calendar.overdueBy", { n: -d }) : t(locale, "compliance.calendar.inDays", { n: d })}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="font-medium">{f.title}</div>
                          {f.companyName && <div className="text-caption text-muted">{f.companyName}</div>}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-body-sm">
                            <ShieldCheck className="h-3.5 w-3.5 text-muted" />
                            {f.regulator}
                            <Badge tone="neutral">{f.region}</Badge>
                          </div>
                        </td>
                        <td><Badge tone={SEVERITY_TONE[f.severity] ?? "neutral"}>{f.severity}</Badge></td>
                        <td><Badge tone={STATUS_TONE[f.status] ?? "neutral"}>{f.status}</Badge></td>
                        <td className="text-end">
                          {f.status !== "filed" && f.status !== "waived" && (
                            <MarkFiledButton locale={locale} id={f.id} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardBody>
          </Card>
        );
      })}

      {monthKeys.length === 0 && (
        <Card>
          <CardBody className="text-center py-12 text-body-sm text-muted">
            {t(locale, "compliance.calendar.empty")}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
