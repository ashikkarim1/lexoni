"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check, Sparkles, Phone, FileSearch, Pencil, Mail, Users, BookOpen } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import type { DraftRow } from "@/lib/data/time";
import { useToast } from "@/components/ui/Toast";

const SRC_ICON: Record<string, typeof Clock> = {
  editor: Pencil,
  ai_draft: Sparkles,
  call: Phone,
  research: FileSearch,
  email: Mail,
  meeting: Users,
  review: BookOpen,
  document_open: BookOpen,
  manual: Clock,
};

/**
 * Passive time → one-tap confirm. Reads its rows from the server (live drafts
 * or mock fallback) and POSTs the user's confirmations to /api/time/confirm,
 * which inserts time_entries and writes audit_log. After a successful POST
 * we call `router.refresh()` so Desk + Firm Pulse pick up the new WIP.
 */
export function ConfirmTime({ locale, initialDrafts }: { locale: Locale; initialDrafts: DraftRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<DraftRow[]>(initialDrafts);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [pending, startTransition] = useTransition();

  const totalMinutes = useMemo(() => rows.reduce((s, r) => s + r.minutes, 0), [rows]);
  const recoverableUsd = useMemo(
    () => rows.reduce((s, r) => s + (r.minutes / 60) * r.rateUsd, 0),
    [rows],
  );

  const post = async (draftIds: string[]) => {
    const res = await fetch("/api/time/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftIds }),
    });
    if (!res.ok) throw new Error(`confirm ${res.status}`);
    return (await res.json()) as { confirmed: number; minutes: number; cents: number };
  };

  const confirm = (id: string) => {
    const draft = rows.find((r) => r.id === id);
    if (!draft) return;
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    startTransition(async () => {
      try {
        await post([id]);
        setConfirmedCount((c) => c + 1);
        router.refresh();
      } catch {
        setRows((curr) => [draft, ...curr]);
        toast.error(t(locale, "time.confirmFailed"));
      }
    });
  };

  const confirmAll = () => {
    if (rows.length === 0) return;
    const ids = rows.map((r) => r.id);
    const snapshot = rows;
    setRows([]);
    startTransition(async () => {
      try {
        await post(ids);
        setConfirmedCount((c) => c + ids.length);
        router.refresh();
      } catch {
        setRows(snapshot);
        toast.error(t(locale, "time.confirmFailed"));
      }
    });
  };

  const fmtUsd = recoverableUsd.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="card">
      <div className="flex items-start justify-between px-5 py-4 border-b border-line">
        <div>
          <div className="h2">{t(locale, "time.toConfirmTitle")}</div>
          <div className="text-sm text-muted mt-0.5">
            {rows.length > 0 ? (
              <>
                {t(locale, "time.capturedToday")} ·{" "}
                <span className="font-medium text-ink">{(totalMinutes / 60).toFixed(1)}h</span> ·{" "}
                {t(locale, "time.recoverable", { amount: `$${fmtUsd}` })}
              </>
            ) : (
              t(locale, "time.allCaughtUp", { count: confirmedCount })
            )}
          </div>
        </div>
        {rows.length > 0 && (
          <button onClick={confirmAll} disabled={pending} className="btn-primary text-xs disabled:opacity-60">
            <Check className="h-4 w-4" /> {t(locale, "time.confirmAll")}
          </button>
        )}
      </div>
      <div className="p-2">
        {rows.length === 0 ? (
          <div className="text-center text-muted text-sm py-8">{t(locale, "time.empty")}</div>
        ) : (
          rows.map((r) => {
            const Icon = SRC_ICON[r.source] ?? Clock;
            return (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-canvas">
                <div className="h-8 w-8 rounded-lg bg-royal-100 text-royal-600 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.activity}</div>
                  <div className="text-xs text-muted truncate">#{r.matterNumber} · {r.matter}</div>
                </div>
                <div className="text-sm tabular-nums text-muted shrink-0">
                  {t(locale, "time.minutes", { n: r.minutes })}
                </div>
                <button
                  onClick={() => confirm(r.id)}
                  disabled={pending}
                  className="btn-ghost text-xs shrink-0 border border-line disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" /> {t(locale, "time.confirm")}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
