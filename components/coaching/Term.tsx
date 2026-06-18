"use client";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { useCoaching } from "@/lib/coaching/state";
import { findTerm, type GlossaryEntry } from "@/lib/coaching/glossary";
import type { Locale } from "@/lib/i18n";

/**
 * Wrap a GCC legal term to give it an underline + hover popover when coaching
 * mode is on. Renders as a plain inline span when coaching is off.
 *
 *   <Term locale={locale} term="ADGM" />
 *   <Term locale={locale} term="UBO">beneficial owners</Term>
 */
export function Term({
  locale,
  term,
  children,
}: {
  locale: Locale;
  term: string;
  children?: React.ReactNode;
}) {
  const coach = useCoaching();
  const [open, setOpen] = useState(false);
  const entry: GlossaryEntry | undefined = findTerm(term);

  if (!coach.enabled || !entry) return <>{children ?? term}</>;

  const label = children ?? entry.label[locale];

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        className="inline-flex items-center gap-0.5 underline decoration-dotted decoration-royal/60 underline-offset-2 cursor-help"
      >
        {label}
        <GraduationCap className="h-3 w-3 text-royal/70" aria-hidden />
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute z-40 top-full mt-1 inset-inline-start-0 w-72 max-w-[calc(100vw-2rem)] card p-3 shadow-pop text-start"
        >
          <span className="block text-xs font-semibold text-royal mb-1">{entry.label[locale]}</span>
          <span className="block text-xs leading-snug text-ink">{entry.definition[locale]}</span>
          {entry.pitfall && (
            <span className="block text-[11px] leading-snug text-warning-700 mt-2">
              <span className="font-semibold">⚠ </span>
              {entry.pitfall[locale]}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
