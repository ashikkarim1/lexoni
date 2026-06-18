import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Compass, Target, Users, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { growthSnapshot } from "@/lib/data/growth";
import { outreachFunnel } from "@/lib/data/outreach";
import { listProspects } from "@/lib/data/prospects";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export const dynamic = "force-dynamic";

const fmtUsd = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;
const fmtKind = (k: string) => k.replace(/_/g, " ");

export default async function GrowthPage() {
  const session = await getSession();
  const [snap, funnel, prospects] = await Promise.all([
    growthSnapshot(session),
    outreachFunnel(session),
    listProspects(session),
  ]);
  const { momentum, depth, clients, win } = snap;

  if (momentum.byKind.length === 0 && clients.rows.length === 0) {
    return (
      <ModuleEmpty
        icon={TrendingUp}
        title="Growth Intelligence"
        subtitle="Once you have closed matters + issued invoices + a stream of intakes, this dashboard tells you what's working, what's growing, which clients to nurture, and which prospects to hunt."
        bullets={[
          "Practice momentum - what kinds of work are growing this quarter",
          "Depth radar - where the firm has true competence (on-time %, realisation %)",
          "Client lens - LTV, cross-sell potential, lapsed clients to recover",
          "Prospect queue with lookalike scoring + regulator-driven leads",
          "AI-drafted outreach grounded in your own depth + the firm's voice",
        ]}
        primary={{ label: "Open the prospect queue", href: "/growth/prospects" }}
      />
    );
  }

  const topGrowing = [...momentum.byKind].filter((k) => k.growthPct > 0).sort((a, b) => b.growthPct - a.growthPct)[0];
  const topShrinking = [...momentum.byKind].filter((k) => k.growthPct < 0).sort((a, b) => a.growthPct - b.growthPct)[0];
  const topPractice = depth[0];
  const top3Clients = clients.rows.slice(0, 3);
  const lapsedClients = clients.rows.filter((c) => (c.daysSinceLastMatter ?? 0) > 365).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Growth Intelligence"
        subtitle="What's working, what's growing, who to pursue. Your firm's history is your hunting map."
        actions={
          <div className="flex gap-2">
            <Link href="/growth/prospects" className="btn-secondary btn-sm">Prospect queue</Link>
            <Link href="/growth/outreach" className="btn-primary btn-sm"><Sparkles className="h-4 w-4" /> Outreach</Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total LTV" value={fmtUsd(clients.totals.ltvCents)} icon={TrendingUp} delta={`${clients.totals.clients} clients`} deltaTone="neutral" />
        <Kpi label="Win rate" value={`${win.overallPct}%`} icon={Target} delta="intake → engaged" deltaTone="up" />
        <Kpi label="Lapsed" value={clients.totals.lapsedCount} icon={ArrowDownRight} delta=">12 months since last matter" deltaTone={clients.totals.lapsedCount > 0 ? "down" : "neutral"} />
        <Kpi label="Prospects" value={prospects.length} icon={Compass} delta={`${funnel.sent + funnel.opened + funnel.replied} engaged`} deltaTone="neutral" />
      </div>

      {/* Momentum */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Practice momentum" subtitle="Last 12 months. Sorted by value." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Practice area</th><th className="text-end">Matters</th><th className="text-end">Value</th><th>Growth (last 6 mo)</th></tr></thead>
              <tbody>
                {momentum.byKind.slice(0, 10).map((k) => (
                  <tr key={k.kind}>
                    <td className="font-medium">{fmtKind(k.kind)}</td>
                    <td className="text-end tabular-nums">{k.count}</td>
                    <td className="text-end tabular-nums">{fmtUsd(k.valueCents)}</td>
                    <td>
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                          <div className={`h-full rounded ${k.growthPct > 20 ? "bg-success-600" : k.growthPct > 0 ? "bg-success-300" : k.growthPct < -10 ? "bg-danger-500" : "bg-warning-400"}`}
                            style={{ width: `${Math.min(100, Math.abs(k.growthPct))}%` }} />
                        </div>
                        <span className={`text-caption tabular-nums shrink-0 ${k.growthPct > 0 ? "text-success-700" : "text-danger-700"}`}>
                          {k.growthPct > 0 ? "+" : ""}{k.growthPct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Headlines" subtitle="What partners need to know." />
          <CardBody className="space-y-3">
            {topGrowing && (
              <div className="rounded-lg border border-success-200 bg-success-50/40 p-3">
                <div className="flex items-center gap-1.5 text-caption text-success-700"><ArrowUpRight className="h-3.5 w-3.5" /> Growing fast</div>
                <div className="font-medium mt-0.5">{fmtKind(topGrowing.kind)}</div>
                <div className="text-caption text-muted">{topGrowing.count} matters · {fmtUsd(topGrowing.valueCents)} · +{topGrowing.growthPct.toFixed(0)}%</div>
              </div>
            )}
            {topShrinking && (
              <div className="rounded-lg border border-danger-200 bg-danger-50/40 p-3">
                <div className="flex items-center gap-1.5 text-caption text-danger-700"><ArrowDownRight className="h-3.5 w-3.5" /> Slowing</div>
                <div className="font-medium mt-0.5">{fmtKind(topShrinking.kind)}</div>
                <div className="text-caption text-muted">{topShrinking.count} matters · {fmtUsd(topShrinking.valueCents)} · {topShrinking.growthPct.toFixed(0)}%</div>
              </div>
            )}
            {topPractice && (
              <div className="rounded-lg border border-line bg-canvas/60 p-3">
                <div className="flex items-center gap-1.5 text-caption text-muted"><Target className="h-3.5 w-3.5" /> Deepest practice</div>
                <div className="font-medium mt-0.5">{fmtKind(topPractice.kind)}</div>
                <div className="text-caption text-muted">{topPractice.matters} matters · {topPractice.onTimePct}% on-time · {fmtUsd(topPractice.totalValueCents)}</div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Depth radar */}
      <Card>
        <CardHeader title="Depth radar" subtitle="Where the firm has real competence - sample size matters." />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Practice area</th><th className="text-end">Matters</th><th className="text-end">Closed</th><th className="text-end">Avg duration</th><th>On-time</th><th className="text-end">Total value</th></tr></thead>
            <tbody>
              {depth.slice(0, 12).map((d) => (
                <tr key={d.kind}>
                  <td className="font-medium">{fmtKind(d.kind)}</td>
                  <td className="text-end tabular-nums">{d.matters}</td>
                  <td className="text-end tabular-nums">{d.closed}</td>
                  <td className="text-end tabular-nums">{d.avgDurationDays || "-"} d</td>
                  <td>
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                        <div className={`h-full rounded ${d.onTimePct >= 80 ? "bg-success-600" : d.onTimePct >= 60 ? "bg-warning-500" : "bg-danger-500"}`} style={{ width: `${d.onTimePct}%` }} />
                      </div>
                      <span className="text-caption tabular-nums">{d.onTimePct}%</span>
                    </div>
                  </td>
                  <td className="text-end tabular-nums">{fmtUsd(d.totalValueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Client lens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Top clients" subtitle="By lifetime paid. Cross-sell signal in column 4." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Client</th><th className="text-end">Matters</th><th className="text-end">Paid</th><th>Cross-sell</th></tr></thead>
              <tbody>
                {clients.rows.slice(0, 10).map((c) => (
                  <tr key={c.clientTenantId}>
                    <td className="font-medium">{c.clientName}</td>
                    <td className="text-end tabular-nums">{c.matters}</td>
                    <td className="text-end tabular-nums">{fmtUsd(c.paidCents)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Badge tone={c.uniqueKinds >= 3 ? "success" : c.uniqueKinds === 2 ? "info" : "warning"}>{c.uniqueKinds} practice{c.uniqueKinds === 1 ? "" : "s"}</Badge>
                        {c.uniqueKinds <= 1 && <span className="text-caption text-muted">single-thread</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Lapsed - recover candidates" subtitle="No matter in 12+ months. Ripe for re-engagement." />
          <CardBody className="!p-0">
            {lapsedClients.length === 0 ? (
              <div className="text-caption text-muted p-6 text-center">No lapsed clients - strong retention.</div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Client</th><th className="text-end">LTV</th><th>Days since last matter</th><th></th></tr></thead>
                <tbody>
                  {lapsedClients.map((c) => (
                    <tr key={c.clientTenantId}>
                      <td className="font-medium">{c.clientName}</td>
                      <td className="text-end tabular-nums">{fmtUsd(c.paidCents)}</td>
                      <td className="text-caption text-muted tabular-nums">{c.daysSinceLastMatter} d</td>
                      <td><Link href="/growth/outreach" className="btn-secondary btn-sm">Re-engage</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Win rate by area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Win rate · by legal area" subtitle="Intake → engaged conversion." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Area</th><th className="text-end">Intakes</th><th className="text-end">Engaged</th><th>Conversion</th></tr></thead>
              <tbody>
                {win.byKind.slice(0, 8).map((r) => (
                  <tr key={r.bucket}>
                    <td className="font-medium">{fmtKind(r.bucket)}</td>
                    <td className="text-end tabular-nums">{r.intakes}</td>
                    <td className="text-end tabular-nums">{r.engaged}</td>
                    <td>
                      <div className="flex items-center gap-2 w-24">
                        <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                          <div className={`h-full rounded ${r.pct >= 50 ? "bg-success-600" : r.pct >= 25 ? "bg-warning-500" : "bg-danger-500"}`} style={{ width: `${r.pct}%` }} />
                        </div>
                        <span className="text-caption tabular-nums">{r.pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Outreach funnel" subtitle="From the BD pipeline." />
          <CardBody>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { l: "Drafted",    v: funnel.drafted,   tone: "neutral" },
                { l: "Sent",       v: funnel.sent,      tone: "info" },
                { l: "Opened",     v: funnel.opened,    tone: "info" },
                { l: "Replied",    v: funnel.replied,   tone: "warning" },
                { l: "Converted",  v: funnel.converted, tone: "success" },
              ].map((s) => (
                <div key={s.l} className="rounded-md border border-line bg-canvas/60 p-3">
                  <div className="text-caption text-muted">{s.l}</div>
                  <div className={`text-h2 tabular-nums ${s.tone === "success" ? "text-success-700" : s.tone === "warning" ? "text-warning-700" : ""}`}>{s.v}</div>
                </div>
              ))}
            </div>
            <p className="text-caption text-muted mt-3">Open the outreach inbox to draft + send the next batch.</p>
          </CardBody>
        </Card>
      </div>

      {/* Top prospects teaser */}
      {prospects.length > 0 && (
        <Card>
          <CardHeader title="Top prospects" subtitle="Sorted by lookalike score." action={<Link href="/growth/prospects" className="btn-secondary btn-sm">View all prospects</Link>} />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Prospect</th><th>Industry / Region</th><th>Source</th><th>Predicted fee</th><th>Lookalike</th></tr></thead>
              <tbody>
                {prospects.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.legalName}</td>
                    <td className="text-body-sm">{p.industry ?? "-"} · {p.region}</td>
                    <td><Badge tone={p.source === "regulatory_impact" ? "warning" : "neutral"}>{p.source.replace(/_/g, " ")}</Badge></td>
                    <td className="text-caption tabular-nums">{p.predictedFeeCents ? fmtUsd(p.predictedFeeCents) : "-"}</td>
                    <td>
                      <div className="flex items-center gap-2 w-24">
                        <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                          <div className={`h-full rounded ${p.lookalikeScore >= 70 ? "bg-success-600" : p.lookalikeScore >= 40 ? "bg-warning-500" : "bg-danger-500"}`} style={{ width: `${p.lookalikeScore}%` }} />
                        </div>
                        <span className="text-caption tabular-nums">{p.lookalikeScore}</span>
                      </div>
                    </td>
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

void Users;
