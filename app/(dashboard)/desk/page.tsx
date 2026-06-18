import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { Clock, Wallet, AlertTriangle, Target, ArrowRight, FolderKanban } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listPerformanceForFirm, listBlockersForFirm } from "@/lib/data/desk";
import { listMatters } from "@/lib/data/matters";
import { listDraftsForSession, computeRecoverable } from "@/lib/data/time";
import { t, type Locale } from "@/lib/i18n";
import { ConfirmTime } from "./ConfirmTime";
import { SEVERITY_TONE } from "@/lib/ui/statuses";

export default async function DeskPage() {
  const session = await getSession();
  const locale: Locale = session.locale;
  const firstName = session.fullName.split(" ")[0];

  const [drafts, recoverable, allMatters, performance, blockers] = await Promise.all([
    listDraftsForSession(session),
    computeRecoverable(session),
    listMatters(session),
    listPerformanceForFirm(session),
    listBlockersForFirm(session),
  ]);
  const me = performance.find((p) => p.name === session.fullName) ?? performance[0];
  const myMatters = allMatters.filter((m) => m.lead === session.fullName);
  const myBlockers = blockers.filter((b) => b.owner === session.fullName);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting(locale)}, ${firstName}`}
        subtitle={t(locale, "desk.subtitle")}
        actions={<Link href="/matters" className="btn-primary text-xs"><FolderKanban className="h-4 w-4" /> {t(locale, "desk.myMattersBtn")}</Link>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label={t(locale, "desk.kpi.billableMtd")}
          value={`${me.billableHoursMTD}h`}
          icon={Clock}
          delta={t(locale, "desk.kpi.targetHours", { h: me.targetHoursMTD })}
          deltaTone={me.billableHoursMTD >= me.targetHoursMTD ? "up" : "neutral"}
        />
        <Kpi
          label={t(locale, "desk.kpi.timeToConfirm")}
          value={`${(recoverable.minutes / 60).toFixed(1)}h`}
          icon={Wallet}
          delta={t(locale, "time.recoverable", { amount: `$${recoverable.usd.toLocaleString()}` })}
          deltaTone="up"
        />
        <Kpi
          label={t(locale, "desk.kpi.blockingMatters")}
          value={myBlockers.length}
          icon={AlertTriangle}
          delta={t(locale, "common.needsAction")}
          deltaTone={myBlockers.length ? "down" : "up"}
        />
        <Kpi
          label={t(locale, "desk.kpi.realisation")}
          value={`${me.realisationPct}%`}
          icon={Target}
          delta={t(locale, "desk.kpi.utilisation", { n: me.utilisationPct })}
          deltaTone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ConfirmTime locale={locale} initialDrafts={drafts} />

          <Card>
            <CardHeader title={t(locale, "desk.blockers.title")} subtitle={t(locale, "desk.blockers.subtitle")} />
            <CardBody className="space-y-3">
              {myBlockers.length === 0 && <div className="text-sm text-muted">{t(locale, "desk.blockers.nothing")}</div>}
              {myBlockers.map((b) => (
                <div key={b.id} className="flex items-start gap-3">
                  <Badge tone={SEVERITY_TONE[b.severity]}>{b.severity}</Badge>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug">{b.title}</div>
                    <div className="text-xs text-muted mt-0.5">
                      #{b.matterNumber} · {b.kind.replace(/_/g, " ")} · {t(locale, "common.daysAgo", { n: b.ageDays })}
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t(locale, "desk.book.title")} subtitle={t(locale, "desk.book.subtitle")} />
            <CardBody className="!p-0">
              <div className="divide-y divide-line">
                {myMatters.map((m) => (
                  <Link key={m.id} href={`/matters/${m.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-canvas">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{m.title}</div>
                      <div className="text-xs text-muted mt-0.5">
                        #{m.matterNumber} · {m.processTitle} · {m.jurisdiction} · {t(locale, "desk.book.target", { date: m.targetCloseAt })}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {m.slots.map((sl) => (
                          <span key={sl.id} title={`${sl.title}: ${sl.status.replace(/_/g, " ")}`} className={dot(sl.status)} />
                        ))}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className="text-lg font-semibold tabular-nums">{m.progressPct}%</div>
                      <div className="text-[11px] text-muted">{t(locale, "common.complete")}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted shrink-0" />
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t(locale, "desk.targets.title")} subtitle={t(locale, "desk.targets.subtitle")} />
            <CardBody className="space-y-4">
              <Bar label={t(locale, "desk.targets.billableHours")} value={me.billableHoursMTD} target={me.targetHoursMTD} suffix="h" />
              <Bar label={t(locale, "desk.targets.realisation")} value={me.realisationPct} target={95} suffix="%" />
              <Bar label={t(locale, "desk.targets.collection")} value={me.collectionPct} target={90} suffix="%" />
              <Bar label={t(locale, "desk.targets.onTimeMilestones")} value={me.onTimeMilestonePct} target={95} suffix="%" />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function greeting(locale: Locale) {
  const h = new Date().getHours();
  const key = h < 12 ? "greetingMorning" : h < 18 ? "greetingAfternoon" : "greetingEvening";
  return t(locale, `desk.${key}`);
}

function dot(status: string) {
  const tone =
    ["signed", "filed", "approved"].includes(status) ? "bg-success"
    : ["in_review", "out_for_signature"].includes(status) ? "bg-warning"
    : status === "drafting" ? "bg-royal" : "bg-line";
  return `h-2 w-6 rounded-full ${tone}`;
}

function Bar({ label, value, target, suffix }: { label: string; value: number; target: number; suffix: string }) {
  const pct = Math.min((value / target) * 100, 100);
  const ok = value >= target;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums font-medium">{value}{suffix} <span className="text-muted">/ {target}{suffix}</span></span>
      </div>
      <div className="h-2 bg-line rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${ok ? "bg-success" : "bg-royal"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
