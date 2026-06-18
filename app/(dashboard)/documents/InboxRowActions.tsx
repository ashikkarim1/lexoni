"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Matter = { id: string; title: string };

export function InboxRowActions({
  inboxId,
  suggestedCaseId,
  matters,
}: {
  inboxId: string;
  suggestedCaseId: string | null;
  matters: Matter[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [caseId, setCaseId] = useState<string>(suggestedCaseId ?? matters[0]?.id ?? "");

  async function file() {
    if (!caseId) return;
    setBusy(true);
    const res = await fetch("/api/documents/route", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inboxId, caseId }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Filed");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed");
    }
  }

  async function reject() {
    setBusy(true);
    const res = await fetch("/api/documents/route", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inboxId, reason: "Marked not-relevant from the inbox" }),
    });
    setBusy(false);
    if (res.ok) { toast.success("Rejected"); router.refresh(); }
    else toast.error("Failed");
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="select select-sm max-w-[12rem]"
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
        disabled={busy}
      >
        {matters.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
      </select>
      <button className="btn-primary btn-sm" disabled={busy || !caseId} onClick={file}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} File
      </button>
      <button className="btn-ghost btn-sm" disabled={busy} onClick={reject} title="Not relevant">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
