"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function OutreachRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function send() {
    setBusy("send");
    const res = await fetch("/api/growth/outreach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sendId: id }),
    });
    setBusy(null);
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    const j = await res.json();
    if (j.skipped) toast.info("No email on file - audited as skipped.");
    else toast.success("Sent.");
    router.refresh();
  }
  async function mark(next: string) {
    setBusy(next);
    const res = await fetch("/api/growth/outreach", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    setBusy(null);
    if (!res.ok) { toast.error("Failed"); return; }
    router.refresh();
  }

  if (status === "drafted") return <button className="btn-primary btn-sm" onClick={send} disabled={busy !== null}>{busy === "send" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send</button>;
  if (status === "sent" || status === "opened") return (
    <div className="flex gap-1">
      <button className="btn-secondary btn-sm" onClick={() => mark("replied")} disabled={busy !== null}><MessageSquare className="h-3.5 w-3.5" /> Replied</button>
      <button className="btn-primary btn-sm" onClick={() => mark("converted")} disabled={busy !== null}><CheckCircle2 className="h-3.5 w-3.5" /> Converted</button>
    </div>
  );
  return <span className="text-caption text-muted">-</span>;
}
