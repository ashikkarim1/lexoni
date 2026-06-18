import Link from "next/link";
import { Lock } from "lucide-react";
import { ResetConfirmForm } from "./ResetConfirmForm";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default function Page({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-midnight text-white flex items-center justify-center font-bold">L</div>
          <Link href="/" className="font-semibold">Lexoni.ai</Link>
        </div>
        <div className="text-h2 flex items-center gap-2 mb-1"><Lock className="h-5 w-5 text-royal" /> New password</div>
        <p className="text-body-sm text-muted mb-5">Choose a password that is at least 8 characters. Single use, 60-minute link.</p>
        <ResetConfirmForm token={params.token} />
      </div>
    </div>
  );
}
