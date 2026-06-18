"use client";
/**
 * Junior Coaching state.
 *
 * A discreet coaching layer: when ON, every GCC-specific term is hover-defined,
 * each process step gains a "why this exists" hint, and destructive actions
 * (send-for-signature, mark-signed) gain a pre-flight checklist. When OFF the
 * UI is unchanged. Junior staff get it ON by default; partners get it OFF.
 *
 * State persists in localStorage so the lawyer's choice survives reloads.
 * Tip dismissals are tracked so we never nag twice.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ENABLED_KEY = "lexoni.coaching.enabled";
const DISMISSED_KEY = "lexoni.coaching.dismissed";

type CoachingContextValue = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  /** Tip ids the user has dismissed — used to avoid re-showing one-shot hints. */
  isDismissed: (id: string) => boolean;
  dismiss: (id: string) => void;
};

const Ctx = createContext<CoachingContextValue | null>(null);

export function CoachingProvider({
  role,
  children,
}: {
  /** Default-on for helpers / juniors, off for everyone else. */
  role: "platform_admin" | "firm_admin" | "lawyer" | "lawyer_helper" | "client_admin" | "client_member" | "client_viewer";
  children: React.ReactNode;
}) {
  const defaultOn = role === "lawyer_helper";
  const [enabled, setEnabledState] = useState<boolean>(defaultOn);
  const [dismissed, setDismissed] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ENABLED_KEY);
      if (raw === "1" || raw === "0") setEnabledState(raw === "1");
      const d = localStorage.getItem(DISMISSED_KEY);
      if (d) setDismissed(JSON.parse(d) as Record<string, number>);
    } catch { /* ignore */ }
    // role-aware default only fires when storage is empty
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try { localStorage.setItem(ENABLED_KEY, v ? "1" : "0"); } catch { /* ignore */ }
  }, []);

  const isDismissed = useCallback((id: string) => Boolean(dismissed[id]), [dismissed]);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = { ...prev, [id]: Date.now() };
      try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const value = useMemo<CoachingContextValue>(() => ({ enabled, setEnabled, isDismissed, dismiss }), [enabled, setEnabled, isDismissed, dismiss]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCoaching(): CoachingContextValue {
  const v = useContext(Ctx);
  if (!v) {
    // Fail-safe — components can render outside the provider in story/preview contexts.
    return { enabled: false, setEnabled: () => {}, isDismissed: () => false, dismiss: () => {} };
  }
  return v;
}
