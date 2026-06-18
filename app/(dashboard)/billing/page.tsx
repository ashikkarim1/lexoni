import { PageHeader } from "@/components/ui/PageHeader";
import { Kpi } from "@/components/ui/Kpi";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Wallet, FileText, Receipt, Clock } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import {
  listInvoices, billingCounters, listUnbilledWipByCase, getSubscription, listPlans, listUsage,
} from "@/lib/data/billing";
import { t } from "@/lib/i18n";
import { CreateInvoiceButton } from "./CreateInvoiceButton";
import { RecordPaymentButton } from "./RecordPaymentButton";
import { PlanSelect } from "./PlanSelect";

const STATUS_TONE: Record<string, "info" | "warning" | "danger" | "neutral" | "success"> = {
  draft:    "neutral",
  issued:   "info",
  partial:  "warning",
  paid:     "success",
  overdue:  "danger",
  written_off: "neutral",
};

export default async function BillingPage() {
  const session = await getSession();
  const locale = session.locale;
  const [invoices, counters, wip, sub, plans, usage] = await Promise.all([
    listInvoices(session),
    billingCounters(session),
    listUnbilledWipByCase(session),
    getSubscription(session),
    listPlans(),
    listUsage(session, 30),
  ]);

  const fmt = (cents: number, currency = "USD") =>
    new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
  const fmtUsd = (usd: number) => fmt(usd * 100, "USD");

  const seatPctUsed = sub ? Math.round((sub.seatsInUse / Math.max(1, sub.seatsIncluded)) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.billing")}
        title={t(locale, "billing.title")}
        subtitle={t(locale, "billing.subtitle")}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t(locale, "billing.kpi.outstanding")}  value={fmtUsd(counters.outstandingUsd)} icon={Wallet}  delta={t(locale, "billing.kpi.outstandingDelta")} deltaTone={counters.outstandingUsd ? "down" : "up"} />
        <Kpi label={t(locale, "billing.kpi.overdue")}       value={fmtUsd(counters.overdueUsd)}     icon={Receipt} delta={t(locale, "billing.kpi.overdueDelta")}     deltaTone={counters.overdueUsd ? "down" : "up"} />
        <Kpi label={t(locale, "billing.kpi.paidMonth")}     value={fmtUsd(counters.paidThisMonthUsd)} icon={FileText} delta={t(locale, "billing.kpi.paidMonthDelta")} deltaTone="up" />
        <Kpi label={t(locale, "billing.kpi.unbilled")}      value={fmtUsd(counters.unbilledWipUsd)} icon={Clock}   delta={t(locale, "billing.kpi.unbilledDelta")}   deltaTone={counters.unbilledWipUsd ? "neutral" : "up"} />
      </div>

      {sub && (
        <Card>
          <CardHeader
            title={t(locale, "billing.subscription.title")}
            subtitle={t(locale, "billing.subscription.subtitle", { plan: sub.planName, price: `$${sub.priceUsd}` })}
            action={<Badge tone={sub.status === "active" || sub.status === "trialing" ? "success" : "warning"}>{t(locale, `billing.subscription.status.${sub.status}`)}</Badge>}
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Pill label={t(locale, "billing.subscription.plan")} value={`${sub.planName} · ${sub.planTier}`} />
              <Pill label={t(locale, "billing.subscription.period")} value={sub.currentPeriodEndsAt ? sub.currentPeriodEndsAt.toISOString().slice(0, 10) : "-"} />
              <Pill label={t(locale, "billing.subscription.seats")} value={`${sub.seatsInUse} / ${sub.seatsIncluded}`} />
            </div>
            <div className="h-2 bg-line rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${seatPctUsed > 90 ? "bg-danger-500" : seatPctUsed > 75 ? "bg-warning-500" : "bg-primary-600"}`} style={{ width: `${Math.min(100, seatPctUsed)}%` }} />
            </div>
            <PlanSelect locale={locale} currentPlanId={sub.planId} plans={plans.map((p) => ({ id: p.id, name: p.name, tier: p.tier, priceUsd: p.monthlyPriceUsd, seats: p.seats }))} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title={t(locale, "billing.wip.title")}
          subtitle={t(locale, "billing.wip.subtitle")}
        />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "billing.wip.colMatter")}</th>
                <th>{t(locale, "billing.wip.colClient")}</th>
                <th className="text-end">{t(locale, "billing.wip.colHours")}</th>
                <th className="text-end">{t(locale, "billing.wip.colValue")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {wip.map((w) => (
                <tr key={w.caseId}>
                  <td>
                    <div className="font-medium">{w.title}</div>
                    <div className="text-caption text-muted">#{w.matterNumber}</div>
                  </td>
                  <td className="text-body-sm">{w.client}</td>
                  <td className="text-end tabular-nums">{(w.unbilledMinutes / 60).toFixed(1)}h</td>
                  <td className="text-end tabular-nums font-medium">{fmt(w.unbilledCents)}</td>
                  <td className="text-end">
                    <CreateInvoiceButton locale={locale} caseId={w.caseId} matterTitle={w.title} amountUsd={w.unbilledCents / 100} />
                  </td>
                </tr>
              ))}
              {wip.length === 0 && (
                <tr><td colSpan={5} className="text-center text-body-sm text-muted py-8">{t(locale, "billing.wip.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t(locale, "billing.invoices.title")}
          subtitle={t(locale, "billing.invoices.subtitle")}
        />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "billing.invoices.colNumber")}</th>
                <th>{t(locale, "billing.invoices.colMatter")}</th>
                <th className="text-end">{t(locale, "billing.invoices.colSubtotal")}</th>
                <th className="text-end">{t(locale, "billing.invoices.colVat")}</th>
                <th className="text-end">{t(locale, "billing.invoices.colTotal")}</th>
                <th className="text-end">{t(locale, "billing.invoices.colOutstanding")}</th>
                <th>{t(locale, "billing.invoices.colDue")}</th>
                <th>{t(locale, "billing.invoices.colStatus")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((iv) => {
                const overdue = iv.dueAt && iv.dueAt < new Date() && iv.status !== "paid" && iv.outstandingCents > 0;
                return (
                  <tr key={iv.id}>
                    <td className="font-mono text-caption">{iv.number}</td>
                    <td>
                      <div className="font-medium">{iv.matterTitle ?? "-"}</div>
                      {iv.matterNumber && <div className="text-caption text-muted">#{iv.matterNumber}</div>}
                    </td>
                    <td className="text-end tabular-nums">{fmt(iv.subtotalCents, iv.currency)}</td>
                    <td className="text-end tabular-nums text-muted">{fmt(iv.vatCents, iv.currency)}</td>
                    <td className="text-end tabular-nums font-semibold">{fmt(iv.totalCents, iv.currency)}</td>
                    <td className="text-end tabular-nums">{iv.outstandingCents > 0 ? <span className={overdue ? "text-danger-700 font-medium" : ""}>{fmt(iv.outstandingCents, iv.currency)}</span> : <span className="text-muted">-</span>}</td>
                    <td className="text-caption">{iv.dueAt ? iv.dueAt.toISOString().slice(0, 10) : "-"}</td>
                    <td><Badge tone={overdue ? "danger" : STATUS_TONE[iv.status] ?? "neutral"}>{overdue ? t(locale, "billing.invoices.overdue") : t(locale, `billing.invoices.status.${iv.status}`)}</Badge></td>
                    <td className="text-end">
                      {iv.outstandingCents > 0 && (
                        <RecordPaymentButton locale={locale} invoiceId={iv.id} outstandingCents={iv.outstandingCents} currency={iv.currency} />
                      )}
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr><td colSpan={9} className="text-center text-body-sm text-muted py-8">{t(locale, "billing.invoices.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t(locale, "billing.usage.title")} subtitle={t(locale, "billing.usage.subtitle")} />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "billing.usage.colKind")}</th>
                <th>{t(locale, "billing.usage.colDate")}</th>
                <th className="text-end">{t(locale, "billing.usage.colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u, i) => (
                <tr key={i}>
                  <td className="text-body-sm">{u.kind.replace(/_/g, " ")}</td>
                  <td className="text-caption text-muted">{u.occurredAt.toISOString().slice(0, 10)}</td>
                  <td className="text-end tabular-nums">{fmt(u.amountCents)}</td>
                </tr>
              ))}
              {usage.length === 0 && (
                <tr><td colSpan={3} className="text-center text-body-sm text-muted py-8">{t(locale, "billing.usage.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 bg-neutral-50/60">
      <div className="sec-title">{label}</div>
      <div className="text-body font-semibold mt-1">{value}</div>
    </div>
  );
}
