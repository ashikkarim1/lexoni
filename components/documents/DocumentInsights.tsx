"use client";
import { useEffect, useState } from "react";
import { Users, Calendar, AlertTriangle, FileBadge, Scale, Globe, ListChecks, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { t, type Locale } from "@/lib/i18n";
import type { DocumentInsights as Insights } from "@/lib/ai/extract";

const SEVERITY_TONE: Record<string, "danger" | "warning" | "neutral"> = {
  high: "danger", medium: "warning", low: "neutral",
};

/**
 * "Document insights" panel - what the AI thinks is in the document.
 * Rendered above the document viewer in the matter canvas. Lazy-loads from
 * /api/documents/:id?meta=1 to keep the initial render fast.
 */
export function DocumentInsights({
  locale,
  documentId,
}: {
  locale: Locale;
  documentId: string;
}) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}?meta=1`);
        if (!res.ok) throw new Error(String(res.status));
        const j = (await res.json()) as { extractedMetaJson?: Insights | null };
        if (cancelled) return;
        setInsights(j.extractedMetaJson ?? null);
      } catch {
        // No insights yet - show empty card.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [documentId]);

  if (loading) {
    return <div className="card p-5 text-body-sm text-muted">{t(locale, "common.loading")}</div>;
  }
  if (!insights) {
    return (
      <div className="card p-5">
        <div className="sec-title mb-1 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary-600" aria-hidden /> {t(locale, "documents.insights.title")}
        </div>
        <p className="text-body-sm text-muted">{t(locale, "documents.insights.notReady")}</p>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="sec-title mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-600" aria-hidden /> {t(locale, "documents.insights.title")}
          </div>
          <p className="text-body-sm leading-relaxed">{insights.summary}</p>
        </div>
        {insights.generatedBy === "stub" && (
          <Badge tone="neutral">{t(locale, "documents.insights.stub")}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Pill icon={FileBadge} label={t(locale, "documents.insights.type")}        value={insights.documentType} />
        <Pill icon={Globe}     label={t(locale, "documents.insights.jurisdiction")} value={insights.jurisdiction ?? "-"} />
        <Pill icon={Scale}     label={t(locale, "documents.insights.governingLaw")} value={insights.governingLaw ?? "-"} />
        <Pill icon={Globe}     label={t(locale, "documents.insights.language")}     value={insights.language.toUpperCase()} />
      </div>

      <Section icon={Users} title={t(locale, "documents.insights.parties")}>
        {insights.parties.length === 0
          ? <Empty locale={locale} />
          : (
            <ul className="space-y-1.5">
              {insights.parties.map((p, i) => (
                <li key={i} className="flex items-baseline gap-2 text-body-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-caption text-muted">{p.role}</span>
                </li>
              ))}
            </ul>
          )}
      </Section>

      <Section icon={Calendar} title={t(locale, "documents.insights.keyDates")}>
        {insights.keyDates.length === 0
          ? <Empty locale={locale} />
          : (
            <ul className="space-y-1.5">
              {insights.keyDates.map((d, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-body-sm">
                  <span className="font-medium">{d.label}</span>
                  <span className="text-caption text-muted tabular-nums whitespace-nowrap">{d.iso ?? d.raw}</span>
                </li>
              ))}
            </ul>
          )}
      </Section>

      <Section icon={ListChecks} title={t(locale, "documents.insights.obligations")}>
        {insights.obligations.length === 0
          ? <Empty locale={locale} />
          : (
            <ul className="space-y-1.5">
              {insights.obligations.map((o, i) => (
                <li key={i} className="text-body-sm leading-snug">
                  <span className="font-medium">{o.party}</span>: <span>{o.obligation}</span>
                </li>
              ))}
            </ul>
          )}
      </Section>

      <Section icon={AlertTriangle} title={t(locale, "documents.insights.risks")}>
        {insights.risks.length === 0
          ? <Empty locale={locale} />
          : (
            <ul className="space-y-2">
              {insights.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Badge tone={SEVERITY_TONE[r.severity] ?? "neutral"}>{r.severity}</Badge>
                  <div className="text-body-sm">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-caption text-muted leading-snug">{r.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </Section>

      {insights.novelClauses.length > 0 && (
        <Section icon={Sparkles} title={t(locale, "documents.insights.novelClauses")}>
          <ul className="space-y-2">
            {insights.novelClauses.map((c, i) => (
              <li key={i} className="text-body-sm leading-snug">
                <div className="font-medium">{c.title}</div>
                <div className="text-caption text-muted">{c.summary}</div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Pill({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="h-7 w-7 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        <div className="text-caption text-muted">{label}</div>
        <div className="text-body-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Users; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="sec-title mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted" aria-hidden /> {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ locale }: { locale: Locale }) {
  return <span className="text-caption text-muted italic">{t(locale, "documents.insights.empty")}</span>;
}
