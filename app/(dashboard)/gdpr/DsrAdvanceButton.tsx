"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import type { DsrStatus } from "@/lib/data/gdpr";

const NEXT: Record<DsrStatus, DsrStatus | null> = {
  received: "verifying",
  verifying: "in_progress",
  in_progress: "completed",
  completed: null,
  rejected: null,
};

export function DsrAdvanceButton({ locale, id, status }: { locale: Locale; id: string; status: DsrStatus }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const next = NEXT[status];

  if (!next) return <span className="text-caption text-muted">-</span>;

  return (
    <button
      onClick={() => startTransition(async () => {
        const res = await fetch("/api/gdpr/dsr/advance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, to: next }),
        });
        if (!res.ok) { toast.error(t(locale, "common.loading")); return; }
        toast.success(t(locale, `gdpr.dsr.status.${next}`));
        router.refresh();
      })}
      disabled={pending}
      className="btn-secondary btn-sm"
    >
      → {t(locale, `gdpr.dsr.status.${next}`)}
    </button>
  );
}
