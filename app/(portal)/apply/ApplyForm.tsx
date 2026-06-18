"use client";
import { useRef, useState } from "react";
import { Send, Sparkles, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HumanCheck, type HumanCheckHandle } from "@/components/security/HumanCheck";

const SECTORS = ["Fintech","Real estate","Energy","Healthcare","Tech / SaaS","E-commerce","Manufacturing","Logistics","Family office","Fund (GP)","Other"];
const FUNCTIONS = ["Incorporation","Fundraising / VC-PE","M&A","Corporate governance","Employment","IP / Trademark","Litigation","Arbitration","Regulatory","Tax","Data privacy","Other"];

type Branding = { firmName: string; primaryColor: string };

const URGENCY_MAP: Record<string, "low" | "medium" | "high" | "critical"> = {
  Standard: "low", "Within 1 week": "medium", "This week": "high", Critical: "critical",
};
const REGION_MAP: Record<string, "UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL"> = {
  UAE: "UAE", KSA: "KSA", "Other GCC": "GLOBAL",
};

export function ApplyForm({ branding }: { branding: Branding }) {
  const humanRef = useRef<HumanCheckHandle>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  const [contactName, setName] = useState("");
  const [contactEmail, setEmail] = useState("");
  const [companyName, setCompany] = useState("");
  const [contactPhone, setPhone] = useState("");
  const [plainEnglish, setBrief] = useState("");
  const [region, setRegion] = useState<keyof typeof REGION_MAP>("UAE");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [urgency, setUrgency] = useState<keyof typeof URGENCY_MAP>("Standard");
  const [sector, setSector] = useState("");
  const [legalArea, setLegalArea] = useState("");
  const [consent, setConsent] = useState(false);

  async function submit() {
    setError(null);
    if (!contactName.trim() || !contactEmail.includes("@") || plainEnglish.trim().length < 20) {
      setError("Please complete your name, email and a short description of what you need.");
      return;
    }
    if (!consent) { setError("Please tick the consent box so we know we can contact you about this enquiry."); return; }

    setBusy(true);
    const bundle = await humanRef.current?.getBundle();
    if (!bundle) { setBusy(false); setError("Security check failed to load. Refresh and try again."); return; }
    const res = await fetch("/api/intake/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        companyName: companyName.trim() || null,
        region: REGION_MAP[region],
        language,
        plainEnglish: plainEnglish.trim(),
        sector: sector || null,
        legalArea: legalArea || null,
        urgency: URGENCY_MAP[urgency],
        challengeToken: bundle.challengeToken,
        honeypotFieldName: bundle.honeypotFieldName,
        honeypotValue: bundle.honeypotValue,
        turnstileToken: bundle.turnstileToken,
        contactPhone: contactPhone.trim() || null,
      }),
    });
    setBusy(false);
    if (res.status === 429) { setError("Too many submissions from your network. Please wait a few minutes."); return; }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      if (j.error === "rejected_human_check") setError("Security check failed - please refresh the page and try again.");
      else setError(j.error ?? "Something went wrong. Please try again.");
      return;
    }
    const j = (await res.json()) as { reference: string };
    setDone({ reference: j.reference });
  }

  if (done) {
    return (
      <Card>
        <CardBody className="text-center py-12 space-y-3">
          <CheckCircle2 className="h-10 w-10 text-success-600 mx-auto" />
          <div className="text-h2">Thanks - we've got your enquiry.</div>
          <p className="text-body-sm text-muted max-w-md mx-auto">
            Your reference is <strong className="text-ink">{done.reference}</strong>. A senior partner at {branding.firmName} will review and respond within one business hour. We've also sent a confirmation to <strong className="text-ink">{contactEmail}</strong>.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader title="About you" />
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldI label="Full name *"   value={contactName}   onChange={setName}    placeholder="e.g. Omar Khalifa" />
          <FieldI label="Work email *"  value={contactEmail}  onChange={setEmail}   placeholder="you@company.com" type="email" />
          <FieldI label="Company name"  value={companyName}   onChange={setCompany} placeholder="e.g. Delta Pay FZE" />
          <FieldI label="Phone"         value={contactPhone}  onChange={setPhone}   placeholder="+971…" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="What do you need?" action={<Badge tone="info"><Sparkles className="h-3 w-3 mr-1" />AI-assisted</Badge>} />
        <CardBody className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted">Describe in your own words *</label>
            <textarea rows={7} value={plainEnglish} onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g. We're a UAE fintech preparing a Series A. We need help with the shareholders' agreement, anti-dilution terms, and the ADGM regulatory filings. Closing target is 60 days."
              className="w-full mt-1 text-sm rounded-lg border border-line bg-canvas p-3 focus:outline-none focus:ring-2 focus:ring-royal/30" />
            <p className="text-[11px] text-muted mt-1">No NDAs needed at this stage - everything you share is confidential and you control whether to proceed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Sel label="Region"   value={region}   onChange={(v) => setRegion(v as keyof typeof REGION_MAP)}     options={["UAE", "KSA", "Other GCC"]} />
            <Sel label="Language" value={language === "ar" ? "العربية" : "English"} onChange={(v) => setLanguage(v === "العربية" ? "ar" : "en")} options={["English", "العربية"]} />
            <Sel label="Urgency"  value={urgency} onChange={(v) => setUrgency(v as keyof typeof URGENCY_MAP)}  options={["Standard", "Within 1 week", "This week", "Critical"]} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Sel label="Sector (best guess)"     value={sector}    onChange={setSector}    options={["", ...SECTORS]} />
            <Sel label="Legal area (best guess)" value={legalArea} onChange={setLegalArea} options={["", ...FUNCTIONS]} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4 text-sm">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I agree to be contacted about this enquiry. {branding.firmName} processes my data under the
              <a href="/legal/privacy" className="text-royal underline ms-1">privacy notice</a>.
            </span>
          </label>
          <HumanCheck ref={humanRef} />
        </CardBody>
      </Card>

      {error && <div className="card p-3 text-caption text-danger-700 bg-danger-50 border-danger-200">{error}</div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="h-4 w-4" />
          End-to-end encrypted · conflicts check on receipt · acknowledged within 60 seconds
        </div>
        <button className="btn-primary text-sm" style={{ background: branding.primaryColor }} onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {busy ? "Submitting…" : "Submit"}
        </button>
      </div>
    </>
  );
}

function FieldI({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted">{label}</div>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 text-sm rounded-lg border border-line bg-canvas p-2.5 focus:outline-none focus:ring-2 focus:ring-royal/30"
      />
    </label>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (s: string) => void; options: string[] }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 text-sm rounded-lg border border-line bg-canvas p-2.5">
        {options.map((o) => <option key={o} value={o}>{o || "-"}</option>)}
      </select>
    </label>
  );
}
