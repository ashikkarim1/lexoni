"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

/**
 * Drop a file → upload to /api/documents/upload → server parses, persists,
 * and we router.refresh() so the matter page re-renders with the new doc.
 *
 * Accepts PDF / DOCX / TXT / MD (the mime allowlist the server enforces).
 * Up to 25 MB. Wall-aware on the server side; non-members get a clear toast.
 */
export function UploadDropzone({
  locale,
  caseId,
  matterSlotId,
  compact = false,
}: {
  locale: Locale;
  caseId: string;
  matterSlotId?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<"idle" | "uploading" | "parsing">("idle");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ingest = useCallback(async (file: File) => {
    if (!file) return;
    setBusy(true);
    setProgress("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("caseId", caseId);
      if (matterSlotId) form.append("matterSlotId", matterSlotId);

      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      setProgress("parsing");
      const json = (await res.json().catch(() => null)) as { id?: string; status?: string; error?: string; detail?: string } | null;

      if (!res.ok) {
        if (json?.error === "wall_denied") toast.error(t(locale, "documents.upload.wallDenied"));
        else if (json?.error === "file_too_large") toast.error(t(locale, "documents.upload.tooLarge"));
        else if (json?.error === "unsupported_mime") toast.error(t(locale, "documents.upload.badType"));
        else toast.error(json?.detail ?? t(locale, "documents.upload.failed"));
        return;
      }

      if (json?.status === "duplicate") {
        toast.info(t(locale, "documents.upload.duplicate", { name: file.name }));
      } else {
        toast.success(t(locale, "documents.upload.ready", { name: file.name }));
      }
      router.refresh();
    } catch {
      toast.error(t(locale, "documents.upload.failed"));
    } finally {
      setBusy(false);
      setProgress("idle");
    }
  }, [caseId, matterSlotId, locale, router, toast]);

  const onChoose = () => inputRef.current?.click();
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) ingest(f);
    e.target.value = ""; // allow re-pick of the same file
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onChoose}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChoose(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) ingest(f);
      }}
      aria-label={t(locale, "documents.upload.button")}
      aria-busy={busy}
      className={cn(
        "card flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
        compact ? "p-5 min-h-[120px]" : "p-8 min-h-[200px]",
        over && "border-primary-500 bg-primary-50/40",
        busy && "opacity-70 cursor-progress",
      )}
    >
      <div className={cn(
        "rounded-xl flex items-center justify-center mb-3",
        compact ? "h-9 w-9 bg-primary-100 text-primary-700" : "h-12 w-12 bg-primary-100 text-primary-700",
      )}>
        {busy ? <FileText className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden /> : <Upload className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden />}
      </div>
      <div className={cn("font-semibold text-ink", compact ? "text-body-sm" : "text-h3")}>
        {busy
          ? progress === "uploading" ? t(locale, "documents.upload.uploading") : t(locale, "documents.upload.parsing")
          : t(locale, "documents.upload.title")}
      </div>
      {!busy && (
        <p className={cn("text-muted mt-1", compact ? "text-caption" : "text-body-sm")}>
          {t(locale, "documents.upload.body")}
        </p>
      )}
      {!busy && !compact && (
        <p className="text-caption text-muted mt-2 inline-flex items-center gap-1">
          <AlertCircle className="h-3 w-3" aria-hidden />
          {t(locale, "documents.upload.constraints")}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,text/markdown"
        onChange={onPick}
      />
    </div>
  );
}
