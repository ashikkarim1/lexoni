"use client";
import { useEffect, useState } from "react";
import { GitCompare, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Form";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { t, type Locale } from "@/lib/i18n";
import type { DocumentRow } from "@/lib/data/documents";

type CompareResponse = {
  a: { id: string; filename: string; version: string };
  b: { id: string; filename: string; version: string };
  diff: {
    segments: Array<{ kind: "added" | "removed" | "equal"; text: string }>;
    added: number; removed: number; unchanged: number;
  };
  summary: string;
  stub: boolean;
};

/**
 * Version compare modal. Picks two versions of a slot's documents, hits
 * /api/documents/compare, renders a unified word-level redline + AI summary.
 */
export function VersionCompare({
  locale,
  documents,
}: {
  locale: Locale;
  documents: DocumentRow[];
}) {
  const [open, setOpen] = useState(false);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompareResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    // Default: oldest vs newest.
    const sorted = [...documents].sort((x, y) =>
      new Date(x.uploadedAt as unknown as string).getTime() - new Date(y.uploadedAt as unknown as string).getTime(),
    );
    setAId((id) => id || (sorted[0]?.id ?? ""));
    setBId((id) => id || (sorted[sorted.length - 1]?.id ?? ""));
  }, [open, documents]);

  const run = async () => {
    if (!aId || !bId || aId === bId) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/documents/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aId, bId }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as CompareResponse;
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (documents.length < 2) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary btn-sm">
        <GitCompare className="h-3.5 w-3.5" aria-hidden /> {t(locale, "documents.compare.btn")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t(locale, "documents.compare.title")}
        description={t(locale, "documents.compare.body")}
        size="xl"
        closeAriaLabel={t(locale, "common.cancel")}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary btn-sm">
              {t(locale, "common.cancel")}
            </button>
            <button onClick={run} disabled={!aId || !bId || aId === bId || loading} className="btn-primary btn-sm">
              <GitCompare className="h-4 w-4" aria-hidden />
              {loading ? t(locale, "common.loading") : t(locale, "documents.compare.run")}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-caption text-muted mb-1">{t(locale, "documents.compare.versionA")}</div>
              <Select value={aId} onChange={(e) => setAId(e.target.value)}>
                <option value="" disabled>-</option>
                {documents.map((d) => <option key={d.id} value={d.id}>{d.version} · {d.filename}</option>)}
              </Select>
            </div>
            <div>
              <div className="text-caption text-muted mb-1">{t(locale, "documents.compare.versionB")}</div>
              <Select value={bId} onChange={(e) => setBId(e.target.value)}>
                <option value="" disabled>-</option>
                {documents.map((d) => <option key={d.id} value={d.id}>{d.version} · {d.filename}</option>)}
              </Select>
            </div>
          </div>

          {data && (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="sec-title mb-1.5 inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary-600" aria-hidden /> {t(locale, "documents.compare.aiSummary")}
                  {data.stub && <Badge tone="neutral">{t(locale, "documents.insights.stub")}</Badge>}
                </div>
                <p className="text-body-sm leading-relaxed whitespace-pre-wrap">{data.summary}</p>
              </div>

              <div className="flex items-center gap-3 text-caption">
                <Badge tone="success">+ {data.diff.added} {t(locale, "documents.compare.added")}</Badge>
                <Badge tone="danger">− {data.diff.removed} {t(locale, "documents.compare.removed")}</Badge>
                <span className="text-muted">{data.diff.unchanged} {t(locale, "documents.compare.unchanged")}</span>
              </div>

              <div className="card p-4 max-h-[55vh] overflow-y-auto bg-neutral-50">
                <div className="text-body-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {data.diff.segments.map((seg, i) => (
                    <span
                      key={i}
                      className={cn(
                        seg.kind === "added"   && "bg-success-100 text-success-800 rounded px-0.5",
                        seg.kind === "removed" && "bg-danger-100 text-danger-800 line-through rounded px-0.5",
                      )}
                    >
                      {seg.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
