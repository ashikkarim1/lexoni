"use client";
import { useState } from "react";
import { Info, Lightbulb, AlertTriangle, ArrowRight } from "lucide-react";
import { useCoaching } from "@/lib/coaching/state";
import { coachingForKind } from "@/lib/coaching/process-steps";
import { t, type Locale } from "@/lib/i18n";

/**
 * Discreet (i) icon shown next to a slot title. Click → popover with:
 *  - Why this step exists
 *  - Common mistakes
 *  - What to do next
 *
 * Renders nothing when coaching mode is off.
 */
export function StepHint({
  locale,
  expectedKind,
}: {
  locale: Locale;
  expectedKind: string;
}) {
  const coach = useCoaching();
  const [open, setOpen] = useState(false);
  if (!coach.enabled) return null;
  const c = coachingForKind(expectedKind);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
    >
      <button
        type="button"
        aria-label={t(locale, "coaching.stepHintAria")}
        className="text-royal-600 hover:text-royal inline-flex items-center"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-40 top-full mt-1 inset-inline-start-0 w-80 max-w-[calc(100vw-2rem)] card p-3.5 shadow-pop text-start space-y-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-royal-700 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> {t(locale, "coaching.why")}
            </span>
            <span className="block text-xs text-ink mt-0.5 leading-snug">{c.why[locale]}</span>
          </span>
          {c.mistakes.length > 0 && (
            <span className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-warning-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {t(locale, "coaching.watchOut")}
              </span>
              <ul className="mt-0.5 space-y-1">
                {c.mistakes.map((m, i) => (
                  <li key={i} className="text-xs text-ink leading-snug flex items-start gap-1.5">
                    <span className="text-warning">•</span>
                    <span>{m[locale]}</span>
                  </li>
                ))}
              </ul>
            </span>
          )}
          <span className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-success-700 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> {t(locale, "coaching.next")}
            </span>
            <span className="block text-xs text-ink mt-0.5 leading-snug">{c.next[locale]}</span>
          </span>
        </span>
      )}
    </span>
  );
}
