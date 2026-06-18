import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Wallet, CreditCard, Building2, Users, Activity, Receipt, ShieldCheck, Crown } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session-server";
import { getSubscription, listPlans, listInvoices, listUsage } from "@/lib/data/billing";
import { ChangePlanCards } from "./ChangePlanCards";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";

export const dynamic = "force-dynamic";

const fmtUsd = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export default async function AccountPage() {
  const session = await getSession();
  const [sub, plans, invoices, usage] = await Promise.all([
    getSubscription(session),
    listPlans(),
    listInvoices(session),
    listUsage(session, 30),
  ]);

  // Compute usage rollup.
  const usageByKind = new Map<string, { units: number; amountCents: number }>();
  for (const u of usage) {
    const k = usageByKind.get(u.kind) ?? { units: 0, amountCents: 0 };
    k.units += 1; k.amountCents += u.amountCents;
    usageByKind.set(u.kind, k);
  }

  const recentInvoices = invoices.slice(0, 6);
  const paidYtd = invoices
    .filter((i) => i.status === "paid")
    .reduce((a, n) => a + n.totalCents, 0);
  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "draft")
    .reduce((a, n) => a + n.totalCents, 0);

  const isFirmAdmin = session.role === "firm_admin" || session.role === "platform_admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account & billing"
        subtitle="Subscription, payment method, invoices, usage - everything in one place."
        actions={<Link href="/billing" className="btn-secondary btn-sm">Open billing book</Link>}
      />

      {/* Top - current plan card */}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-caption text-muted uppercase tracking-wider">
              <Crown className="h-3.5 w-3.5" /> Current plan
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <div className="text-display font-semibold tracking-tight">{sub?.planName ?? "-"}</div>
              {sub && <Badge tone="info">{sub.planTier}</Badge>}
              {sub?.status && <Badge tone={sub.status === "active" ? "success" : sub.status === "trialing" ? "warning" : "neutral"}>{sub.status}</Badge>}
            </div>
            {sub ? (
              <div className="text-body-sm text-muted mt-2 leading-relaxed">
                <strong className="text-ink tabular-nums">${sub.priceUsd}</strong> / month · <strong className="text-ink tabular-nums">{sub.seatsInUse}</strong> of {sub.seatsIncluded} seats in use
                {sub.currentPeriodEndsAt && <> · renews <span className="text-ink">{new Date(sub.currentPeriodEndsAt).toISOString().slice(0, 10)}</span></>}
                {sub.trialEndsAt && <> · trial ends <span className="text-ink">{new Date(sub.trialEndsAt).toISOString().slice(0, 10)}</span></>}
              </div>
            ) : (
              <div className="text-body-sm text-muted mt-2">No active subscription. Pick a plan below to get started.</div>
            )}
          </div>
          <div className="flex md:flex-col gap-2 md:items-end">
            <Link href="#change-plan" className="btn-primary btn-sm">Change plan</Link>
            {sub && isFirmAdmin && <CancelSubscriptionButton subscriptionId={sub.subscriptionId} />}
          </div>
        </CardBody>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Paid this year"  value={fmtUsd(paidYtd)}      icon={Wallet}      sub={`${invoices.filter((i) => i.status === "paid").length} invoices`} />
        <KpiCard label="Outstanding"     value={fmtUsd(outstanding)}  icon={Receipt}     sub={`${invoices.filter((i) => i.status !== "paid" && i.status !== "draft").length} open`} tone={outstanding > 0 ? "warning" : "neutral"} />
        <KpiCard label="Seats in use"    value={sub?.seatsInUse ?? 0} icon={Users}       sub={sub ? `of ${sub.seatsIncluded} included` : "-"} />
        <KpiCard label="Usage (30d)"     value={[...usageByKind.values()].reduce((a, n) => a + n.units, 0)} icon={Activity} sub={`${usageByKind.size} meters`} />
      </div>

      {/* Plan picker */}
      {plans.length > 0 && (
        <Card>
          <CardHeader title="Change plan" subtitle="Upgrades take effect immediately and are prorated. Downgrades take effect at the next renewal." />
          <CardBody>
            <div id="change-plan" />
            <ChangePlanCards plans={plans.map((p) => ({ id: p.id, name: p.name, tier: p.tier, monthlyPriceUsd: p.monthlyPriceUsd, seats: p.seats }))} currentPlanId={sub?.planId ?? null} canChange={isFirmAdmin} />
          </CardBody>
        </Card>
      )}

      {/* Payment method */}
      <Card>
        <CardHeader title="Payment method" subtitle="VAT-aware invoicing (UAE 5% / KSA 15%). ZATCA-compliant numbering on KSA tenants." />
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-line bg-canvas/60 p-4">
            <div className="flex items-center gap-2 text-caption text-muted uppercase tracking-wider">
              <CreditCard className="h-3.5 w-3.5" /> On file
            </div>
            <div className="text-body-sm mt-2">
              <div className="font-medium">Bank transfer · invoice payment</div>
              <div className="text-muted">No card on file. Pay each invoice on receipt by wire to the firm's account.</div>
            </div>
            <button className="btn-secondary btn-sm mt-3" disabled title="Stripe wire-up ships in Q3">Add card (Stripe)</button>
          </div>
          <div className="rounded-lg border border-line bg-canvas/60 p-4">
            <div className="flex items-center gap-2 text-caption text-muted uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" /> Billing entity
            </div>
            <div className="text-body-sm mt-2">
              <div className="font-medium">{session.tenantName}</div>
              <div className="text-muted">Residency: {session.region}. Invoices are issued in AED (UAE) or SAR (KSA) on the firm's locale.</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent invoices */}
      <Card>
        <CardHeader title="Recent invoices" subtitle="Last 6. Open the billing book for the full list." action={<Link href="/billing" className="btn-secondary btn-sm">View all</Link>} />
        <CardBody className="!p-0">
          {recentInvoices.length === 0 ? (
            <div className="text-caption text-muted py-6 text-center">No invoices issued yet.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Number</th><th>Matter</th><th>Issued</th><th className="text-end">Total</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {recentInvoices.map((i) => (
                  <tr key={i.id}>
                    <td className="font-mono text-caption">{i.number}</td>
                    <td className="text-body-sm">{i.matterTitle ?? "-"}</td>
                    <td className="text-caption text-muted">{i.issuedAt ? i.issuedAt.toISOString().slice(0, 10) : "-"}</td>
                    <td className="text-end tabular-nums">{i.currency} {(i.totalCents / 100).toLocaleString()}</td>
                    <td><Badge tone={i.status === "paid" ? "success" : i.status === "overdue" ? "danger" : "info"}>{i.status}</Badge></td>
                    <td><Link className="btn-ghost btn-sm border border-line" href={`/billing#i-${i.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Usage */}
      {usageByKind.size > 0 && (
        <Card>
          <CardHeader title="Usage (last 30 days)" subtitle="Metered services + add-ons billed separately at month-end." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Meter</th><th className="text-end">Events</th><th className="text-end">Amount</th></tr></thead>
              <tbody>
                {[...usageByKind.entries()].map(([k, v]) => (
                  <tr key={k}>
                    <td className="font-medium">{k.replace(/_/g, " ")}</td>
                    <td className="text-end tabular-nums">{v.units}</td>
                    <td className="text-end tabular-nums">{fmtUsd(v.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* Trust band */}
      <Card>
        <CardBody className="flex items-start gap-3 text-caption text-muted">
          <ShieldCheck className="h-4 w-4 text-success-700 shrink-0 mt-0.5" />
          <span><span className="font-medium text-ink">Data residency:</span> UAE for UAE tenants, KSA for KSA tenants. <span className="font-medium text-ink">Audit:</span> every plan change, payment + cancellation is recorded in the firm's audit log.</span>
        </CardBody>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, tone }: { label: string; value: string | number; sub: string; icon: typeof Wallet; tone?: "warning" | "neutral" }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="text-caption text-muted uppercase tracking-wider">{label}</div>
          <Icon className="h-4 w-4 text-muted" />
        </div>
        <div className={`text-h1 mt-1 tabular-nums ${tone === "warning" ? "text-warning-700" : ""}`}>{value}</div>
        <div className="text-caption text-muted">{sub}</div>
      </CardBody>
    </Card>
  );
}
