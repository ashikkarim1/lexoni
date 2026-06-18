"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";

export function PrecedentFilters({
  facets,
  active,
}: {
  facets: { kinds: string[]; jurisdictions: string[] };
  active: { q?: string; kind?: string; jurisdiction?: string; approvedOnly?: boolean };
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.push(`/precedents?${next.toString()}`);
  }

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            className="input input-sm ps-8 w-full"
            placeholder="Search title or body…"
            defaultValue={active.q ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value });
            }}
          />
        </div>
        <select className="select select-sm" value={active.kind ?? ""} onChange={(e) => update({ kind: e.target.value || undefined })}>
          <option value="">All kinds</option>
          {facets.kinds.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="select select-sm" value={active.jurisdiction ?? ""} onChange={(e) => update({ jurisdiction: e.target.value || undefined })}>
          <option value="">All jurisdictions</option>
          {facets.jurisdictions.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-caption text-muted">
          <input
            type="checkbox"
            checked={active.approvedOnly ?? false}
            onChange={(e) => update({ approved: e.target.checked ? "1" : undefined })}
          />
          Approved only
        </label>
      </CardBody>
    </Card>
  );
}
