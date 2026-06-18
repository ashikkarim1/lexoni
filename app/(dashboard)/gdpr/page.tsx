import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Kpi } from "@/components/ui/Kpi";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Lock, ShieldCheck, FileWarning, Database, AlertCircle, Inbox } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listDsr, gdprCounters } from "@/lib/data/gdpr";
import { t } from "@/lib/i18n";
import { DsrAdvanceButton } from "./DsrAdvanceButton";

const TYPE_TONE: Record<string, "info" | "warning" | "danger" | "neutral" | "success"> = {
  access: "info",
  rectification: "info",
  erasure: "danger",
  restriction: "warning",
  portability: "info",
  objection: "warning",
};
const STATUS_TONE: Record<string, "info" | "warning" | "danger" | "neutral" | "success"> = {
  received: "neutral",
  verifying: "warning",
  in_progress: "info",
  completed: "success",
  rejected: "danger",
};

export default async function GdprPage() {
  const session = await getSession();
  const locale = session.locale;
  const [dsr, counters] = await Promise.all([listDsr(session), gdprCounters(session)]);

  const now = new Date();
  const daysLeft = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.gdpr")}
        title={t(locale, "gdpr.title")}
        subtitle={t(locale, "gdpr.subtitle")}
        actions={
          <>
            <Link href="/gdpr/ropa" className="btn-secondary btn-sm">{t(locale, "gdpr.ropa.title")}</Link>
            <Link href="/gdpr/consent" className="btn-secondary btn-sm">{t(locale, "gdpr.consent.title")}</Link>
            <Link href="/gdpr/policy" className="btn-secondary btn-sm">{t(locale, "gdpr.policy.title")}</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t(locale, "gdpr.kpi.dsrOpen")}     value={counters.dsrOpen}     icon={Inbox}        delta={t(locale, "gdpr.kpi.dsrOpenDelta")}     deltaTone={counters.dsrOpen ? "neutral" : "up"} />
        <Kpi label={t(locale, "gdpr.kpi.dsrOverdue")}  value={counters.dsrOverdue}  icon={AlertCircle}  delta={t(locale, "gdpr.kpi.dsrOverdueDelta")}  deltaTone={counters.dsrOverdue ? "down" : "up"} />
        <Kpi label={t(locale, "gdpr.kpi.ropa")}        value={counters.ropaCount}   icon={Database}     delta={t(locale, "gdpr.kpi.ropaDelta")}        deltaTone="neutral" />
        <Kpi label={t(locale, "gdpr.kpi.consent")}     value={counters.consentActive} icon={ShieldCheck} delta={t(locale, "gdpr.kpi.consentDelta")}    deltaTone="neutral" />
      </div>

      <Card>
        <CardHeader
          title={t(locale, "gdpr.dsr.title")}
          subtitle={t(locale, "gdpr.dsr.subtitle")}
          action={<Badge tone="info"><FileWarning className="h-3 w-3" />{t(locale, "gdpr.dsr.clock")}</Badge>}
        />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "gdpr.dsr.colSubject")}</th>
                <th>{t(locale, "gdpr.dsr.colType")}</th>
                <th>{t(locale, "gdpr.dsr.colReceived")}</th>
                <th>{t(locale, "gdpr.dsr.colDue")}</th>
                <th>{t(locale, "gdpr.dsr.colStatus")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dsr.map((r) => {
                const days = daysLeft(r.dueAt);
                const overdue = days < 0 && r.status !== "completed" && r.status !== "rejected";
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium">{r.subjectName}</div>
                      <div className="text-caption text-muted">{r.subjectEmail}</div>
                    </td>
                    <td><Badge tone={TYPE_TONE[r.type]}>{t(locale, `gdpr.dsr.type.${r.type}`)}</Badge></td>
                    <td className="text-caption text-muted">{r.receivedAt.toISOString().slice(0, 10)}</td>
                    <td className="text-caption">
                      <span className={overdue ? "text-danger-700 font-medium" : "text-muted"}>
                        {r.dueAt.toISOString().slice(0, 10)}
                        {r.status !== "completed" && r.status !== "rejected" && (
                          <span className="ms-1">({overdue ? t(locale, "gdpr.dsr.overdueBy", { n: -days }) : t(locale, "gdpr.dsr.daysLeft", { n: days })})</span>
                        )}
                      </span>
                    </td>
                    <td><Badge tone={STATUS_TONE[r.status]}>{t(locale, `gdpr.dsr.status.${r.status}`)}</Badge></td>
                    <td className="text-end">
                      <DsrAdvanceButton locale={locale} id={r.id} status={r.status} />
                    </td>
                  </tr>
                );
              })}
              {dsr.length === 0 && (
                <tr><td colSpan={6} className="text-center text-body-sm text-muted py-8">{t(locale, "gdpr.dsr.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t(locale, "gdpr.guarantees.title")} subtitle={t(locale, "gdpr.guarantees.subtitle")} />
        <CardBody className="space-y-3 text-body-sm">
          <Guarantee icon={Lock} label={t(locale, "gdpr.guarantees.tenant")} />
          <Guarantee icon={Database} label={t(locale, "gdpr.guarantees.residency", { region: session.region })} />
          <Guarantee icon={ShieldCheck} label={t(locale, "gdpr.guarantees.audit")} />
          <Guarantee icon={FileWarning} label={t(locale, "gdpr.guarantees.export")} />
        </CardBody>
      </Card>
    </div>
  );
}

function Guarantee({ icon: Icon, label }: { icon: typeof Lock; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="text-body-sm">{label}</div>
    </div>
  );
}
