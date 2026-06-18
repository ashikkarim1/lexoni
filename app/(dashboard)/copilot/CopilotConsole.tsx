"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Loader2, ShieldAlert, FileText, Gavel, AlertTriangle, Check, X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

type Step = { ordinal: number; name: string; ownerRole?: string; expectedDurationDays?: number; isMilestone?: boolean; dependsOnOrdinals?: number[] };
type Slot = { ordinal: number; title: string; expectedKind: string; stepOrdinal: number; stage?: string; required?: boolean };
type Risk = { severity: "low" | "medium" | "high"; title: string; mitigation: string };
type Plan = {
  title: string; kind: string; region: string; jurisdiction: string | null;
  expectedDurationDays: number; defaultFeeModel: string;
  steps: Step[]; slots: Slot[];
  regulators: Array<{ name: string; role: string }>;
  risks: Risk[];
  estimatedFeeCentsRange: [number, number];
  timelineConfidenceBand: { low: number; high: number };
  confidence: number;
  citationsToHistoricals: Array<{ id: string; title: string; sourceKind: string }>;
  modelLabel: string;
};
type Result = { id: string; plan: Plan };

const RISK_TONE: Record<Risk["severity"], "info" | "warning" | "danger"> = { low: "info", medium: "warning", high: "danger" };
const fmtUsd = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

const APPROVE_ROLES = new Set(["firm_admin", "lawyer", "platform_admin"]);

export function CopilotConsole({ samples, session }: { samples: string[]; session: { role: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const canApprove = APPROVE_ROLES.has(session.role);

  async function generate(o: string) {
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/copilot/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome: o }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Plan generation failed.");
      return;
    }
    setResult(await res.json());
    router.refresh();
  }

  async function decide(decision: "approve" | "reject") {
    if (!result || result.id === "demo") return;
    const reason = decision === "reject" ? window.prompt("Reason for rejecting?") ?? "" : "";
    setBusy(true);
    const res = await fetch("/api/copilot/plan", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: result.id, decision, reason }),
    });
    setBusy(false);
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    toast.success(decision === "approve" ? "Plan approved" : "Plan rejected");
    router.refresh();
  }

  async function instantiate() {
    if (!result || result.id === "demo") return;
    setBusy(true);
    const res = await fetch("/api/copilot/instantiate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: result.id }),
    });
    setBusy(false);
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    const out = await res.json();
    toast.success("Matter created");
    router.push(`/matters/${out.caseId}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <textarea
          className="textarea w-full"
          rows={2}
          placeholder='e.g. "Take this company public on ADX." or "Open a Saudi subsidiary for our UK group."'
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="flex flex-wrap gap-1.5">
            {samples.map((s) => (
              <button key={s} className="text-caption text-muted hover:text-ink hover:bg-canvas border border-line rounded-md px-2 py-1" onClick={() => { setOutcome(s); generate(s); }} disabled={busy}>
                {s.length > 60 ? s.slice(0, 60) + "…" : s}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => generate(outcome)} disabled={busy || !outcome.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />} Generate
          </button>
        </div>
      </div>

      {result && <PlanRender plan={result.plan} canApprove={canApprove} demo={result.id === "demo"} onDecide={decide} onInstantiate={instantiate} busy={busy} />}
    </div>
  );
}

function PlanRender({ plan, canApprove, demo, onDecide, onInstantiate, busy }: {
  plan: Plan; canApprove: boolean; demo: boolean;
  onDecide: (d: "approve" | "reject") => void;
  onInstantiate: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-xl border border-line overflow-hidden">
      <div className="px-5 py-4 bg-canvas/60 border-b border-line">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <div className="text-caption text-muted uppercase tracking-wider">{plan.kind.replace(/_/g, " ")} · {plan.region}{plan.jurisdiction ? ` · ${plan.jurisdiction}` : ""}</div>
            <div className="text-h2 font-semibold tracking-tight">{plan.title}</div>
          </div>
          <div className="text-end">
            <div className="text-caption text-muted">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-line rounded overflow-hidden">
                <div className={`h-full rounded ${plan.confidence >= 70 ? "bg-success-600" : plan.confidence >= 40 ? "bg-warning-500" : "bg-danger-500"}`} style={{ width: `${plan.confidence}%` }} />
              </div>
              <span className="font-semibold tabular-nums">{plan.confidence}%</span>
            </div>
            <div className="text-caption text-muted mt-0.5">{plan.modelLabel}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-body-sm">
          <Kv label="Expected duration" value={`${plan.expectedDurationDays} d`} />
          <Kv label="Timeline band (80%)" value={`${plan.timelineConfidenceBand.low}–${plan.timelineConfidenceBand.high} d`} />
          <Kv label="Estimated fee" value={`${fmtUsd(plan.estimatedFeeCentsRange[0])} – ${fmtUsd(plan.estimatedFeeCentsRange[1])}`} />
          <Kv label="Fee model" value={plan.defaultFeeModel} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="border-e border-line p-5">
          <Section title="Steps" icon={<Compass className="h-4 w-4" />}>
            <ol className="space-y-1.5">
              {plan.steps.map((st) => (
                <li key={st.ordinal} className="flex items-start gap-2 text-body-sm">
                  <span className="text-caption text-muted tabular-nums w-6 shrink-0">{String(st.ordinal).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className={`truncate ${st.isMilestone ? "font-semibold" : ""}`}>{st.name}</span>
                      {st.isMilestone && <Badge tone="info">milestone</Badge>}
                    </div>
                    <div className="text-caption text-muted">
                      {st.ownerRole}{st.expectedDurationDays != null ? ` · ${st.expectedDurationDays}d` : ""}
                      {st.dependsOnOrdinals?.length ? ` · after ${st.dependsOnOrdinals.join(", ")}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>
        <div className="p-5">
          <Section title="Slots" icon={<FileText className="h-4 w-4" />}>
            <ul className="space-y-1.5">
              {plan.slots.map((sl) => (
                <li key={sl.ordinal} className="flex items-start gap-2 text-body-sm">
                  <span className="text-caption text-muted tabular-nums w-6 shrink-0">{String(sl.ordinal).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{sl.title}</div>
                    <div className="text-caption text-muted">{sl.expectedKind}{sl.stage ? ` · ${sl.stage}` : ""}{sl.required === false ? " · optional" : ""}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <div className="border-t border-line p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="Regulators" icon={<Gavel className="h-4 w-4" />}>
          {plan.regulators.length === 0
            ? <div className="text-caption text-muted">No specific regulators.</div>
            : (
              <ul className="space-y-1">
                {plan.regulators.map((r) => (
                  <li key={r.name} className="text-body-sm"><Badge tone="info">{r.name}</Badge> <span className="text-caption text-muted">{r.role}</span></li>
                ))}
              </ul>
            )}
        </Section>
        <Section title="Risks" icon={<ShieldAlert className="h-4 w-4" />}>
          {plan.risks.length === 0
            ? <div className="text-caption text-muted">No risks flagged at planning stage.</div>
            : (
              <ul className="space-y-2">
                {plan.risks.map((r, i) => (
                  <li key={i} className="text-body-sm">
                    <div className="flex items-baseline gap-2">
                      <Badge tone={RISK_TONE[r.severity]}>{r.severity}</Badge>
                      <span className="font-medium">{r.title}</span>
                    </div>
                    <div className="text-caption text-muted ms-1">→ {r.mitigation}</div>
                  </li>
                ))}
              </ul>
            )}
        </Section>
      </div>

      {plan.citationsToHistoricals.length > 0 && (
        <div className="border-t border-line p-5">
          <Section title="Grounded in" icon={<AlertTriangle className="h-4 w-4" />}>
            <div className="text-caption text-muted mb-2">The planner referenced these firm sources:</div>
            <div className="flex flex-wrap gap-1.5">
              {plan.citationsToHistoricals.slice(0, 8).map((c) => (
                <Badge key={c.id} tone="neutral">{c.sourceKind} · {c.title}</Badge>
              ))}
            </div>
          </Section>
        </div>
      )}

      <div className="px-5 py-4 bg-canvas/60 border-t border-line flex items-center justify-between gap-3">
        {demo ? (
          <div className="text-caption text-muted">Demo mode - connect a DB to persist + instantiate.</div>
        ) : (
          <div className="text-caption text-muted">Partner sign-off required before instantiation.</div>
        )}
        <div className="flex items-center gap-2">
          {!demo && canApprove && (
            <>
              <button className="btn-secondary btn-sm" onClick={() => onDecide("reject")} disabled={busy}><X className="h-4 w-4" /> Reject</button>
              <button className="btn-primary btn-sm" onClick={() => onDecide("approve")} disabled={busy}><Check className="h-4 w-4" /> Approve</button>
              <button className="btn-primary btn-sm" onClick={() => onInstantiate()} disabled={busy}>Instantiate matter <ArrowRight className="h-4 w-4" /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-caption uppercase tracking-wider text-muted mb-2">{icon} {title}</div>
      {children}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-caption text-muted">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
