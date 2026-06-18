"use client";
/**
 * EntityCalculator - interactive add-on price slider.
 * Pure UI; pricing logic lives in lib/mock/index.ts → entityAddOnUsd().
 */
import { useState, useMemo } from "react";
import { plans, entityAddOnUsd, type Plan } from "@/lib/mock";

export function EntityCalculator() {
  const [planTier, setPlanTier] = useState<Plan["tier"]>("growth");
  const [count, setCount]       = useState<number>(15);

  const plan = useMemo(() => plans.find((p) => p.tier === planTier)!, [planTier]);
  const planBase = plan.priceMinUsd === "custom" ? 0 : (plan.priceMaxUsd ?? plan.priceMinUsd);
  const addOn = entityAddOnUsd(count);
  const isCustom = plan.priceMinUsd === "custom" || addOn === "custom";
  const total = isCustom ? "Talk to us" : `$${(planBase + (addOn as number)).toLocaleString()}/mo`;

  return (
    <div className="card p-5 bg-canvas">
      <div className="text-sm font-semibold">Estimate your monthly cost</div>

      <div className="mt-4">
        <label className="text-xs font-medium text-muted">Plan</label>
        <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-white border border-line p-1 text-xs">
          {plans.map((p) => (
            <button
              key={p.tier}
              onClick={() => setPlanTier(p.tier)}
              className={`py-1.5 rounded-md transition ${planTier === p.tier ? "bg-midnight text-white" : "text-muted hover:bg-canvas"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label className="text-xs font-medium text-muted">Entities you manage</label>
          <span className="text-sm font-semibold tabular-nums">{count}{count >= 200 ? "+" : ""}</span>
        </div>
        <input
          type="range" min={1} max={200} value={count} onChange={(e) => setCount(parseInt(e.target.value))}
          className="w-full mt-2 accent-royal"
        />
        <div className="flex justify-between text-[10px] text-muted mt-1"><span>1</span><span>50</span><span>100</span><span>200+</span></div>
      </div>

      <div className="mt-5 pt-4 border-t border-line text-sm space-y-1.5">
        <Row label={`Plan - ${plan.name}`} value={plan.priceMinUsd === "custom" ? "Custom" : `$${planBase.toLocaleString()}/mo`} />
        <Row label={`Entity add-on (${count})`} value={addOn === "custom" ? "Custom" : addOn === 0 ? "Included" : `+$${(addOn as number).toLocaleString()}/mo`} />
        <Row label="Total" value={total} bold />
      </div>

      <p className="text-[11px] text-muted mt-3">
        Example shown: a law firm with 200 client entities on Enterprise pays the plan fee plus a custom entity add-on - typically negotiated in the high four-figures monthly.
      </p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold mt-1 pt-2 border-t border-line" : ""}`}>
      <span className={bold ? "" : "text-muted"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
