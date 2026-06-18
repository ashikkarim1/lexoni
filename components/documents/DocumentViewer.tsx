"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ExternalLink } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { useViewerSelection } from "@/lib/documents/selection";

/**
 * Inline document viewer.
 *   • PDF       → native browser viewer via <embed> (selection lives in the
 *                 embed; Sprint #4 exposes a "Quote text" textbox alongside).
 *   • DOCX      → mammoth-rendered HTML inside a styled article element;
 *                 selection events bubble to the parent via useViewerSelection.
 *   • TXT / MD  → <pre> with selectable text.
 *
 * Bilingual labels for loading + error states. The "Open in new tab" link is
 * always available as an escape hatch.
 */
export function DocumentViewer({
  locale,
  documentId,
  mime,
  filename,
}: {
  locale: Locale;
  documentId: string;
  mime: string;
  filename: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useViewerSelection(containerRef.current, documentId);

  useEffect(() => {
    const isDocx = mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mime === "application/msword";
    const isText = mime === "text/plain" || mime === "text/markdown";
    if (mime === "application/pdf") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}?meta=1`);
        if (!res.ok) throw new Error(String(res.status));
        const j = (await res.json()) as { extractedHtml?: string | null; extractedText?: string | null };
        if (cancelled) return;
        if (isDocx) setHtml(j.extractedHtml ?? "");
        else if (isText) setText(j.extractedText ?? "");
      } catch {
        if (!cancelled) setError("load_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [documentId, mime]);

  if (mime === "application/pdf") {
    return (
      <div className="card overflow-hidden h-[680px] flex flex-col" ref={containerRef}>
        <div className="flex items-center justify-between px-4 h-10 border-b border-line bg-neutral-50/60">
          <div className="text-caption text-muted truncate">{filename}</div>
          <a
            href={`/api/documents/${documentId}`}
            target="_blank"
            rel="noreferrer"
            className="text-caption text-primary-700 hover:underline inline-flex items-center gap-1"
          >
            {t(locale, "documents.viewer.openInTab")} <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
        <embed
          src={`/api/documents/${documentId}#view=FitH`}
          type="application/pdf"
          className="flex-1 w-full"
          aria-label={filename}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-6 text-body-sm text-muted">{t(locale, "common.loading")}</div>
    );
  }
  if (error) {
    return (
      <div className="card p-6 text-body-sm text-danger-700 inline-flex items-center gap-2">
        <AlertCircle className="h-4 w-4" aria-hidden /> {t(locale, "documents.viewer.loadFailed")}
      </div>
    );
  }

  if (html != null) {
    return (
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 h-10 border-b border-line bg-neutral-50/60">
          <div className="text-caption text-muted truncate">{filename}</div>
          <a
            href={`/api/documents/${documentId}`}
            target="_blank"
            rel="noreferrer"
            className="text-caption text-primary-700 hover:underline inline-flex items-center gap-1"
          >
            {t(locale, "documents.viewer.openInTab")} <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
        <article
          ref={containerRef}
          className="docx-render p-6 max-h-[680px] overflow-y-auto bg-surface text-ink"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  // TXT / MD
  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 h-10 border-b border-line bg-neutral-50/60">
        <div className="text-caption text-muted truncate">{filename}</div>
        <a
          href={`/api/documents/${documentId}`}
          target="_blank"
          rel="noreferrer"
          className="text-caption text-primary-700 hover:underline inline-flex items-center gap-1"
        >
          {t(locale, "documents.viewer.openInTab")} <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
      <pre
        ref={containerRef as React.RefObject<HTMLPreElement>}
        className="p-6 max-h-[680px] overflow-y-auto text-body-sm text-ink whitespace-pre-wrap font-mono leading-relaxed bg-surface"
      >
        {text ?? ""}
      </pre>
    </div>
  );
}
