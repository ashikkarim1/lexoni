"use client";
import { useState } from "react";
import { Search, Loader2, FileText, BookOpen, Mail, Library, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

type Citation = {
  id: string;
  sourceKind: "matter_document" | "precedent" | "knowledge_item" | "matter_email";
  sourceId: string;
  sourceCaseId: string | null;
  sourceTitle: string;
  ordinal: number;
  snippet: string;
  score: number;
};

const KIND_ICON = {
  matter_document: FileText,
  precedent: BookOpen,
  knowledge_item: Library,
  matter_email: Mail,
} as const;

const KIND_LABEL: Record<Citation["sourceKind"], string> = {
  matter_document: "Document",
  precedent: "Precedent",
  knowledge_item: "Knowledge",
  matter_email: "Email",
};

export function MemoryConsole({ samples, totalChunks }: { samples: string[]; totalChunks: number }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [citations, setCitations] = useState<Citation[]>([]);

  async function ask(question: string) {
    setBusy(true);
    setAnswer("");
    setCitations([]);
    const res = await fetch("/api/memory/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Memory query failed.");
      return;
    }
    const json = await res.json();
    setAnswer(json.answer ?? "");
    setCitations(json.citations ?? []);
    setModel(json.modelLabel ?? "");
  }

  async function reindex() {
    setReindexing(true);
    const res = await fetch("/api/memory/reindex", { method: "POST" });
    setReindexing(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Re-index failed.");
      return;
    }
    const json = await res.json();
    toast.success(`Re-indexed ${json.indexed} sources · ${json.chunks} chunks.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            className="input ps-9 w-full"
            placeholder="Have we ever…?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && q.trim() && !busy) ask(q); }}
          />
        </div>
        <button className="btn-primary" disabled={!q.trim() || busy} onClick={() => ask(q)}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
        </button>
        <button className="btn-ghost border border-line" disabled={reindexing} onClick={reindex} title="Re-index the firm's sources">
          {reindexing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {!answer && (
        <div>
          <div className="text-caption text-muted mb-2">Try a sample question:</div>
          <div className="flex flex-wrap gap-2">
            {samples.map((s) => (
              <button key={s} className="btn-secondary btn-sm" onClick={() => { setQ(s); ask(s); }}>
                {s}
              </button>
            ))}
          </div>
          {totalChunks === 0 && (
            <div className="mt-4 text-caption text-warning-700 bg-warning-50 border border-warning-200 rounded-md px-3 py-2">
              The index is empty. Click the refresh button on the right to ingest the firm's documents + precedents.
            </div>
          )}
        </div>
      )}

      {(answer || citations.length > 0) && (
        <div className="rounded-lg border border-line bg-canvas/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-caption text-muted">Answer · {model}</div>
            {citations.length > 0 && <Badge tone="info">{citations.length} citations</Badge>}
          </div>
          <div className="prose-render whitespace-pre-wrap text-body">{answer}</div>
        </div>
      )}

      {citations.length > 0 && (
        <div>
          <div className="text-caption uppercase tracking-wider text-muted mb-2">Sources</div>
          <ul className="space-y-2">
            {citations.map((c, i) => {
              const Icon = KIND_ICON[c.sourceKind];
              return (
                <li key={c.id} className="rounded-lg border border-line p-3 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-caption text-muted shrink-0">[{i + 1}]</span>
                      <div className="h-6 w-6 rounded-md bg-canvas text-muted flex items-center justify-center shrink-0">
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-body-sm truncate">{c.sourceTitle}</div>
                        <div className="text-caption text-muted">{KIND_LABEL[c.sourceKind]} · chunk {c.ordinal} · relevance {c.score}</div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-caption text-ink line-clamp-3">{c.snippet}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
