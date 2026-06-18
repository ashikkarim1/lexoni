"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function FirmSignButton({ locale, id }: { locale: Locale; id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => {
        const res = await fetch("/api/engagement/firm-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) { toast.error(t(locale, "engagement.sign.failed")); return; }
        toast.success(t(locale, "engagement.sign.ok"));
        router.refresh();
      })}
      disabled={pending}
      className="btn-primary btn-sm"
    >
      <Check className="h-3.5 w-3.5" /> {pending ? t(locale, "common.loading") : t(locale, "engagement.sign.btn")}
    </button>
  );
}
