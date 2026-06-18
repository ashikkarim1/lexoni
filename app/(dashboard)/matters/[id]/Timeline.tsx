"use client";
import { useState } from "react";
import { FileText, Mail, ListChecks, FileSignature, Activity } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type Entry = {
  id: string;
  at: string;
  kind: "document" | "email" | "slot" | "signature" | "audit";
  title: string;
  subtitle: string | null;
  actor: string | null;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

const KIND_LABEL: Record<Entry["kind"], string> = {
  document: "Docs", email: "Emails", slot: "Slots", signature: "Signatures", audit: "Other",
};
const KIND_ICON = { document: FileText, email: Mail, slot: ListChecks, signature: FileSignature, audit: Activity } as const;

export function Timeline({ entries: serialised }: { entries: Array<Omit<Entry, "at"> & { at: string | Date }> }) {
  const entries: Entry[] = serialised.map((e) => ({ ...e, at: typeof e.at === "string" ? e.at : e.at.toISOString() }));
  const [filter, setFilter] = useState<"all" | Entry["kind"]>("all");
  const filtered = filter === "all" ? entries : entries.filter((e) => e.kind === filter);

  if (entries.length === 0) {
    return <div className="text-caption text-muted py-10 text-center">No activity yet on this matter.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>All · {entries.length}</Chip>
        {(["document", "email", "slot", "signature"] as const).map((k) => {
          const n = entries.filter((e) => e.kind === k).length;
          if (n === 0) return null;
          return <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{KIND_LABEL[k]} · {n}</Chip>;
        })}
      </div>

      <ul className="relative ps-5 border-s border-line space-y-3">
        {filtered.map((e) => {
          const Icon = KIND_ICON[e.kind];
          return (
            <li key={e.id} className="relative">
              <span className="absolute -start-[1.625rem] top-1.5 h-3 w-3 rounded-full bg-white border-2 border-line" />
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-md bg-canvas text-muted flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-medium text-body-sm truncate">{e.title}</div>
                    <div className="text-caption text-muted tabular-nums shrink-0">
                      {new Date(e.at).toISOString().slice(0, 16).replace("T", " ")}
                    </div>
                  </div>
                  {e.subtitle && <div className="text-caption text-muted truncate">{e.subtitle}</div>}
                  <div className="text-caption text-muted flex items-center gap-2 mt-0.5">
                    {e.actor && <span>by {e.actor}</span>}
                    <Badge tone={e.tone}>{e.kind}</Badge>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-caption px-2.5 py-1 rounded-md border ${active ? "bg-primary-100 text-primary-700 border-primary-200" : "border-line text-muted hover:bg-canvas"}`}
    >{children}</button>
  );
}
