"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Pencil, Plus, Sparkles, X, ClipboardPaste } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { useSelectionContext } from "@/lib/documents/selection";
import { useToast } from "@/components/ui/Toast";
import type { DocumentRow } from "@/lib/data/documents";

/**
 * Sprint #4 - selection-aware AI actions. Lives in the centre canvas above
 * the smart-prompt textarea.
 *
 *   No selection → renders the freeform-prompt button (children).
 *   Selection present → three buttons: Explain · Redline · Insert.
 *
 * For PDFs (no native selection events) a "Paste quoted text" affordance lets
 * the lawyer paste highlighted text manually.
 */
export function SelectionActions({
  locale,
  matterId,
  slotId,
  slotTitle,
  language,
  currentDocument,
}: {
  locale: Locale;
  matterId: string;
  slotId: string;
  slotTitle: string;
  language: "en" | "ar";
  currentDocument: DocumentRow | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const sel = useSelectionContext();
  const [busy, setBusy] = useState<null | "explain" | "redline" | "insert">(null);
  const [result, setResult] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const docId = currentDocument?.id;
  const isPdf = currentDocument?.mime === "application/pdf";

  const run = async (mode: "explain" | "redline" | "insert", selection: string, brief?: string) => {
    if (!selection.trim()) return;
    setBusy(mode); setResult(null);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matterId,
          slotId,
          slotTitle,
          language,
          mode,
          selection,
          documentId: docId,
          prompt: brief ?? "",
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(j?.error === "wall_denied"
          ? t(locale, "workspace.toast.wallDenied")
          : t(locale, "workspace.toast.draftFailed"));
        return;
      }
      const j = (await res.json()) as { draftMd?: string };
      setResult(j.draftMd ?? "");
      router.refresh();
    } catch {
      toast.error(t(locale, "workspace.toast.draftFailed"));
    } finally {
      setBusy(null);
    }
  };

  const selectionText = sel.text.trim();
  const hasSelection = selectionText.length > 0;

  return (
    <div className="space-y-2">
      {hasSelection && (
        <div className="card p-3 border-primary-200 bg-primary-50/40 animate-fade-in">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-caption text-primary-800 font-medium inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> {t(locale, "documents.selection.title", { n: selectionText.length })}
            </div>
            <button onClick={sel.clear} aria-label={t(locale, "common.cancel")} className="text-muted hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-caption text-muted line-clamp-2 italic mb-3 ps-2 border-s-2 border-primary-300">
            "{selectionText.slice(0, 280)}{selectionText.length > 280 ? "…" : ""}"
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => run("explain", selectionText)} disabled={!!busy} className="btn-secondary btn-sm">
              <BookOpen className="h-3.5 w-3.5" aria-hidden /> {busy === "explain" ? t(locale, "matters.workspace.drafting") : t(locale, "documents.selection.explain")}
            </button>
            <button onClick={() => run("redline", selectionText)} disabled={!!busy} className="btn-secondary btn-sm">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> {busy === "redline" ? t(locale, "matters.workspace.drafting") : t(locale, "documents.selection.redline")}
            </button>
            <button onClick={() => run("insert", selectionText)} disabled={!!busy} className="btn-secondary btn-sm">
              <Plus className="h-3.5 w-3.5" aria-hidden /> {busy === "insert" ? t(locale, "matters.workspace.drafting") : t(locale, "documents.selection.insert")}
            </button>
          </div>
        </div>
      )}

      {!hasSelection && isPdf && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-muted">{t(locale, "documents.selection.pdfHint")}</span>
          <button onClick={() => setPasteOpen((o) => !o)} className="btn-ghost btn-sm">
            <ClipboardPaste className="h-3.5 w-3.5" aria-hidden /> {t(locale, "documents.selection.pasteQuoted")}
          </button>
        </div>
      )}
      {pasteOpen && (
        <div className="card p-3 space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={t(locale, "documents.selection.pastePlaceholder")}
            className="textarea h-24 text-body-sm"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setPasteText(""); setPasteOpen(false); }} className="btn-secondary btn-sm">
              {t(locale, "common.cancel")}
            </button>
            <button
              onClick={() => {
                if (!pasteText.trim() || !docId) return;
                sel.setQuotedText(pasteText.trim(), docId);
                setPasteText("");
                setPasteOpen(false);
              }}
              disabled={!pasteText.trim()}
              className="btn-primary btn-sm"
            >
              {t(locale, "documents.selection.useSelection")}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="card p-4 space-y-2 animate-slide-up">
          <div className="sec-title">{t(locale, "documents.selection.aiOutput")}</div>
          <div className="whitespace-pre-wrap text-body-sm leading-relaxed">{result}</div>
          <div className="flex justify-end">
            <button onClick={() => setResult(null)} className="btn-ghost btn-sm">{t(locale, "common.cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
