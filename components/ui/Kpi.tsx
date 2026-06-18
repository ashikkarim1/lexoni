import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * Compact KPI tile. Used in dashboards. Always: label (caption) + value (h1) +
 * optional delta. No more, no less - density is the point.
 */
export function Kpi({
  label, value, delta, deltaTone = "neutral", icon: Icon, hint,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  hint?: string;
}) {
  const Trend = deltaTone === "up" ? TrendingUp : deltaTone === "down" ? TrendingDown : null;
  return (
    <div className="card p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="sec-title">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-muted" aria-hidden />}
      </div>
      <div className="text-h1 tabular-nums">{value}</div>
      {(delta || hint) && (
        <div className="flex items-center gap-1.5 text-caption">
          {delta && (
            <span className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              deltaTone === "up" && "text-success-700",
              deltaTone === "down" && "text-danger-700",
              deltaTone === "neutral" && "text-muted",
            )}>
              {Trend && <Trend className="h-3 w-3" aria-hidden />}
              {delta}
            </span>
          )}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}
    </div>
  );
}
