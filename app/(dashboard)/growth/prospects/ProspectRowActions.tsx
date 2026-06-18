"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function ProspectRowActions({ id, status, hasEmail }: { id: string; status: string; hasEmail: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function draft() {
    setBusy("draft");
    const res = await fetch("/api/growth/outreach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ draftForProspectId: id }),
    });
    setBusy(null);
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    toast.success("Draft created");
    router.push("/growth/outreach");
  }

  async function setStatus(status: string) {
    setBusy(status);
    const res = await fetch("/api/growth/prospects", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    if (!res.ok) { toast.error("Failed"); return; }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <button className="btn-primary btn-sm" onClick={draft} disabled={busy !== null}>
        {busy === "draft" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Draft
      </button>
      {status === "new" && (
        <button className="btn-secondary btn-sm" onClick={() => setStatus("cold")} disabled={busy !== null} title="Mark cold">cold</button>
      )}
      <span className="text-caption text-muted ms-1">{hasEmail ? <Send className="h-3 w-3 inline" /> : "no email"}</span>
    </div>
  );
}
