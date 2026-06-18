"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CheckCircle2 } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { HumanCheck, type HumanCheckHandle } from "@/components/security/HumanCheck";

export function PartySignActions({ token, signerName }: { token: string; signerName: string }) {
  const router = useRouter();
  const humanRef = useRef<HumanCheckHandle>(null);
  const [mode, setMode] = useState<"choose" | "sign" | "decline">("choose");
  const [name, setName] = useState(signerName);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  async function call(payload: Record<string, unknown>) {
    const bundle = await humanRef.current?.getBundle();
    if (!bundle) { setError("Security check failed to load. Refresh and try again."); return false; }
    const res = await fetch("/api/signatures/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload, token,
        challengeToken: bundle.challengeToken,
        honeypotFieldName: bundle.honeypotFieldName,
        honeypotValue: bundle.honeypotValue,
        turnstileToken: bundle.turnstileToken,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(j?.error === "rejected_human_check" ? "Security check failed. Please try again." : j?.error ?? "failed");
      return false;
    }
    return true;
  }
  const submitSign = () => {
    setError(null);
    startTransition(async () => { const ok = await call({ signerName: name.trim() }); if (ok) { setDone(true); setTimeout(() => router.refresh(), 500); } });
  };
  const submitDecline = () => {
    setError(null);
    startTransition(async () => { const ok = await call({ decline: true, reason }); if (ok) { setDone(true); setTimeout(() => router.refresh(), 500); } });
  };

  if (done) return (
    <div className="text-center py-2">
      <CheckCircle2 className="h-8 w-8 text-success-600 mx-auto mb-2" aria-hidden />
      <div className="text-h3">Recorded.</div>
    </div>
  );

  if (mode === "choose") return (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      <button onClick={() => setMode("decline")} className="btn-secondary"><X className="h-4 w-4" /> Decline</button>
      <button onClick={() => setMode("sign")} className="btn-primary"><Check className="h-4 w-4" /> Sign</button>
    </div>
  );

  if (mode === "sign") return (
    <div className="space-y-3">
      <div className="text-h3">Sign the document</div>
      <Field label="Type your full name to sign" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <p className="text-caption text-muted">By signing, you confirm acceptance of the document above. Your signature, IP and timestamp are sealed with a tamper-evident certificate hash.</p>
      <HumanCheck ref={humanRef} />
      {error && <div className="text-caption text-danger-700">{error}</div>}
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => setMode("choose")} className="btn-secondary">Back</button>
        <button onClick={submitSign} disabled={pending || !name.trim()} className="btn-primary"><Check className="h-4 w-4" /> {pending ? "Signing…" : "Sign"}</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="text-h3">Decline this signature request</div>
      <Field label="Reason (optional)">
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
      </Field>
      <HumanCheck ref={humanRef} />
      {error && <div className="text-caption text-danger-700">{error}</div>}
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => setMode("choose")} className="btn-secondary">Back</button>
        <button onClick={submitDecline} disabled={pending} className="btn-danger"><X className="h-4 w-4" /> {pending ? "Submitting…" : "Decline"}</button>
      </div>
    </div>
  );
}
