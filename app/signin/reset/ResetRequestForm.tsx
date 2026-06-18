"use client";
import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Send, Loader2 } from "lucide-react";
import { Field, Input } from "@/components/ui/Form";
import { HumanCheck, type HumanCheckHandle } from "@/components/security/HumanCheck";

export function ResetRequestForm() {
  const humanRef = useRef<HumanCheckHandle>(null);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!email.includes("@")) { setError("Enter a valid email."); return; }
    startTransition(async () => {
      const bundle = await humanRef.current?.getBundle();
      const res = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          challengeToken: bundle?.challengeToken,
          honeypotFieldName: bundle?.honeypotFieldName,
          honeypotValue: bundle?.honeypotValue,
          turnstileToken: bundle?.turnstileToken,
        }),
      });
      if (res.status === 429) { setError("Too many attempts. Please wait."); return; }
      // Always 200 to avoid email enumeration; show success regardless.
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="text-center py-2 space-y-2">
        <CheckCircle2 className="h-8 w-8 text-success-600 mx-auto" aria-hidden />
        <div className="text-h3">Check your inbox</div>
        <p className="text-body-sm text-muted">If <strong className="text-ink">{email}</strong> matches an account, a reset link is on its way. The link is valid for 60 minutes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="Work email" required>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@firm.com" autoFocus />
      </Field>
      <HumanCheck invisible ref={humanRef} />
      {error && <div className="text-caption text-danger-700">{error}</div>}
      <button className="btn-primary w-full" onClick={submit} disabled={pending || !email.trim()}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {pending ? "Sending..." : "Email me a reset link"}
      </button>
    </div>
  );
}
