import type { Metadata } from "next";
import { Brand } from "@/components/ui/Brand";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage({ searchParams }: { searchParams: { error?: string; signedout?: string; verify?: string } }) {
  const errorLabel: Record<string, string> = {
    missing:        "The sign-in link was malformed. Request a new one below.",
    not_found:      "That sign-in link is unknown. Request a new one below.",
    used:           "That sign-in link has already been used. Request a fresh one below.",
    expired:        "That sign-in link expired. Request a new one below.",
    no_membership:  "We couldn't find an active membership for that email. Ask the partner who invited you to resend the invite.",
    db_unavailable: "Sign-in is unavailable right now. Try again in a moment.",
  };

  const verifyLabel: Record<string, { tone: "success" | "danger"; message: string }> = {
    ok:      { tone: "success", message: "Your email has been verified. Sign in below." },
    invalid: { tone: "danger",  message: "That verification link is invalid or has already been used." },
    expired: { tone: "danger",  message: "That verification link has expired. Sign in with your email to request a new one." },
    missing: { tone: "danger",  message: "Verification link is missing a token. Try clicking the link in your email again." },
  };

  const errorMessage = searchParams.error ? errorLabel[searchParams.error] ?? "Something went wrong - try again." : null;
  const verifyStatus = searchParams.verify ? (verifyLabel[searchParams.verify] ?? { tone: "danger" as const, message: "Verification failed - try again." }) : null;
  const signedOut = searchParams.signedout === "1";

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="card-raised w-full max-w-md p-7 space-y-5">
        <Brand />
        <div>
          <div className="sec-title mb-1">Welcome back</div>
          <h1 className="text-h1 leading-tight">Sign in to Lexoni.ai</h1>
          <p className="text-body-sm text-muted mt-2 leading-relaxed">
            Sign in with your password or request a one-time magic link. Sessions are signed with a 30-day cookie and you can sign out from the topbar.
          </p>
        </div>

        {signedOut && (
          <div className="text-caption text-success-700 bg-success-50 border border-success-200 rounded-md px-3 py-2">
            You've been signed out.
          </div>
        )}
        {verifyStatus && (
          <div className={`text-caption rounded-md px-3 py-2 border ${
            verifyStatus.tone === "success"
              ? "text-success-700 bg-success-50 border-success-200"
              : "text-danger-700 bg-danger-50 border-danger-200"
          }`}>
            {verifyStatus.message}
          </div>
        )}
        {errorMessage && (
          <div className="text-caption text-danger-700 bg-danger-50 border border-danger-200 rounded-md px-3 py-2">
            {errorMessage}
          </div>
        )}

        <SignInForm />

        <p className="text-caption text-muted">
          New to Lexoni? Your firm admin will send you an invitation link to get started.
        </p>
      </div>
    </div>
  );
}
