"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

export function DecideButtons({ locale, requestId }: { locale: Locale; requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const decide = (decision: "approved" | "denied") => {
    startTransition(async () => {
      await fetch("/api/walls/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision }),
      });
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => decide("denied")}
        disabled={pending}
        className="btn-ghost border border-line text-xs disabled:opacity-60"
      >
        <X className="h-3.5 w-3.5" /> {t(locale, "conflicts.walls.deny")}
      </button>
      <button
        onClick={() => decide("approved")}
        disabled={pending}
        className="btn-primary text-xs disabled:opacity-60"
      >
        <Check className="h-3.5 w-3.5" /> {t(locale, "conflicts.walls.approve")}
      </button>
    </div>
  );
}
