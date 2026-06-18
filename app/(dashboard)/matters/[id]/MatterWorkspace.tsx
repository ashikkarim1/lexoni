"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Building2, Check, ChevronRight, Eye } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ResizablePanes } from "@/components/ui/ResizablePanes";
import { t, type Locale } from "@/lib/i18n";
import type { MatterWorkspace as MW, DocSlot, SlotTemplate, Blocker } from "@/lib/types/matter";
import type { WallDescription } from "@/lib/data/walls";
import { ProcessTimeline } from "./ProcessTimeline";
import { MatterCanvas } from "./MatterCanvas";
import { ContextRail } from "./ContextRail";

type Modal =
  | { kind: "none" }
  | { kind: "autofill"; slotId: string; templateTitle: string }
  | { kind: "wizard"; slotId: string };

type SlotPatchBody = {
  slotId: string;
  status?: DocSlot["status"];
  autofilledFromClient?: boolean;
  coreDetailDiffJson?: Record<string, unknown>;
  attachedTemplateTitle?: string;
};

async function patchSlot(body: SlotPatchBody): Promise<boolean> {
  try {
    const res = await fetch("/api/slots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Three-pane Matter Workspace. Owns slot state, modal state, AI prompt
 * state. Renders ResizablePanes with ProcessTimeline / MatterCanvas /
 * ContextRail. Reads its persisted pane widths from localStorage.
 */
export function MatterWorkspace({
  matter,
  templates,
  blockers,
  locale,
  wall,
  caseId,
  docsBySlot,
}: {
  matter: MW;
  templates: SlotTemplate[];
  blockers: Blocker[];
  locale: Locale;
  wall: WallDescription | null;
  caseId: string;
  docsBySlot: Record<string, import("@/lib/data/documents").DocumentRow[]>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [slots, setSlots] = useState<DocSlot[]>(matter.slots);
  const [selected, setSelected] = useState<string>(
    matter.slots.find((s) => s.status !== "signed")?.id ?? matter.slots[0].id,
  );
  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [promptMode, setPromptMode] = useState<"text" | "voice">("text");
  const [prompt, setPrompt] = useState("");
  const [drafting, setDrafting] = useState(false);

  const progress = Math.round(
    (slots.filter((s) => ["signed", "filed", "approved"].includes(s.status)).length / slots.length) * 100,
  );
  const sel = slots.find((s) => s.id === selected)!;
  const statusLabel = (st: string) => t(locale, `matters.statusLabel.${st}`);

  const revertSlots = (snapshot: DocSlot[]) => {
    setSlots(snapshot);
    toast.error(t(locale, "workspace.toast.saveFailed"));
  };

  const attachTemplate = (templateTitle: string) =>
    setModal({ kind: "autofill", slotId: selected, templateTitle });

  const confirmAutofill = async (withClientData: boolean) => {
    if (modal.kind !== "autofill") return;
    const id = modal.slotId;
    const snapshot = slots;
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, status: "drafting", autofilled: withClientData } : s)));
    setSelected(id);
    const templateTitle = modal.templateTitle;
    setModal({ kind: "none" });

    if (withClientData) toast.success(t(locale, "workspace.toast.populated", { client: matter.clientRecord.legalName }));
    else                toast.info(t(locale, "workspace.toast.attached"));

    const diff = withClientData
      ? {
          legalName: matter.clientRecord.legalName,
          legalNameAr: matter.clientRecord.legalNameAr,
          address: matter.clientRecord.address,
          licenseNo: matter.clientRecord.licenseNo,
          signatory: matter.clientRecord.signatory,
          signatoryTitle: matter.clientRecord.signatoryTitle,
          _proposedAt: new Date().toISOString(),
        }
      : undefined;

    const ok = await patchSlot({
      slotId: id,
      status: "drafting",
      autofilledFromClient: withClientData,
      coreDetailDiffJson: diff,
      attachedTemplateTitle: templateTitle,
    });
    if (!ok) revertSlots(snapshot);
    else router.refresh();
  };

  const advance = async (id: string, to: DocSlot["status"]) => {
    const snapshot = slots;
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, status: to } : s)));
    toast.success(t(locale, "workspace.toast.statusUpdated", {
      title: slots.find((s) => s.id === id)?.title ?? "",
      status: statusLabel(to),
    }));
    const ok = await patchSlot({ slotId: id, status: to });
    if (!ok) revertSlots(snapshot);
    else router.refresh();
  };

  const aiDraft = async () => {
    if (!prompt.trim() || drafting) return;
    const targetId = selected;
    const snapshot = slots;
    setDrafting(true);
    setSlots((prev) => prev.map((s) => (s.id === targetId ? { ...s, status: "drafting", autofilled: true } : s)));
    const sentPrompt = prompt;
    setPrompt("");

    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matterId: matter.id,
          slotId: targetId,
          prompt: sentPrompt,
          language: matter.language,
          slotTitle: slots.find((s) => s.id === targetId)?.title ?? "document",
          inputMode: promptMode,
        }),
      });
      if (!res.ok) {
        const reason = (await res.json().catch(() => null)) as { error?: string } | null;
        revertSlots(snapshot);
        toast.error(reason?.error === "wall_denied"
          ? t(locale, "workspace.toast.wallDenied")
          : t(locale, "workspace.toast.draftFailed"));
      } else {
        toast.success(t(locale, "workspace.toast.draftReady", {
          title: slots.find((s) => s.id === targetId)?.title ?? "",
        }));
        await patchSlot({ slotId: targetId, status: "drafting", autofilledFromClient: true });
        router.refresh();
      }
    } catch {
      revertSlots(snapshot);
      toast.error(t(locale, "workspace.toast.draftFailed"));
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-3.5rem)] bg-canvas">
      {/* Compact header bar above the three panes */}
      <div className="px-6 py-3 border-b border-line bg-surface flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <Link href="/matters" className="text-caption text-muted hover:text-ink inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t(locale, "matters.workspace.allMatters")}
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-h2 leading-tight">{matter.title}</h1>
            {wall && (
              <Badge tone="warning">
                <Lock className="h-3 w-3" aria-hidden /> {t(locale, "matters.workspace.wallBadge")}
              </Badge>
            )}
          </div>
          <div className="text-caption text-muted mt-1 flex items-center gap-2 flex-wrap">
            <span>#{matter.matterNumber}</span><span aria-hidden>·</span>
            <Badge tone="info">{matter.processTitle}</Badge>
            <span>{matter.jurisdiction}</span><span aria-hidden>·</span>
            <span>{matter.language.toUpperCase()}</span><span aria-hidden>·</span>
            <span>{matter.feeModel}</span>
          </div>
        </div>
        <div className="text-end shrink-0">
          <div className="text-h2 tabular-nums">{progress}%</div>
          <div className="text-caption text-muted">
            {t(locale, "matters.workspace.complete")} · {t(locale, "matters.workspace.target", { date: matter.targetCloseAt })}
          </div>
        </div>
      </div>

      {/* Three-pane resizable layout */}
      <div className="flex-1 min-h-0">
        <ResizablePanes
          id="matter-workspace"
          left={
            <ProcessTimeline
              locale={locale}
              processTitle={matter.processTitle}
              jurisdiction={matter.jurisdiction}
              slots={slots}
              selectedId={selected}
              onSelect={setSelected}
              progressPct={progress}
            />
          }
          center={
            <MatterCanvas
              locale={locale}
              sel={sel}
              caseId={caseId}
              documents={docsBySlot[sel.id] ?? []}
              matterId={matter.id}
              matterLanguage={matter.language}
              promptMode={promptMode}
              setPromptMode={setPromptMode}
              prompt={prompt}
              setPrompt={setPrompt}
              drafting={drafting}
              onAdvance={advance}
              onAiDraft={aiDraft}
              onOpenWizard={() => setModal({ kind: "wizard", slotId: sel.id })}
            />
          }
          right={
            <ContextRail
              locale={locale}
              region={matter.region}
              language={matter.language}
              processTitle={matter.processTitle}
              templates={templates}
              blockers={blockers}
              wall={wall}
              selectedSlotId={selected}
              onAttachTemplate={attachTemplate}
            />
          }
        />
      </div>

      {/* Autofill modal */}
      <Modal
        open={modal.kind === "autofill"}
        onClose={() => setModal({ kind: "none" })}
        title={
          <span className="inline-flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" aria-hidden />
            {t(locale, "matters.workspace.autofillTitle")}
          </span>
        }
        description={
          modal.kind === "autofill"
            ? t(locale, "matters.workspace.autofillBody", { template: modal.templateTitle, client: matter.clientRecord.legalName })
            : undefined
        }
        closeAriaLabel={t(locale, "common.cancel")}
        footer={
          <>
            <button onClick={() => setModal({ kind: "none" })} className="btn-secondary btn-sm">{t(locale, "common.cancel")}</button>
            <button onClick={() => confirmAutofill(false)} className="btn-secondary btn-sm">{t(locale, "matters.workspace.attachBlank")}</button>
            <button onClick={() => confirmAutofill(true)} className="btn-primary btn-sm">
              <Check className="h-4 w-4" aria-hidden /> {t(locale, "matters.workspace.yesPopulate")}
            </button>
          </>
        }
      >
        <div className="card bg-canvas p-3 text-body-sm">
          <Row k={t(locale, "matters.workspace.fieldLegalName")} v={matter.clientRecord.legalName} />
          <Row k={t(locale, "matters.workspace.fieldArabicName")} v={matter.clientRecord.legalNameAr} />
          <Row k={t(locale, "matters.workspace.fieldAddress")} v={matter.clientRecord.address} />
          <Row k={t(locale, "matters.workspace.fieldLicense")} v={matter.clientRecord.licenseNo} />
          <Row k={t(locale, "matters.workspace.fieldSignatory")} v={`${matter.clientRecord.signatory} · ${matter.clientRecord.signatoryTitle}`} />
        </div>
      </Modal>

      {/* Wizard */}
      <Wizard
        open={modal.kind === "wizard"}
        locale={locale}
        slotTitle={modal.kind === "wizard" ? (slots.find((s) => s.id === modal.slotId)?.title ?? "") : ""}
        onClose={() => setModal({ kind: "none" })}
        onDone={() => {
          if (modal.kind === "wizard") {
            const id = modal.slotId;
            setModal({ kind: "none" });
            advance(id, "in_review");
          }
        }}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-line/60 last:border-0">
      <span className="text-muted">{k}</span>
      <span className="font-medium text-end">{v}</span>
    </div>
  );
}

function Wizard({ open, locale, slotTitle, onClose, onDone }: { open: boolean; locale: Locale; slotTitle: string; onClose: () => void; onDone: () => void }) {
  const sectionKeys = ["parties", "definitions", "operative", "governingLaw", "execution"] as const;
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t(locale, "matters.workspace.wizard")} · ${slotTitle}`}
      size="lg"
      closeAriaLabel={t(locale, "common.cancel")}
      footer={
        !preview ? (
          <>
            <button disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="btn-secondary btn-sm">{t(locale, "matters.workspace.wizardBack")}</button>
            {step < sectionKeys.length - 1
              ? <button onClick={() => setStep((s) => s + 1)} className="btn-primary btn-sm">{t(locale, "matters.workspace.wizardNext")} <ChevronRight className="h-4 w-4" aria-hidden /></button>
              : <button onClick={() => setPreview(true)} className="btn-primary btn-sm"><Eye className="h-4 w-4" aria-hidden /> {t(locale, "matters.workspace.wizardPreview")}</button>}
          </>
        ) : (
          <>
            <button onClick={() => setPreview(false)} className="btn-secondary btn-sm">{t(locale, "matters.workspace.wizardBack")}</button>
            <button onClick={onDone} className="btn-primary btn-sm"><Check className="h-4 w-4" aria-hidden /> {t(locale, "matters.workspace.sendToReview")}</button>
          </>
        )
      }
    >
      {!preview ? (
        <>
          <div className="flex items-center gap-1 mb-4" aria-hidden>
            {sectionKeys.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary-600" : "bg-line"}`} />
            ))}
          </div>
          <div className="sec-title mb-1">
            {t(locale, "matters.workspace.wizardSectionOf", { current: step + 1, total: sectionKeys.length })}
          </div>
          <div className="text-h3 mb-3">{t(locale, `matters.workspace.wizardSection.${sectionKeys[step]}`)}</div>
          <textarea
            defaultValue={t(locale, "matters.workspace.wizardPrefill", {
              section: t(locale, `matters.workspace.wizardSection.${sectionKeys[step]}`),
            })}
            className="textarea h-28"
          />
        </>
      ) : (
        <>
          <div className="sec-title mb-2">{t(locale, "matters.workspace.wizardPreview")}</div>
          <div className="card bg-canvas p-4 text-body-sm space-y-2 max-h-72 overflow-auto">
            {sectionKeys.map((k) => (
              <div key={k}>
                <div className="font-semibold">{t(locale, `matters.workspace.wizardSection.${k}`)}</div>
                <div className="text-caption text-muted">{t(locale, "matters.workspace.wizardCompiled")}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
