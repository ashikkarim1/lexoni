"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Field, Input } from "@/components/ui/Form";
import { HumanCheck, type HumanCheckHandle } from "@/components/security/HumanCheck";

export function AcceptForm({
  token,
  prefillName,
  email,
  tenantName,
}: {
  token: string;
  prefillName: string;
  email: string;
  tenantName: string;
}) {
  const router = useRouter();
  const humanRef = useRef<HumanCheckHandle>(null);
  const [name, setName] = useState(prefillName);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const bundle = await humanRef.current?.getBundle();
      if (!bundle) { setError("Security check failed to load. Refresh and try again."); return; }
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, fullName: name.trim() || undefined,
          challengeToken: bundle.challengeToken,
          honeypotFieldName: bundle.honeypotFieldName,
          honeypotValue: bundle.honeypotValue,
          turnstileToken: bundle.turnstileToken,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error === "rejected_human_check" ? "Security check failed. Please try again." : j?.error ?? "accept_failed");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/desk"), 1200);
    });
  };

  if (done) {
    return (
      <div className="text-center py-2">
        <CheckCircle2 className="h-8 w-8 text-success-600 mx-auto mb-2" aria-hidden />
        <div className="text-h3">Welcome to {tenantName}</div>
        <p className="text-body-sm text-muted mt-1">Taking you to your desk…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="Email">
        <Input value={email} disabled />
      </Field>
      <Field label="Your full name" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sara Al-Mansoori" />
      </Field>
      <HumanCheck invisible ref={humanRef} />
      {error && <div className="text-caption text-danger-700">{error}</div>}
      <button onClick={submit} disabled={pending || !name.trim()} className="btn-primary w-full">
        {pending ? "Accepting…" : "Accept invitation"}
      </button>
    </div>
  );
}
