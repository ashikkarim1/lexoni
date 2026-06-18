"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Check, AlertTriangle, AlertCircle, Info as InfoIcon, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * App-wide toast system. Wrap the dashboard once at the root, then call
 * `useToast()` anywhere to push.
 *
 *   const toast = useToast();
 *   toast.success("Slot marked signed");
 *   toast.error("Couldn't save - retrying");
 */
type Tone = "success" | "error" | "warning" | "info";
type Toast = { id: string; tone: Tone; title: string; body?: string; ttlMs?: number };

type ToastApi = {
  push: (t: Omit<Toast, "id">) => void;
  success: (title: string, body?: string) => void;
  error:   (title: string, body?: string) => void;
  warning: (title: string, body?: string) => void;
  info:    (title: string, body?: string) => void;
};

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = `t_${Math.random().toString(36).slice(2, 9)}`;
    setItems((prev) => [...prev, { id, ...t }]);
  }, []);

  const api = useMemo<ToastApi>(() => ({
    push,
    success: (title, body) => push({ tone: "success", title, body }),
    error:   (title, body) => push({ tone: "error",   title, body, ttlMs: 6000 }),
    warning: (title, body) => push({ tone: "warning", title, body }),
    info:    (title, body) => push({ tone: "info",    title, body }),
  }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={(id) => setItems((p) => p.filter((x) => x.id !== id))} />
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) {
    // Fail-safe - fall back to console if used outside the provider.
    return {
      push: () => {},
      success: () => {}, error: (t) => console.warn(t), warning: () => {}, info: () => {},
    };
  }
  return v;
}

function ToastViewport({ items, onDismiss }: { items: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-4 inset-inline-end-4 z-[60] flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {items.map((t) => <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />)}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const ms = toast.ttlMs ?? 3800;
    const id = window.setTimeout(onDismiss, ms);
    return () => window.clearTimeout(id);
  }, [onDismiss, toast.ttlMs]);

  const Icon = toast.tone === "success" ? Check : toast.tone === "error" ? AlertCircle : toast.tone === "warning" ? AlertTriangle : InfoIcon;
  const tone = {
    success: "ring-success-200/80 text-success-700 bg-success-50",
    error:   "ring-danger-200/80  text-danger-700  bg-danger-50",
    warning: "ring-warning-200/80 text-warning-700 bg-warning-50",
    info:    "ring-info-200/80    text-info-700    bg-info-50",
  }[toast.tone];

  return (
    <div
      role="status"
      className={cn(
        "card-raised pointer-events-auto p-3 flex items-start gap-3 animate-slide-up ring-1 ring-inset",
        tone,
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-body-sm font-semibold text-ink leading-snug">{toast.title}</div>
        {toast.body && <div className="text-caption text-muted mt-0.5 leading-snug">{toast.body}</div>}
      </div>
      <button onClick={onDismiss} aria-label="Dismiss notification" className="text-muted hover:text-ink p-0.5 -me-1">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
