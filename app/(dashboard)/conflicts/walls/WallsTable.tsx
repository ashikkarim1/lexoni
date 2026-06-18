"use client";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/Table";
import type { WallSummary } from "@/lib/data/walls";
import { t, type Locale } from "@/lib/i18n";

export function WallsTable({ locale, rows }: { locale: Locale; rows: WallSummary[] }) {
  const columns: Column<WallSummary>[] = [
    { key: "name", header: t(locale, "conflicts.walls.colName"), sortable: true, value: (w) => w.name, cell: (w) => <span className="font-medium">{w.name}</span> },
    { key: "reason", header: t(locale, "conflicts.walls.colReason"), cell: (w) => <span className="text-caption text-muted line-clamp-2 max-w-md inline-block">{w.reason ?? "-"}</span> },
    { key: "members", header: t(locale, "conflicts.walls.colMembers"), sortable: true, value: (w) => w.members, align: "end", cell: (w) => <span className="tabular-nums">{w.members}</span> },
    { key: "matters", header: t(locale, "conflicts.walls.colMatters"), sortable: true, value: (w) => w.matters, align: "end", cell: (w) => <span className="tabular-nums">{w.matters}</span> },
    { key: "created", header: t(locale, "conflicts.walls.colCreated"), sortable: true, value: (w) => w.createdAt.getTime(), cell: (w) => <span className="text-caption text-muted">{w.createdAt.toISOString().slice(0, 10)}</span> },
    { key: "status", header: t(locale, "conflicts.walls.colStatus"), cell: (w) => w.closedAt
      ? <Badge tone="neutral">{t(locale, "conflicts.walls.closed")}</Badge>
      : <Badge tone="success">{t(locale, "conflicts.walls.active")}</Badge> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      searchable
      searchPlaceholder={t(locale, "conflicts.walls.colName")}
      empty={{ title: t(locale, "conflicts.walls.noWalls"), body: t(locale, "conflicts.walls.subtitle") }}
    />
  );
}
