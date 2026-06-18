"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Radar } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Update = { id: string; title: string; regulator: string; region: string; status: string };

export function ChangesActions({ updates, mode }: { updates: Update[]; mode: "empty" | "standard" }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [regulator, setRegulator] = useState("ADGM FSRA");
  const [region, setRegion] = useState<"UAE" | "KSA" | "QAT" | "BHR" | "KWT" | "OMN" | "GLOBAL">("UAE");
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState<"info" | "low" | "medium" | "high" | "critical">("medium");
  const [deadlineDays, setDeadlineDays] = useState<number>(90);

  async function ingest() {
    setBusy("ingest");
    const res = await fetch("/api/regulatory/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title, regulator, region, summary,
        publishedAt: new Date().toISOString(),
        severity,
        extractedJson: deadlineDays > 0 ? { deadlineDays } : undefined,
      }),
    });
    setBusy(null);
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    toast.success("Update ingested.");
    setOpen(false);
    setTitle(""); setSummary("");
    router.refresh();
  }

  async function assess(id: string) {
    setBusy(id);
    const res = await fetch("/api/regulatory/assess", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ updateId: id }),
    });
    setBusy(null);
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error ?? "Failed"); return; }
    toast.success("Impact assessed.");
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader title="Ingest + assess" subtitle="Paste a regulator update or run an assessment on a queued one." />
        <CardBody className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary-600" />
            <span className="text-body-sm">{mode === "empty" ? "Start by ingesting a regulator update." : `${updates.length} updates in queue.`}</span>
          </div>
          <div className="flex items-center gap-2">
            {updates.filter((u) => u.status !== "assessed").slice(0, 3).map((u) => (
              <button key={u.id} className="btn-secondary btn-sm" onClick={() => assess(u.id)} disabled={busy === u.id}>
                {busy === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Assess: {u.regulator}
              </button>
            ))}
            <button className="btn-primary btn-sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Ingest update
            </button>
          </div>
        </CardBody>
      </Card>

      {open && (
        <Modal open={open} title="Ingest a regulator update" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Title"><input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New AML Rules - Crypto Service Providers" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Regulator">
                <select className="select w-full" value={regulator} onChange={(e) => setRegulator(e.target.value)}>
                  {["ADGM FSRA", "DFSA", "ADX", "Nasdaq Dubai", "SCA (UAE)", "CMA (KSA)", "Tadawul", "ZATCA", "UAE Federal Gazette", "Umm Al-Qura (KSA)"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Region">
                <select className="select w-full" value={region} onChange={(e) => setRegion(e.target.value as typeof region)}>
                  {["UAE", "KSA", "QAT", "BHR", "KWT", "OMN", "GLOBAL"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Severity">
                <select className="select w-full" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
                  {["info", "low", "medium", "high", "critical"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Deadline (days)">
                <input type="number" className="input w-full" value={deadlineDays} onChange={(e) => setDeadlineDays(Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Summary">
              <textarea className="textarea w-full" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One-paragraph summary of the change…" />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setOpen(false)} disabled={busy === "ingest"}>Cancel</button>
              <button className="btn-primary" onClick={ingest} disabled={busy === "ingest" || !title.trim()}>
                {busy === "ingest" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Ingest
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-caption text-muted mb-1">{label}</div>
      {children}
    </label>
  );
}
