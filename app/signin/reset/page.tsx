import Link from "next/link";
import { Mail } from "lucide-react";
import { ResetRequestForm } from "./ResetRequestForm";

export const metadata = { title: "Reset password" };

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-midnight text-white flex items-center justify-center font-bold">L</div>
          <Link href="/" className="font-semibold">Lexoni.ai</Link>
        </div>
        <div className="text-h2 flex items-center gap-2 mb-1"><Mail className="h-5 w-5 text-royal" /> Reset password</div>
        <p className="text-body-sm text-muted mb-5">Enter your email. We will send you a one-time link to set a new password.</p>
        <ResetRequestForm />
        <div className="text-caption text-muted text-center mt-4 pt-4 border-t border-line">
          Remembered it? <Link href="/signin" className="text-ink hover:underline">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
