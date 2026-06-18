"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, GripVertical, AlertTriangle, Lock, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { t, type Locale } from "@/lib/i18n";
import { SEVERITY_TONE } from "@/lib/ui/statuses";
import type { SlotTemplate, Blocker } from "@/lib/types/matter";
import type { WallDescription } from "@/lib/data/walls";

/**
 * Right pane - assistive context. Wall info → blockers → templates palette.
 * Does NOT repeat the slot list (that's in the left pane). Does NOT repeat
 * the slot actions (those are on the centre canvas).
 */
export function ContextRail({
  locale,
  region,
  language,
  processTitle,
  templates,
  blockers,
  wall,
  selectedSlotId,
  onAttachTemplate,
}: {
  locale: Locale;
  region: "UAE" | "KSA";
  language: "en" | "ar";
  processTitle: string;
  templates: SlotTemplate[];
  blockers: Blocker[];
  wall: WallDescription | null;
  selectedSlotId: string;
  onAttachTemplate: (templateTitle: string) => void;
}) {
  const [query, setQuery] = useState("");

  const narrowed = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates
      .filter((tpl) => tpl.region === region || tpl.region === "GLOBAL")
      .filter((tpl) => tpl.language === language)
      .filter((tpl) => !q || tpl.title.toLowerCase().includes(q) || tpl.kind.toLowerCase().includes(q));
  }, [templates, query, region, language]);

  return (
    <div className="h-full border-s border-line bg-surface flex flex-col">
      <div className="px-4 py-3 border-b border-line">
        <div className="sec-title">{t(locale, "matters.workspace.contextRail")}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Wall panel - only when caller is inside a wall around this matter */}
        {wall && (
          <section className="card p-4 border-warning-200 bg-warning-50/40">
            <div className="sec-title mb-2 flex items-center gap-1.5 text-warning-700">
              <Lock className="h-3.5 w-3.5" aria-hidden /> {t(locale, "matters.workspace.wallTitle")}
            </div>
            <div className="text-body-sm font-medium">{wall.name}</div>
            {wall.reason && <div className="text-caption text-muted mt-1 leading-snug">{wall.reason}</div>}
            <div className="mt-3 border-t border-line/60 pt-3">
              <div className="text-caption uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1.5">
                <Users className="h-3 w-3" aria-hidden /> {t(locale, "matters.workspace.wallTeam")}
              </div>
              <ul className="space-y-1">
                {wall.members.map((m) => (
                  <li key={m.userId} className="text-caption flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden />
                    <span className="font-medium">{m.fullName}</span>
                  </li>
                ))}
              </ul>
              {wall.pendingRequests > 0 && (
                <Link href="/conflicts/walls" className="text-caption text-primary-700 hover:underline mt-2 inline-block">
                  {t(
                    locale,
                    wall.pendingRequests === 1 ? "matters.workspace.wallPending" : "matters.workspace.wallPendingPlural",
                    { n: wall.pendingRequests },
                  )}
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Blockers - top of attention */}
        {blockers.length > 0 && (
          <section className="card p-4">
            <div className="sec-title mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-warning-600" aria-hidden />
              {t(locale, "matters.workspace.blockersTitle")}
            </div>
            <ul className="space-y-2.5">
              {blockers.map((b) => (
                <li key={b.id} className="flex items-start gap-2">
                  <Badge tone={SEVERITY_TONE[b.severity] ?? "neutral"}>{b.severity}</Badge>
                  <div className="text-caption leading-snug">
                    {b.title}
                    <span className="text-muted"> · {b.kind.replace(/_/g, " ")}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Templates - drag/drop or click-to-attach */}
        <section className="card p-4">
          <div className="sec-title mb-2">{t(locale, "matters.workspace.templatesTitle", { process: processTitle })}</div>
          <div className="flex items-center gap-2 border border-line rounded-lg px-2.5 py-1.5 mb-3 bg-canvas">
            <Search className="h-3.5 w-3.5 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(locale, "matters.workspace.templatesSearchPlaceholder")}
              aria-label={t(locale, "matters.workspace.templatesSearchPlaceholder")}
              className="text-body-sm bg-transparent focus-visible:outline-none w-full"
            />
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {narrowed.map((tpl) => (
              <div
                key={tpl.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", tpl.title)}
                onClick={() => onAttachTemplate(tpl.title)}
                role="button"
                tabIndex={0}
                aria-label={`Attach ${tpl.title}`}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAttachTemplate(tpl.title); } }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-line hover:border-primary-400 hover:bg-canvas cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-3.5 w-3.5 text-muted shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm font-medium truncate">{tpl.title}</div>
                  <div className="text-caption text-muted">{tpl.kind} · {tpl.scope}</div>
                </div>
              </div>
            ))}
            {narrowed.length === 0 && (
              <div className="text-caption text-muted text-center py-4">
                {t(locale, "matters.workspace.templatesEmpty")}
              </div>
            )}
          </div>
        </section>
      </div>
      {/* Selected ID is kept for future scroll-into-view affordances */}
      <span hidden data-selected-slot={selectedSlotId} />
    </div>
  );
}
