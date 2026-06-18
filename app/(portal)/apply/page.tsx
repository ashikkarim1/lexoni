/**
 * Public-facing intake page.
 *
 * Rendered at `/apply` on the platform and at the firm's white-labelled
 * domain (e.g. portal.crescentlaw.ae/apply). The prospect describes their
 * need in plain English; AI classifies (sector, function, urgency) and the
 * routing engine picks the best-fit lawyer for the triage queue.
 *
 * NOT inside (dashboard) - this is anonymous, branded by the host firm.
 * Protected by the HumanCheck primitive (Turnstile + signed honeypot +
 * rate-limit) so bots cannot spam the firm's intake queue.
 */
import { getFirmBrandingByHost } from "@/lib/data/branding";
import { ApplyForm } from "./ApplyForm";

export default async function IntakePage() {
  const firmBranding = await getFirmBrandingByHost();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ background: firmBranding.primaryColor }}>L</div>
          <div>
            <div className="font-semibold text-sm">{firmBranding.firmName}</div>
            <div className="text-[11px] text-muted">New client intake</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="h1">Tell us what you need help with</h1>
          <p className="text-sm text-muted mt-2 max-w-xl">
            Plain English is fine. Our AI will read your description, suggest the right area of law, and route you to the right partner - typically within one business hour.
          </p>
        </div>
        <ApplyForm branding={{ firmName: firmBranding.firmName, primaryColor: firmBranding.primaryColor }} />
      </main>
    </div>
  );
}
