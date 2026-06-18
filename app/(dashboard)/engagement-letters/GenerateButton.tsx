"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function GenerateButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [legalFunction, setLegalFunction] = useState("fundraising");
  const [feeArrangement, setFeeArrangement] = useState<"fixed" | "hourly" | "retainer" | "hybrid" | "contingency">("hourly");
  const [feeQuote, setFeeQuote] = useState("30000");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (!clientName.trim() || !clientEmail.includes("@")) {
      setError(t(locale, "engagement.generate.errFields"));
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/engagement/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          legalFunction,
          feeArrangement,
          feeQuoteUsd: Number(feeQuote) || 0,
        }),
      });
      if (!res.ok) {
        toast.error(t(locale, "engagement.generate.failed"));
        return;
      }
      toast.success(t(locale, "engagement.generate.created"));
      setOpen(false);
      setClientName(""); setClientEmail(""); setFeeQuote("30000");
      router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary btn-sm">
        <Sparkles className="h-4 w-4" /> {t(locale, "engagement.generate.btn")}
      </button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={t(locale, "engagement.generate.title")}
        description={t(locale, "engagement.generate.body")}
        closeAriaLabel={t(locale, "common.cancel")}
        footer={
          <>
            <button onClick={() => setOpen(false)} disabled={pending} className="btn-secondary btn-sm">{t(locale, "common.cancel")}</button>
            <button onClick={submit} disabled={pending} className="btn-primary btn-sm">
              <Sparkles className="h-4 w-4" /> {pending ? t(locale, "common.loading") : t(locale, "engagement.generate.submit")}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t(locale, "engagement.generate.fClient")} required>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Robotics LLC" />
          </Field>
          <Field label={t(locale, "engagement.generate.fEmail")} required>
            <Input value={clientEmail} type="email" onChange={(e) => setClientEmail(e.target.value)} placeholder="cfo@acme.ae" />
          </Field>
          <Field label={t(locale, "engagement.generate.fFunction")} required>
            <Select value={legalFunction} onChange={(e) => setLegalFunction(e.target.value)}>
              {["fundraising","ma","corporate_governance","litigation","arbitration","regulatory","tax","ip_trademark","ip_patent","employment","other"].map((k) => (
                <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t(locale, "engagement.generate.fFee")} required>
              <Select value={feeArrangement} onChange={(e) => setFeeArrangement(e.target.value as typeof feeArrangement)}>
                {(["fixed","hourly","retainer","hybrid","contingency"] as const).map((k) => <option key={k} value={k}>{k}</option>)}
              </Select>
            </Field>
            <Field label={t(locale, "engagement.generate.fQuote")} required>
              <Input value={feeQuote} type="number" step="1000" min="0" onChange={(e) => setFeeQuote(e.target.value)} />
            </Field>
          </div>
          {error && <div className="text-caption text-danger-700">{error}</div>}
        </div>
      </Modal>
    </>
  );
}
