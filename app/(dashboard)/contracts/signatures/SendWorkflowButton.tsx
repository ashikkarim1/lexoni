"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function SendWorkflowButton({ locale, id }: { locale: Locale; id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => {
        const res = await fetch("/api/signatures/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) { toast.error(t(locale, "signatures.send.failed")); return; }
        toast.success(t(locale, "signatures.send.ok"));
        router.refresh();
      })}
      disabled={pending}
      className="btn-primary btn-sm"
    >
      <Send className="h-3.5 w-3.5" /> {pending ? t(locale, "common.loading") : t(locale, "signatures.send.btn")}
    </button>
  );
}
