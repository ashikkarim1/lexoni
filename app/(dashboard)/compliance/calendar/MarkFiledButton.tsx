"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function MarkFiledButton({ locale, id }: { locale: Locale; id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => {
        const res = await fetch("/api/compliance/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) { toast.error(t(locale, "compliance.markFailed")); return; }
        toast.success(t(locale, "compliance.markFiled"));
        router.refresh();
      })}
      disabled={pending}
      className="btn-secondary btn-sm"
    >
      <Check className="h-3.5 w-3.5" /> {t(locale, "compliance.markBtn")}
    </button>
  );
}
