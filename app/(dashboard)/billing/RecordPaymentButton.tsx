"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function RecordPaymentButton({
  locale,
  invoiceId,
  outstandingCents,
  currency,
}: {
  locale: Locale;
  invoiceId: string;
  outstandingCents: number;
  currency: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String((outstandingCents / 100).toFixed(2)));
  const [method, setMethod] = useState("bank");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) { setError(t(locale, "billing.pay.errAmount")); return; }
    if (cents > outstandingCents) { setError(t(locale, "billing.pay.errOver")); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/billing/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, amountCents: cents, method, reference: reference || undefined }),
      });
      if (!res.ok) { toast.error(t(locale, "billing.pay.failed")); return; }
      toast.success(t(locale, "billing.pay.recorded"));
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary btn-sm">
        <CreditCard className="h-3.5 w-3.5" /> {t(locale, "billing.pay.btn")}
      </button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={t(locale, "billing.pay.title")}
        description={t(locale, "billing.pay.body")}
        closeAriaLabel={t(locale, "common.cancel")}
        footer={
          <>
            <button onClick={() => setOpen(false)} disabled={pending} className="btn-secondary btn-sm">{t(locale, "common.cancel")}</button>
            <button onClick={submit} disabled={pending} className="btn-primary btn-sm">
              <CreditCard className="h-4 w-4" /> {pending ? t(locale, "common.loading") : t(locale, "billing.pay.record")}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t(locale, "billing.pay.amount", { currency })} required error={error}>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0" />
          </Field>
          <Field label={t(locale, "billing.pay.method")} required>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="bank">{t(locale, "billing.pay.methodBank")}</option>
              <option value="card">{t(locale, "billing.pay.methodCard")}</option>
              <option value="escrow">{t(locale, "billing.pay.methodEscrow")}</option>
              <option value="crypto">{t(locale, "billing.pay.methodCrypto")}</option>
            </Select>
          </Field>
          <Field label={t(locale, "billing.pay.reference")} hint={t(locale, "billing.pay.referenceHint")}>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t(locale, "billing.pay.referencePlaceholder")} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
