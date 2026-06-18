"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const REASONS = [
  "Too expensive",
  "Missing a feature we need",
  "Using a different tool now",
  "Pausing legal work",
  "Other",
];

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [note, setNote] = useState("");

  async function confirm() {
    setBusy(true);
    const res = await fetch("/api/billing/subscription", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subscriptionId, reason, note }),
    });
    setBusy(false);
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Cancellation queued - keeps running until renewal.");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn-ghost border border-line text-danger-700 btn-sm" onClick={() => setOpen(true)}>
        <X className="h-4 w-4" /> Cancel subscription
      </button>
      {open && (
        <Modal open={open} title="Cancel subscription" onClose={() => setOpen(false)}>
          <div className="space-y-3 text-body-sm">
            <div className="rounded-lg border border-warning-200 bg-warning-50/40 p-3 text-caption text-warning-700 flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                The platform stays available until your current period ends. Audit log, signed documents, and your data remain accessible for 90 days after cancellation per our retention policy.
              </div>
            </div>
            <label className="block">
              <div className="text-caption text-muted mb-1">Reason</div>
              <select className="select w-full" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-caption text-muted mb-1">Anything we could've done better?</div>
              <textarea className="textarea w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="(optional - we read every note)" />
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>Keep subscription</button>
              <button className="btn-ghost text-danger-700 border border-danger-200" onClick={confirm} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Confirm cancellation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
