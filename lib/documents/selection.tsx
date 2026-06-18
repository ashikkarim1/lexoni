"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Document selection context. Sprint #2 (viewer) populates it from
 * window.getSelection() on the DOCX / TXT / MD viewer. Sprint #4 (selection-
 * aware AI actions) consumes it to fire Explain / Redline / Insert on the
 * highlighted span.
 *
 * For PDFs rendered in <embed>, the browser owns the selection; we expose a
 * manual `setQuotedText()` so the matter canvas can prompt the lawyer to
 * paste the quoted text when no native selection event is available.
 */
type SelectionCtx = {
  text: string;
  source: "viewer" | "manual" | null;
  documentId: string | null;
  setFromViewer: (text: string, documentId: string) => void;
  setQuotedText: (text: string, documentId: string) => void;
  clear: () => void;
};

const Ctx = createContext<SelectionCtx | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState<"viewer" | "manual" | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const setFromViewer = useCallback((t: string, id: string) => {
    setText(t); setSource("viewer"); setDocumentId(id);
  }, []);
  const setQuotedText = useCallback((t: string, id: string) => {
    setText(t); setSource("manual"); setDocumentId(id);
  }, []);
  const clear = useCallback(() => { setText(""); setSource(null); setDocumentId(null); }, []);

  const value = useMemo(() => ({ text, source, documentId, setFromViewer, setQuotedText, clear }), [text, source, documentId, setFromViewer, setQuotedText, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelectionContext(): SelectionCtx {
  return useContext(Ctx) ?? {
    text: "", source: null, documentId: null,
    setFromViewer: () => {}, setQuotedText: () => {}, clear: () => {},
  };
}

/** Hook a viewer container element: when text is selected inside it, push to
 *  the SelectionProvider. */
export function useViewerSelection(container: HTMLElement | null, documentId: string | null) {
  const ctx = useSelectionContext();
  useEffect(() => {
    if (!container || !documentId) return;
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;
      const txt = sel.toString().trim();
      if (txt.length === 0) return;
      ctx.setFromViewer(txt, documentId);
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [container, documentId, ctx]);
}
