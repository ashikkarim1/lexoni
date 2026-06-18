"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, Sparkles } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

type Matter = { id: string; title: string };

export function InboxDropzone({ matters }: { matters: Matter[] }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  async function upload(files: FileList | File[]) {
    setBusy(true);
    let auto = 0, queued = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/documents/inbox", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(`${file.name}: ${err.error ?? "Upload failed"}`);
        continue;
      }
      const json = await res.json();
      if (json.filed) auto++; else queued++;
    }
    setBusy(false);
    if (auto > 0 || queued > 0) {
      toast.success(`Done · ${auto} auto-filed, ${queued} queued for triage.`);
      router.refresh();
    }
  }

  const hint = matters.length === 0
    ? "Open a matter first so the classifier has somewhere to file."
    : `${matters.length} matters available to the classifier.`;

  return (
    <Card className={drag ? "border-primary-500 bg-primary-50/30" : undefined}>
      <CardBody>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}
          className="flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">Drop documents anywhere on this page</div>
            <div className="text-caption text-muted flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> {hint}</div>
          </div>
          <button
            className="btn-primary btn-sm"
            disabled={busy || matters.length === 0}
            onClick={() => input.current?.click()}
          >
            {busy ? "Uploading…" : "Choose file"}
          </button>
          <input
            ref={input}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ""; }}
          />
        </div>
      </CardBody>
    </Card>
  );
}
