"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function InviteRowActions({ locale, id }: { locale: Locale; id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => {
        const res = await fetch("/api/members/invite/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) { toast.error(t(locale, "common.loading")); return; }
        toast.success(t(locale, "members.invites.cancelled"));
        router.refresh();
      })}
      disabled={pending}
      className="btn-secondary btn-sm"
    >
      <X className="h-3.5 w-3.5" /> {t(locale, "members.actions.cancel")}
    </button>
  );
}
