"use client";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DocSlot } from "@/lib/types/matter";
import { t, type Locale } from "@/lib/i18n";

/**
 * Left pane - vertical process stepper. Each slot is a step; status drives
 * dot colour; current selection has a primary ring. Click to focus the
 * centre canvas on that slot.
 */
export function ProcessTimeline({
  locale,
  processTitle,
  jurisdiction,
  slots,
  selectedId,
  onSelect,
  progressPct,
}: {
  locale: Locale;
  processTitle: string;
  jurisdiction: string;
  slots: DocSlot[];
  selectedId: string;
  onSelect: (id: string) => void;
  progressPct: number;
}) {
  return (
    <div className="h-full border-e border-line bg-surface flex flex-col">
      <div className="px-4 py-4 border-b border-line">
        <div className="sec-title">{t(locale, "matters.workspace.processHeader")}</div>
        <div className="text-h4 mt-1">{processTitle}</div>
        <div className="text-caption text-muted mt-0.5">{jurisdiction}</div>
        <div className="mt-3 h-1.5 bg-line rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-1 text-caption text-muted tabular-nums">
          {progressPct}% {t(locale, "matters.workspace.complete")}
        </div>
      </div>

      <ol className="flex-1 overflow-y-auto py-2" role="list">
        {slots.map((s, i) => {
          const done = ["signed", "filed", "approved"].includes(s.status);
          const active = ["drafting", "in_review", "out_for_signature"].includes(s.status);
          const isCurrent = selectedId === s.id;
          return (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "relative w-full text-start px-4 py-2.5 flex items-start gap-3 transition-colors",
                  isCurrent ? "bg-primary-50" : "hover:bg-neutral-50",
                )}
              >
                {/* Connector line between steps */}
                {i < slots.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute start-[1.65rem] top-9 bottom-0 w-px",
                      done ? "bg-success-300" : "bg-line",
                    )}
                  />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "relative z-10 h-5 w-5 rounded-full border flex items-center justify-center text-caption font-semibold shrink-0",
                    done    && "bg-success-600 text-white border-success-600",
                    active  && "bg-primary-600 text-white border-primary-600",
                    !done && !active && "bg-surface text-muted border-line",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={cn("block text-body-sm font-medium truncate", isCurrent && "text-primary-800")}>
                    {s.title}
                  </span>
                  <span className="block text-caption text-muted truncate">
                    {s.stage} · {t(locale, `matters.statusLabel.${s.status}`)}
                  </span>
                </span>
                {!s.required && (
                  <span className="text-caption text-muted ms-auto">
                    {t(locale, "matters.workspace.optional")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Reduce import surface
void Circle;
