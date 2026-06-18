"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pen, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

type Party = { name: string; email: string; role: string };

export function NewWorkflowButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [order, setOrder] = useState<"sequential" | "parallel">("sequential");
  const [parties, setParties] = useState<Party[]>([{ name: "", email: "", role: "signer" }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    const cleanedParties = parties.filter((p) => p.email.includes("@") && p.name.trim());
    if (!title.trim() || !bodyMd.trim() || cleanedParties.length === 0) {
      setError(t(locale, "signatures.create.errFields"));
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/signatures/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, bodyMd, order, parties: cleanedParties }),
      });
      if (!res.ok) { toast.error(t(locale, "signatures.create.failed")); return; }
      toast.success(t(locale, "signatures.create.ok"));
      setOpen(false);
      setTitle(""); setBodyMd(""); setOrder("sequential"); setParties([{ name: "", email: "", role: "signer" }]);
      router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary btn-sm">
        <Pen className="h-4 w-4" /> {t(locale, "signatures.create.btn")}
      </button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={t(locale, "signatures.create.title")}
        description={t(locale, "signatures.create.body")}
        size="xl"
        closeAriaLabel={t(locale, "common.cancel")}
        footer={
          <>
            <button onClick={() => setOpen(false)} disabled={pending} className="btn-secondary btn-sm">{t(locale, "common.cancel")}</button>
            <button onClick={submit} disabled={pending} className="btn-primary btn-sm"><Pen className="h-4 w-4" /> {pending ? t(locale, "common.loading") : t(locale, "signatures.create.submit")}</button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t(locale, "signatures.create.fTitle")} required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="NDA - Acme Robotics" />
          </Field>
          <Field label={t(locale, "signatures.create.fBody")} required hint={t(locale, "signatures.create.fBodyHint")}>
            <Textarea value={bodyMd} onChange={(e) => setBodyMd(e.target.value)} rows={8} placeholder={`# Mutual NDA\n\nBetween …`} />
          </Field>
          <Field label={t(locale, "signatures.create.fOrder")}>
            <Select value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
              <option value="sequential">{t(locale, "signatures.order.sequential")}</option>
              <option value="parallel">{t(locale, "signatures.order.parallel")}</option>
            </Select>
          </Field>
          <div>
            <div className="sec-title mb-2">{t(locale, "signatures.create.fParties")}</div>
            <div className="space-y-2">
              {parties.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Field label={i === 0 ? t(locale, "signatures.create.fName") : ""}>
                      <Input value={p.name} onChange={(e) => setParties((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Omar Haddad" />
                    </Field>
                  </div>
                  <div className="col-span-5">
                    <Field label={i === 0 ? t(locale, "signatures.create.fEmail") : ""}>
                      <Input value={p.email} type="email" onChange={(e) => setParties((arr) => arr.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} placeholder="omar@acme.ae" />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label={i === 0 ? t(locale, "signatures.create.fRole") : ""}>
                      <Select value={p.role} onChange={(e) => setParties((arr) => arr.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}>
                        <option value="signer">signer</option>
                        <option value="counter-signer">counter-signer</option>
                        <option value="witness">witness</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="col-span-1 flex justify-end pb-1">
                    {parties.length > 1 && (
                      <button onClick={() => setParties((arr) => arr.filter((_, j) => j !== i))} aria-label="Remove" className="btn-ghost btn-sm">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => setParties((arr) => [...arr, { name: "", email: "", role: "signer" }])} className="btn-secondary btn-sm">
                <Plus className="h-3.5 w-3.5" /> {t(locale, "signatures.create.addParty")}
              </button>
            </div>
          </div>
          {error && <div className="text-caption text-danger-700">{error}</div>}
        </div>
      </Modal>
    </>
  );
}
