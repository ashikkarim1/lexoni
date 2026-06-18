"use client";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/Table";
import type { AccessRow } from "@/lib/data/access";
import { ACCESS_ACTION_TONE } from "@/lib/ui/statuses";
import { Eye, Download, FileOutput, Printer } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

const ACTION_ICON: Record<string, typeof Eye> = {
  view: Eye, download: Download, export: FileOutput, print: Printer,
};

export function AccessLogTable({ locale, rows }: { locale: Locale; rows: AccessRow[] }) {
  const columns: Column<AccessRow>[] = [
    { key: "when",   header: t(locale, "conflicts.accessLog.colWhen"), sortable: true, value: (r) => r.occurredAt.getTime(),
      cell: (r) => <span className="text-caption text-muted whitespace-nowrap">{r.occurredAt.toISOString().slice(0, 16).replace("T", " ")}</span> },
    { key: "who",    header: t(locale, "conflicts.accessLog.colWho"), sortable: true, value: (r) => r.userName,
      cell: (r) => <span className="font-medium">{r.userName}</span> },
    { key: "action", header: t(locale, "conflicts.accessLog.colAction"), sortable: true, value: (r) => r.action,
      cell: (r) => {
        const Icon = ACTION_ICON[r.action] ?? Eye;
        return <Badge tone={ACCESS_ACTION_TONE[r.action] ?? "neutral"}><Icon className="h-3 w-3" aria-hidden /> {t(locale, `conflicts.accessLog.actions.${r.action}`)}</Badge>;
      } },
    { key: "entity", header: t(locale, "conflicts.accessLog.colEntity"),
      cell: (r) => <span className="text-caption text-muted">{r.entityKind}</span> },
    { key: "matter", header: t(locale, "conflicts.accessLog.colMatter"),
      cell: (r) => r.matterNumber ? (
        <>
          <div className="text-body-sm font-medium">{r.matterTitle}</div>
          <div className="text-caption text-muted">#{r.matterNumber}</div>
        </>
      ) : <span className="text-caption text-muted">-</span> },
    { key: "reason", header: t(locale, "conflicts.accessLog.colReason"),
      cell: (r) => <span className="text-caption">{r.exportReason ?? <span className="text-muted">-</span>}</span> },
    { key: "ip", header: t(locale, "conflicts.accessLog.colIp"), align: "end",
      cell: (r) => <span className="text-caption text-muted font-mono">{r.ipAddress ?? "-"}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      searchable
      searchPlaceholder={t(locale, "conflicts.accessLog.colWho")}
      initialSort={{ key: "when", dir: "desc" }}
      empty={{ title: t(locale, "conflicts.accessLog.empty") }}
    />
  );
}
