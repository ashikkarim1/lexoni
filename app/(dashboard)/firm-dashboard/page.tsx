import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { Activity, Clock, Wallet, Briefcase, AlertTriangle, TrendingUp, ChevronRight, ShieldAlert, Lock, Hourglass } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { computeFirmWip, computeFirmLeakage } from "@/lib/data/time";
import { listPerformanceForFirm, listBlockersForFirm, getFirmVitality, listLeakageAlerts, getThroughput } from "@/lib/data/desk";
import { listAccessRequests } from "@/lib/data/walls";
import { listConflicts } from "@/lib/data/conflicts";
import { t, type Locale } from "@/lib/i18n";
import { PerformanceTable } from "./PerformanceTable";
import { SEVERITY_TONE } from "@/lib/ui/statuses";

export default async function FirmPulsePage() {
  const fmt = (n: number) => `$${(n / 1000).toFixed(1)}k`;
  const session = await getSession();
  const locale: Locale = session.locale;
  const [wip, openLeakage, accessRequests, conflicts, v, performance, blockers, leakage, throughputByMonth] = await Promise.all([
    computeFirmWip(session),
    computeFirmLeakage(session),
    listAccessRequests(session),
    listConflicts(session),
    getFirmVitality(session),
    listPerformanceForFirm(session),
    listBlockersForFirm(session),
    listLeakageAlerts(session),
    getThroughput(session),
  ]);
  const maxThru = Math.max(...throughputByMonth.flatMap((m) => [m.opened, m.closed]));

  // Exception-first computation - these drive the three big cards at the top
  // of the page. A partner's Sunday morning only needs to scan these.
  const slippingBlockers = blockers.filter((b) => b.severity === "critical" || b.severity === "high");
  const pendingWallDecisions = accessRequests.filter((r) => r.status === "requested");
  const openConflicts = conflicts.filter((c) => c.outcome === "potential" || c.outcome === "confirmed");

  const exceptions = [
    {
      key: "slipping",
      tone: "danger" as const,
      icon: AlertTriangle,
      metric: slippingBlockers.length,
      title: t(locale, "firmpulse.exceptionSlipping"),
      body: t(locale, "firmpulse.exceptionSlippingBody"),
      href: "/conflicts/access-log",
      cta: t(locale, "firmpulse.review"),
      show: slippingBlockers.length > 0,
    },
    {
      key: "wallDecisions",
      tone: "warning" as const,
      icon: Lock,
      metric: pendingWallDecisions.length,
      title: t(locale, "firmpulse.exceptionWall"),
      body: t(locale, "firmpulse.exceptionWallBody"),
      href: "/conflicts/walls",
      cta: t(locale, "firmpulse.decide"),
      show: pendingWallDecisions.length > 0,
    },
    {
      key: "agedWip",
      tone: "warning" as const,
      icon: Hourglass,
      metric: fmt(wip.agedUsd),
      title: t(locale, "firmpulse.exceptionAged"),
      body: t(locale, "firmpulse.exceptionAgedBody"),
      href: "/billing",
      cta: t(locale, "firmpulse.actionInvoice"),
      show: wip.agedUsd > 0,
    },
    {
      key: "openConflicts",
      tone: "danger" as const,
      icon: ShieldAlert,
      metric: openConflicts.length,
      title: t(locale, "firmpulse.exceptionConflicts"),
      body: t(locale, "firmpulse.exceptionConflictsBody"),
      href: "/conflicts",
      cta: t(locale, "firmpulse.review"),
      show: openConflicts.length > 0,
    },
  ].filter((e) => e.show);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.firmdash")}
        title={t(locale, "firmpulse.title")}
        subtitle={t(locale, "firmpulse.subtitle", { firm: session.tenantName, region: session.region })}
        actions={<button className="btn-primary btn-sm"><Activity className="h-4 w-4" aria-hidden /> {t(locale, "firmpulse.exportBoardPack")}</button>}
      />

      {/* EXCEPTIONS - the only thing a partner needs to scan first. */}
      {exceptions.length > 0 ? (
        <section aria-label={t(locale, "firmpulse.exceptionsAria")}>
          <div className="flex items-center gap-2 mb-3">
            <div className="sec-title">{t(locale, "firmpulse.needsAttention")}</div>
            <Badge tone="danger">{exceptions.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exceptions.slice(0, 3).map((e) => {
              const Icon = e.icon;
              const accent =
                e.tone === "danger"  ? "border-danger-200 bg-danger-50"   :
                e.tone === "warning" ? "border-warning-200 bg-warning-50" :
                                       "border-line bg-surface";
              const iconBg =
                e.tone === "danger"  ? "bg-danger-100 text-danger-700"   :
                e.tone === "warning" ? "bg-warning-100 text-warning-700" :
                                       "bg-neutral-100 text-neutral-700";
              return (
                <Link key={e.key} href={e.href} className={`card border ${accent} p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconBg} shrink-0`}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-h1 tabular-nums leading-none">{e.metric}</div>
                      <div className="text-body-sm font-semibold mt-1">{e.title}</div>
                    </div>
                  </div>
                  <p className="text-caption text-muted leading-snug">{e.body}</p>
                  <div className="inline-flex items-center gap-1 text-caption font-semibold text-ink mt-auto">
                    {e.cta}
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="card p-5 flex items-center gap-3 border-success-200 bg-success-50">
          <div className="h-10 w-10 rounded-lg bg-success-100 text-success-700 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="text-body-sm font-semibold">{t(locale, "firmpulse.allClearTitle")}</div>
            <div className="text-caption text-muted mt-0.5">{t(locale, "firmpulse.allClearBody")}</div>
          </div>
        </section>
      )}

      {/* HEALTH - vitality dial + dense KPI strip. Secondary read. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center py-7">
            <div className="sec-title mb-3">{t(locale, "firmpulse.vitalityTitle")}</div>
            <Dial value={v.index} />
            <div className="text-body-sm text-muted mt-3">{t(locale, "firmpulse.vitalityFormula")}</div>
            <div className="mt-1 text-caption text-success-700 font-medium flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden /> {t(locale, "firmpulse.vitalityDelta")}
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi label={t(locale, "firmpulse.kpi.utilisation")} value={`${v.utilisationPct}%`} icon={Clock} delta={t(locale, "firmpulse.kpi.utilisationDelta")} deltaTone="neutral" />
          <Kpi label={t(locale, "firmpulse.kpi.realisation")} value={`${v.realisationPct}%`} icon={TrendingUp} delta={t(locale, "firmpulse.kpi.realisationDelta")} deltaTone="up" />
          <Kpi label={t(locale, "firmpulse.kpi.wipTotal")}   value={fmt(wip.totalUsd)} icon={Wallet} delta={t(locale, "firmpulse.kpi.wipAged", { amount: fmt(wip.agedUsd) })} deltaTone="down" />
          <Kpi label={t(locale, "firmpulse.kpi.ar")}         value={fmt(v.arOutstandingUsd)} icon={Wallet} delta={t(locale, "firmpulse.kpi.arDelta")} deltaTone="down" />
          <Kpi label={t(locale, "firmpulse.kpi.activeMatters")} value={v.activeMatters} icon={Briefcase} delta={t(locale, "firmpulse.kpi.closedYtd", { n: v.mattersClosedYTD })} deltaTone="neutral" />
          <Kpi label={t(locale, "firmpulse.kpi.openLeakage")} value={fmt(openLeakage.totalUsd)} icon={AlertTriangle} delta={t(locale, "firmpulse.kpi.blockers", { n: v.openBlockers })} deltaTone="down" />
        </div>
      </div>

      {/* DEEP DIVE - throughput + revenue leakage + performance + slipping list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t(locale, "firmpulse.throughputTitle")}
            subtitle={t(locale, "firmpulse.throughputSubtitle", { opened: v.mattersOpenedThisMonth, closed: v.mattersClosedThisMonth })}
          />
          <CardBody>
            <div className="flex items-end gap-2 h-40">
              {throughputByMonth.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-32">
                    <div className="w-1/2 bg-primary-600 rounded-t" style={{ height: `${(m.opened / maxThru) * 100}%` }} title={`${m.opened} opened`} />
                    <div className="w-1/2 bg-success-600 rounded-t" style={{ height: `${(m.closed / maxThru) * 100}%` }} title={`${m.closed} closed`} />
                  </div>
                  <div className="text-caption text-muted">{m.month}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-caption text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-600" /> {t(locale, "firmpulse.throughputOpened")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-600" /> {t(locale, "firmpulse.throughputClosed")}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t(locale, "firmpulse.leakageTitle")} subtitle={t(locale, "firmpulse.leakageSubtitle")} />
          <CardBody className="space-y-3">
            {leakage.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-body-sm font-medium leading-snug">{l.kind}</div>
                  <div className="text-caption text-muted truncate">{l.matter}</div>
                </div>
                <div className="text-body-sm font-semibold tabular-nums shrink-0">${l.amountUsd.toLocaleString()}</div>
              </div>
            ))}
            <div className="border-t border-line pt-3 flex justify-between text-body-sm font-semibold">
              <span>{t(locale, "firmpulse.leakageTotal")}</span>
              <span className="tabular-nums">${leakage.reduce((a, l) => a + l.amountUsd, 0).toLocaleString()}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t(locale, "firmpulse.performanceTitle")}
          subtitle={t(locale, "firmpulse.performanceSubtitle")}
        />
        <CardBody className="!p-0">
          <PerformanceTable locale={locale} rows={performance} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t(locale, "firmpulse.slippingTitle")} subtitle={t(locale, "firmpulse.slippingSubtitle")} />
        <CardBody className="!p-0">
          <div className="divide-y divide-line">
            {blockers.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                <Badge tone={SEVERITY_TONE[b.severity]}>{b.severity}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm font-medium leading-snug">{b.title}</div>
                  <div className="text-caption text-muted">#{b.matterNumber} · {b.matter} · {b.owner}</div>
                </div>
                <div className="text-caption text-muted shrink-0">{b.kind.replace(/_/g, " ")} · {t(locale, "common.daysAgo", { n: b.ageDays })}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Dial({ value }: { value: number }) {
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - value / 100);
  const toneClass = value >= 75 ? "stroke-success-600" : value >= 50 ? "stroke-warning-500" : "stroke-danger-600";
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" className="stroke-line" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" className={toneClass} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-display tabular-nums">{value}</div>
        <div className="text-caption text-muted">/ 100</div>
      </div>
    </div>
  );
}
