"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function AddProspectButton() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [legalName, setLegalName] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState<"UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL">("UAE");
  const [jurisdiction, setJurisdiction] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [targetKind, setTargetKind] = useState("licensing_regulatory");

  async function submit() {
    if (!legalName.trim()) return;
    setBusy(true);
    const res = await fetch("/api/growth/prospects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ legalName: legalName.trim(), industry, region, jurisdiction, contactName, contactEmail, contactRole, targetKind }),
    });
    setBusy(false);
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    toast.success("Prospect added");
    setOpen(false);
    setLegalName(""); setContactName(""); setContactEmail("");
    router.refresh();
  }

  return (
    <>
      <button className="btn-primary btn-sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add prospect</button>
      {open && (
        <Modal open={open} title="Add prospect" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Legal name *"><input className="input w-full" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="NorthWind Capital" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Industry"><input className="input w-full" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="fintech" /></Field>
              <Field label="Region">
                <select className="select w-full" value={region} onChange={(e) => setRegion(e.target.value as typeof region)}>
                  {["UAE", "KSA", "QAT", "BHR", "KWT", "OMN", "GLOBAL"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Jurisdiction"><input className="input w-full" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="ADGM" /></Field>
              <Field label="Target kind">
                <select className="select w-full" value={targetKind} onChange={(e) => setTargetKind(e.target.value)}>
                  {["company_formation", "ma_buyside", "ma_sellside", "go_public", "joint_venture", "fundraising_round", "licensing_regulatory", "dispute_litigation", "employment_matter"].map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
                </select>
              </Field>
              <Field label="Contact name"><input className="input w-full" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Sara Al-Mansoori" /></Field>
              <Field label="Contact role"><input className="input w-full" value={contactRole} onChange={(e) => setContactRole(e.target.value)} placeholder="General Counsel" /></Field>
            </div>
            <Field label="Contact email"><input type="email" className="input w-full" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="sara@northwind.co" /></Field>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button className="btn-primary" onClick={submit} disabled={busy || !legalName.trim()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><div className="text-caption text-muted mb-1">{label}</div>{children}</label>);
}
