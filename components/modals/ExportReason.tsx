"use client";
import { useState, useTransition } from "react";
import { FileOutput } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, Textarea } from "@/components/ui/Form";
import { t, type Locale } from "@/lib/i18n";

/**
 * Export-with-reason gate. Captures the lawyer's stated reason, POSTs to
 * /api/access/export (which writes to access_log), then invokes onConfirmed
 * with the reason text so the caller can stream the file.
 */
export function ExportReasonButton({
  locale,
  entityKind,
  entityId,
  caseId,
  requireReason = true,
  label,
  onConfirmed,
}: {
  locale: Locale;
  entityKind: string;
  entityId?: string;
  caseId?: string;
  requireReason?: boolean;
  label?: string;
  onConfirmed?: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (requireReason && !reason.trim()) {
      setError(t(locale, "conflicts.exportModal.missing"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/access/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityKind, entityId, caseId, reason: reason.trim() }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? "export_failed");
        return;
      }
      onConfirmed?.(reason.trim());
      setOpen(false);
      setReason("");
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary btn-sm">
        <FileOutput className="h-3.5 w-3.5" aria-hidden /> {label ?? t(locale, "common.export")}
      </button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={t(locale, "conflicts.exportModal.title")}
        description={t(locale, "conflicts.exportModal.body")}
        closeAriaLabel={t(locale, "common.cancel")}
        footer={
          <>
            <button onClick={() => setOpen(false)} disabled={pending} className="btn-secondary btn-sm">
              {t(locale, "conflicts.exportModal.cancel")}
            </button>
            <button onClick={submit} disabled={pending} className="btn-primary btn-sm">
              <FileOutput className="h-4 w-4" aria-hidden />
              {pending ? t(locale, "common.exporting") : t(locale, "conflicts.exportModal.submit")}
            </button>
          </>
        }
      >
        <Field error={error}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t(locale, "conflicts.exportModal.placeholder")}
            rows={4}
          />
        </Field>
      </Modal>
    </>
  );
}
