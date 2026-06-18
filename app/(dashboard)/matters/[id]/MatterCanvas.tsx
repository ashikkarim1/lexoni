"use client";
import { Sparkles, Mic, Wand2, FileSignature, Eye, Check, FileText, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { t, type Locale } from "@/lib/i18n";
import { SLOT_STATUS_TONE } from "@/lib/ui/statuses";
import { Term } from "@/components/coaching/Term";
import { StepHint } from "@/components/coaching/StepHint";
import { PreActionGuard } from "@/components/coaching/PreActionGuard";
import { useCoaching } from "@/lib/coaching/state";
import type { DocSlot } from "@/lib/types/matter";
import { DocumentPreview } from "@/components/documents/DocumentPreview";
import { SelectionActions } from "@/components/documents/SelectionActions";
import type { DocumentRow } from "@/lib/data/documents";

/**
 * Centre pane - focus on the currently selected slot. Contains the slot
 * actions row, a placeholder document canvas, and the AI smart-prompt at the
 * bottom (where action happens). Removes the cluttered right-rail repeat of
 * slot info.
 */
export function MatterCanvas({
  locale,
  sel,
  caseId,
  documents,
  matterId,
  matterLanguage,
  promptMode,
  setPromptMode,
  prompt,
  setPrompt,
  drafting,
  onAdvance,
  onAiDraft,
  onOpenWizard,
}: {
  locale: Locale;
  sel: DocSlot;
  caseId: string;
  documents: DocumentRow[];
  matterId: string;
  matterLanguage: "en" | "ar";
  promptMode: "text" | "voice";
  setPromptMode: (m: "text" | "voice") => void;
  prompt: string;
  setPrompt: (v: string) => void;
  drafting: boolean;
  onAdvance: (id: string, to: DocSlot["status"]) => void;
  onAiDraft: () => void;
  onOpenWizard: () => void;
}) {
  const currentDoc = documents.find((d) => d.isCurrent) ?? documents[0] ?? null;
  const coach = useCoaching();

  return (
    <div className="h-full flex flex-col">
      {/* Slot header */}
      <div className="px-6 py-4 border-b border-line bg-surface">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="sec-title mb-1.5 flex items-center gap-2">
              <span>{sel.stage}</span>
              {sel.autofilled && (
                <span className="chip-success">{t(locale, "matters.workspace.autofilled")}</span>
              )}
              <StepHint locale={locale} expectedKind={sel.expectedKind} />
            </div>
            <h2 className="text-h2 leading-tight">
              {(() => {
                const term = termHintFor(sel);
                return term
                  ? <Term locale={locale} term={term}>{sel.title}</Term>
                  : <>{sel.title}</>;
              })()}
            </h2>
            <div className="text-caption text-muted mt-1">
              {t(locale, "matters.workspace.assignee")}: {sel.assignee} · {t(locale, "common.due")} {sel.dueAt}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <Badge tone={SLOT_STATUS_TONE[sel.status] ?? "neutral"}>
              {t(locale, `matters.statusLabel.${sel.status}`)}
            </Badge>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onOpenWizard} className="btn-secondary btn-sm">
            <Wand2 className="h-3.5 w-3.5" aria-hidden /> {t(locale, "matters.workspace.wizard")}
          </button>
          {sel.status === "drafting" && (
            <button onClick={() => onAdvance(sel.id, "in_review")} className="btn-secondary btn-sm">
              <Eye className="h-3.5 w-3.5" aria-hidden /> {t(locale, "matters.workspace.sendToReview")}
            </button>
          )}
          {sel.status === "in_review" && (
            <PreActionGuard
              locale={locale}
              guardId="send_for_signature"
              onConfirm={() => onAdvance(sel.id, "out_for_signature")}
            >
              {(open) => (
                <button onClick={open} className="btn-primary btn-sm">
                  <FileSignature className="h-3.5 w-3.5" aria-hidden /> {t(locale, "matters.workspace.sendForSignature")}
                </button>
              )}
            </PreActionGuard>
          )}
          {sel.status === "out_for_signature" && (
            <PreActionGuard
              locale={locale}
              guardId="mark_signed"
              onConfirm={() => onAdvance(sel.id, "signed")}
            >
              {(open) => (
                <button onClick={open} className="btn-primary btn-sm">
                  <Check className="h-3.5 w-3.5" aria-hidden /> {t(locale, "matters.workspace.markSigned")}
                </button>
              )}
            </PreActionGuard>
          )}
        </div>
      </div>

      {/* Document area - uploaded files for this slot. Sprint #2 will swap
          DocumentPreview for an inline PDF/DOCX viewer; today it shows file
          metadata, extracted-text preview, and the dropzone for replacements. */}
      <div className="flex-1 overflow-y-auto p-6 bg-canvas">
        <div className="max-w-3xl mx-auto">
          <DocumentPreview
            locale={locale}
            caseId={caseId}
            matterSlotId={sel.id}
            documents={documents}
          />
        </div>
      </div>

      {/* AI smart-prompt - anchored at the bottom of the centre pane. */}
      <div className="border-t border-line bg-surface p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <SelectionActions
            locale={locale}
            matterId={matterId}
            slotId={sel.id}
            slotTitle={sel.title}
            language={matterLanguage}
            currentDocument={currentDoc}
          />
          <div className="flex items-center justify-between mb-2">
            <div className="text-body-sm font-medium inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary-600" aria-hidden />
              {t(locale, "matters.workspace.smartPrompt")}
            </div>
            <div className="flex rounded-lg border border-line overflow-hidden text-caption">
              <button onClick={() => setPromptMode("text")} className={`px-2 py-1 ${promptMode === "text" ? "bg-primary-600 text-white" : "text-muted"}`}>
                {t(locale, "matters.workspace.type")}
              </button>
              <button onClick={() => setPromptMode("voice")} className={`px-2 py-1 flex items-center gap-1 ${promptMode === "voice" ? "bg-primary-600 text-white" : "text-muted"}`}>
                <Mic className="h-3 w-3" aria-hidden /> {t(locale, "matters.workspace.voice")}
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={promptMode === "voice" ? t(locale, "matters.workspace.promptPlaceholderVoice") : t(locale, "matters.workspace.promptPlaceholderText")}
              className="textarea h-20 pr-32"
              aria-label={t(locale, "matters.workspace.smartPrompt")}
            />
            <button
              onClick={onAiDraft}
              disabled={!prompt.trim() || drafting}
              className="absolute end-2 bottom-2 btn-primary btn-sm"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {drafting
                ? t(locale, "matters.workspace.drafting")
                : t(locale, "matters.workspace.draftAction")}
            </button>
          </div>
          {coach.enabled && prompt.trim().length > 0 && prompt.trim().length < 25 && (
            <div className="mt-2 inline-flex items-start gap-1.5 text-caption text-warning-700">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5" aria-hidden />
              {t(locale, "coaching.promptCoachHint")}
            </div>
          )}
          <p className="text-caption text-muted mt-2 leading-snug">{t(locale, "matters.workspace.suggestionNote")}</p>
        </div>
      </div>
    </div>
  );
}

/** Map a slot title to the matching glossary term + step-hint key. Lightweight
 *  hard-coded mapping; coaching system supplies the actual copy. */
function termHintFor(s: DocSlot): string | undefined {
  const k = s.expectedKind.toLowerCase();
  if (k.includes("kyc")) return "ubo";
  if (k.includes("moa")) return "moa";
  if (k.includes("aoa")) return "aoa";
  return undefined;
}

// Suppress unused import - kept for future state-icon row.
void FileText;
