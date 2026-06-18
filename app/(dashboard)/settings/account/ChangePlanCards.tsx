"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Plan = { id: string; name: string; tier: string; monthlyPriceUsd: number; seats: number };

export function ChangePlanCards({ plans, currentPlanId, canChange }: { plans: Plan[]; currentPlanId: string | null; canChange: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<Plan | null>(null);

  const currentPrice = plans.find((p) => p.id === currentPlanId)?.monthlyPriceUsd ?? 0;

  async function confirmChange() {
    if (!pending) return;
    setBusy(pending.id);
    const res = await fetch("/api/billing/subscription", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId: pending.id }),
    });
    setBusy(null);
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Plan changed");
    setPending(null);
    router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlanId;
          const isUpgrade = currentPlanId && p.monthlyPriceUsd > currentPrice;
          const isDowngrade = currentPlanId && p.monthlyPriceUsd < currentPrice;
          return (
            <div key={p.id} className={`card p-5 flex flex-col ${isCurrent ? "border-success-300 bg-success-50/30 ring-1 ring-success-200" : ""}`}>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-h3">{p.name}</div>
                <span className="text-caption text-muted uppercase tracking-wider">{p.tier}</span>
              </div>
              <div className="text-display tabular-nums mt-3">${p.monthlyPriceUsd}<span className="text-body-sm text-muted">/mo</span></div>
              <div className="text-caption text-muted mt-1">{p.seats} seats included</div>
              <div className="mt-5 pt-4 border-t border-line">
                {isCurrent ? (
                  <div className="flex items-center gap-1.5 text-success-700 text-body-sm font-medium"><Check className="h-4 w-4" /> Current plan</div>
                ) : (
                  <button
                    className="btn-primary btn-sm w-full"
                    disabled={!canChange || busy !== null}
                    onClick={() => setPending(p)}
                  >
                    {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isUpgrade ? <ArrowUpRight className="h-4 w-4" /> : isDowngrade ? <ArrowDownRight className="h-4 w-4" /> : null}
                    {isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Switch"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pending && (
        <Modal open={!!pending} title={`Switch to ${pending.name}?`} onClose={() => setPending(null)}>
          <div className="space-y-3 text-body-sm">
            <p>
              You're about to switch from{" "}
              <strong>{plans.find((p) => p.id === currentPlanId)?.name ?? "(no plan)"}</strong>{" "}
              to <strong>{pending.name}</strong> at <strong>${pending.monthlyPriceUsd}/mo</strong>.
            </p>
            {pending.monthlyPriceUsd > currentPrice ? (
              <p className="text-caption text-muted">Upgrades take effect immediately. We prorate the difference and add it to your next invoice.</p>
            ) : (
              <p className="text-caption text-muted">Downgrades take effect at your next renewal. No refund is issued for the current period; the new price kicks in on renewal day.</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setPending(null)} disabled={busy !== null}>Cancel</button>
              <button className="btn-primary" onClick={confirmChange} disabled={busy !== null}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirm change
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
