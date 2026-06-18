"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Loader2 } from "lucide-react";
import { Field, Input } from "@/components/ui/Form";
import { HumanCheck, type HumanCheckHandle } from "@/components/security/HumanCheck";

export function ResetConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const humanRef = useRef<HumanCheckHandle>(null);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (p1.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (p1 !== p2) { setError("Passwords do not match."); return; }
    startTransition(async () => {
      const bundle = await humanRef.current?.getBundle();
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, password: p1,
          challengeToken: bundle?.challengeToken,
          honeypotFieldName: bundle?.honeypotFieldName,
          honeypotValue: bundle?.honeypotValue,
          turnstileToken: bundle?.turnstileToken,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error === "expired" ? "This reset link expired. Request a new one." :
                 j.error === "invalid_or_used" ? "This link is no longer valid." :
                 "Something went wrong. Try again.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/signin"), 1200);
    });
  }

  if (done) {
    return (
      <div className="text-center py-2 space-y-2">
        <CheckCircle2 className="h-8 w-8 text-success-600 mx-auto" aria-hidden />
        <div className="text-h3">Password updated</div>
        <p className="text-body-sm text-muted">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="New password" required>
        <Input value={p1} onChange={(e) => setP1(e.target.value)} type="password" placeholder="At least 8 characters" autoFocus />
      </Field>
      <Field label="Confirm new password" required>
        <Input value={p2} onChange={(e) => setP2(e.target.value)} type="password" />
      </Field>
      <HumanCheck invisible ref={humanRef} />
      {error && <div className="text-caption text-danger-700">{error}</div>}
      <button className="btn-primary w-full" onClick={submit} disabled={pending || !p1 || !p2}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} {pending ? "Saving..." : "Set new password"}
      </button>
    </div>
  );
}
