"use client";
import { useState } from "react";
import { CheckSquare, Square, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useCoaching } from "@/lib/coaching/state";
import { GUARDRAILS, type Guardrail } from "@/lib/coaching/guardrails";
import { t, type Locale } from "@/lib/i18n";

/**
 * Mistake-prevention modal. When coaching is OFF, calls onConfirm immediately
 * (transparent passthrough). When ON, the lawyer must walk through the
 * checklist before the action fires.
 */
export function PreActionGuard({
  locale,
  guardId,
  children,
  onConfirm,
}: {
  locale: Locale;
  guardId: keyof typeof GUARDRAILS;
  children: (open: () => void) => React.ReactNode;
  onConfirm: () => void;
}) {
  const coach = useCoaching();
  const [open, setOpen] = useState(false);
  const g: Guardrail = GUARDRAILS[guardId];
  const [checked, setChecked] = useState<boolean[]>(() => g.checklist.map(() => false));

  const trigger = () => {
    if (!coach.enabled) {
      onConfirm();
      return;
    }
    setChecked(g.checklist.map(() => false));
    setOpen(true);
  };

  const allTicked = checked.every(Boolean);

  return (
    <>
      {children(trigger)}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-600" aria-hidden /> {g.title[locale]}
          </span>
        }
        description={g.body[locale]}
        closeAriaLabel={t(locale, "common.cancel")}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary btn-sm">
              {t(locale, "common.cancel")}
            </button>
            <button
              onClick={() => { setOpen(false); onConfirm(); }}
              disabled={!allTicked}
              className="btn-primary btn-sm"
            >
              {t(locale, "coaching.confirmProceed")}
            </button>
          </>
        }
      >
        <ul className="space-y-2">
          {g.checklist.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setChecked((arr) => arr.map((v, j) => (i === j ? !v : v)))}
                aria-pressed={checked[i]}
                className="w-full flex items-start gap-2 text-start text-body-sm hover:text-ink rounded-md"
              >
                {checked[i] ? (
                  <CheckSquare className="h-4 w-4 text-success-700 mt-0.5 shrink-0" aria-hidden />
                ) : (
                  <Square className="h-4 w-4 text-muted mt-0.5 shrink-0" aria-hidden />
                )}
                <span>{c[locale]}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
