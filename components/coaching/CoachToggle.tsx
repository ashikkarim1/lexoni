"use client";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useCoaching } from "@/lib/coaching/state";
import { t, type Locale } from "@/lib/i18n";

/**
 * Topbar toggle for Junior Coaching. Discreet - a graduation-cap icon that
 * gets a subtle ring when on. Persists via the CoachingProvider's storage.
 *
 * A one-time tip is shown the first time the user has it on so they know
 * what the underline and (i) icons mean.
 */
export function CoachToggle({ locale }: { locale: Locale }) {
  const coach = useCoaching();
  const [showFirstHint, setShowFirstHint] = useState(false);

  useEffect(() => {
    if (!coach.enabled) return;
    if (coach.isDismissed("first_hint")) return;
    const t = window.setTimeout(() => setShowFirstHint(true), 700);
    return () => window.clearTimeout(t);
  }, [coach]);

  const dismissFirstHint = () => {
    coach.dismiss("first_hint");
    setShowFirstHint(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-pressed={coach.enabled}
        aria-label={t(locale, coach.enabled ? "coaching.toggleOff" : "coaching.toggleOn")}
        onClick={() => {
          coach.setEnabled(!coach.enabled);
          if (coach.enabled) setShowFirstHint(false);
        }}
        title={t(locale, coach.enabled ? "coaching.tipOn" : "coaching.tipOff")}
        className={
          "btn-ghost text-xs p-2 transition " +
          (coach.enabled
            ? "text-royal-700 bg-royal-100/60 ring-1 ring-royal/30 rounded-lg"
            : "text-muted hover:text-ink")
        }
      >
        <GraduationCap className="h-4 w-4" />
      </button>
      {showFirstHint && (
        <div className="absolute end-0 top-full mt-2 z-50 w-72 card p-3 shadow-pop text-xs">
          <div className="font-semibold mb-1 flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 text-royal" /> {t(locale, "coaching.firstHintTitle")}
          </div>
          <p className="text-muted leading-snug">{t(locale, "coaching.firstHintBody")}</p>
          <button onClick={dismissFirstHint} className="text-royal text-[11px] mt-2 hover:underline">
            {t(locale, "coaching.firstHintDismiss")}
          </button>
        </div>
      )}
    </div>
  );
}
