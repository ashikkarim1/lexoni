"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, Lock, KeyRound } from "lucide-react";
import { Field, Input } from "@/components/ui/Form";
import { HumanCheck, type HumanCheckHandle } from "@/components/security/HumanCheck";

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const humanRef = useRef<HumanCheckHandle>(null);

  const submitPassword = () => {
    setError(null);
    if (!email.includes("@") || !password) { setError("Enter your email and password."); return; }
    startTransition(async () => {
      const bundle = await humanRef.current?.getBundle();
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          challengeToken: bundle?.challengeToken,
          honeypotFieldName: bundle?.honeypotFieldName,
          honeypotValue: bundle?.honeypotValue,
          turnstileToken: bundle?.turnstileToken,
        }),
      });
      if (res.status === 429) { setError("Too many attempts. Please wait a moment."); return; }
      if (res.status === 401) { setError("That email and password don't match."); return; }
      if (!res.ok) { setError("Something went wrong. Try again."); return; }
      const j = await res.json();
      router.push(j.redirect ?? "/desk");
      router.refresh();
    });
  };

  const submitMagic = () => {
    setError(null);
    if (!email.includes("@")) { setError("Enter a valid email."); return; }
    startTransition(async () => {
      const bundle = await humanRef.current?.getBundle();
      if (!bundle) { setError("Security check failed to load. Refresh and try again."); return; }
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          challengeToken: bundle.challengeToken,
          honeypotFieldName: bundle.honeypotFieldName,
          honeypotValue: bundle.honeypotValue,
          turnstileToken: bundle.turnstileToken,
        }),
      });
      if (res.status === 429) { setError("Too many attempts. Please wait a moment."); return; }
      if (!res.ok) { setError("We couldn't send the link. Try again."); return; }
      setMagicSent(true);
    });
  };

  if (magicSent) {
    return (
      <div className="text-center py-2 space-y-2">
        <CheckCircle2 className="h-8 w-8 text-success-600 mx-auto" aria-hidden />
        <div className="text-h3">Check your inbox</div>
        <p className="text-body-sm text-muted">We sent a sign-in link to <strong className="text-ink">{email}</strong>. It's valid for 15 minutes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-canvas border border-line text-caption">
        <button
          onClick={() => setMode("password")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-sm transition ${mode === "password" ? "bg-white text-ink font-medium shadow-sm" : "text-muted"}`}
        ><KeyRound className="h-3.5 w-3.5" /> Password</button>
        <button
          onClick={() => setMode("magic")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-sm transition ${mode === "magic" ? "bg-white text-ink font-medium shadow-sm" : "text-muted"}`}
        ><Mail className="h-3.5 w-3.5" /> Magic link</button>
      </div>

      <Field label="Work email" required>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@firm.com" autoFocus />
      </Field>

      {mode === "password" && (
        <Field label="Password" required>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </Field>
      )}

      <HumanCheck invisible ref={humanRef} />

      {error && <div className="text-caption text-danger-700">{error}</div>}

      <button
        onClick={mode === "password" ? submitPassword : submitMagic}
        disabled={pending || !email.trim() || (mode === "password" && !password)}
        className="btn-primary w-full"
      >
        {mode === "password" ? <Lock className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
        {pending ? "Signing in…" : mode === "password" ? "Sign in" : "Email me a sign-in link"}
      </button>

      <div className="text-caption text-muted text-center pt-1 border-t border-line">
        <Link href="/signin/reset" className="hover:text-ink">Forgot password?</Link>
      </div>
    </div>
  );
}
