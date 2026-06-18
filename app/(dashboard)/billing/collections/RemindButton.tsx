"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function RemindButton({ invoiceId, hasEmail }: { invoiceId: string; hasEmail: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function remind() {
    setBusy(true);
    const res = await fetch("/api/billing/remind", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    setBusy(false);
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    const j = await res.json();
    if (j.skipped) toast.info("No email on file - added an audit-log entry.");
    else toast.success("Reminder sent.");
    router.refresh();
  }

  return (
    <button className="btn-secondary btn-sm" onClick={remind} disabled={busy} title={hasEmail ? "Send polite reminder" : "No email on file"}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />} Remind
    </button>
  );
}
