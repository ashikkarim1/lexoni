"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function CreateInvoiceButton({
  locale,
  caseId,
  matterTitle,
  amountUsd,
}: {
  locale: Locale;
  caseId: string;
  matterTitle: string;
  amountUsd: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => {
        const res = await fetch("/api/billing/invoices/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          toast.error(t(locale, j?.error === "no_unbilled_wip" ? "billing.wip.noneToInvoice" : "billing.wip.failed"));
          return;
        }
        const j = (await res.json()) as { number: string };
        toast.success(t(locale, "billing.wip.created", { number: j.number, matter: matterTitle, amount: `$${amountUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` }));
        router.refresh();
      })}
      disabled={pending}
      className="btn-primary btn-sm"
    >
      <Receipt className="h-3.5 w-3.5" aria-hidden /> {t(locale, "billing.wip.invoiceNow")}
    </button>
  );
}
