"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function PlanSelect({
  locale,
  currentPlanId,
  plans,
}: {
  locale: Locale;
  currentPlanId: string;
  plans: Array<{ id: string; name: string; tier: string; priceUsd: number; seats: number }>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const change = (planId: string) => {
    if (planId === currentPlanId) return;
    startTransition(async () => {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) { toast.error(t(locale, "billing.subscription.failed")); return; }
      const next = plans.find((p) => p.id === planId);
      toast.success(t(locale, "billing.subscription.changed", { plan: next?.name ?? "-" }));
      router.refresh();
    });
  };

  return (
    <div>
      <div className="sec-title mb-2">{t(locale, "billing.subscription.change")}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {plans.map((p) => {
          const current = p.id === currentPlanId;
          return (
            <button
              key={p.id}
              onClick={() => change(p.id)}
              disabled={pending || current}
              className={`card p-4 text-start transition-colors ${current ? "border-primary-500 bg-primary-50/40" : "hover:border-primary-300"}`}
            >
              <div className="flex items-baseline justify-between">
                <div className="font-semibold">{p.name}</div>
                <div className="text-caption text-muted">{p.tier}</div>
              </div>
              <div className="text-h2 tabular-nums mt-2">${p.priceUsd}<span className="text-caption text-muted">/mo</span></div>
              <div className="text-caption text-muted mt-1">{t(locale, "billing.subscription.seatsIncluded", { n: p.seats })}</div>
              {current && <div className="text-caption text-primary-700 font-medium mt-2">{t(locale, "billing.subscription.currentPlan")}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
