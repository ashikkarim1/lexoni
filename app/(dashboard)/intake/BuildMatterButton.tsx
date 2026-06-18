"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function BuildMatterButton({ intakeId, status }: { intakeId: string; status: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    const res = await fetch("/api/intake/build", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intakeId }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Auto-build failed.");
      return;
    }
    toast.success("Plan ready - awaiting partner sign-off.");
    router.push(`/copilot`);
  }

  const disabled = busy || status === "rejected" || status === "spam";

  return (
    <button
      className="btn-secondary btn-sm"
      onClick={build}
      disabled={disabled}
      title={disabled ? "This intake can't be built into a matter." : "Auto-build the matter pack from this intake."}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Build matter
    </button>
  );
}
