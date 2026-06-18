"use client";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/Table";
import type { ConflictRow } from "@/lib/data/conflicts";
import { CONFLICT_OUTCOME_TONE } from "@/lib/ui/statuses";
import { t, type Locale } from "@/lib/i18n";

export function ConflictsTable({ locale, rows }: { locale: Locale; rows: ConflictRow[] }) {
  const columns: Column<ConflictRow>[] = [
    {
      key: "subject",
      header: t(locale, "conflicts.colSubject"),
      sortable: true,
      value: (r) => r.subjectName,
      cell: (r) => <span className="font-medium">{r.subjectName}</span>,
    },
    {
      key: "adverse",
      header: t(locale, "conflicts.colAdverse"),
      cell: (r) => <span className="text-caption text-muted">{(r.adverseParties ?? []).join(", ") || "-"}</span>,
    },
    {
      key: "outcome",
      header: t(locale, "conflicts.colOutcome"),
      sortable: true,
      value: (r) => r.outcome,
      cell: (r) => <Badge tone={CONFLICT_OUTCOME_TONE[r.outcome]}>{t(locale, `conflicts.outcome.${r.outcome}`)}</Badge>,
    },
    {
      key: "matches",
      header: t(locale, "conflicts.colMatches"),
      cell: (r) => r.matches.length === 0 ? (
        <span className="text-caption text-muted">{t(locale, "conflicts.noMatches")}</span>
      ) : (
        <ul className="text-caption space-y-0.5">
          {r.matches.map((m, i) => (
            <li key={i}>
              <span className="font-medium">{t(locale, `conflicts.match.${m.kind}`)}</span>
              <span className="text-muted"> - {m.party} · {m.via}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "when",
      header: t(locale, "conflicts.colWhen"),
      sortable: true,
      value: (r) => r.checkedAt.getTime(),
      align: "end",
      cell: (r) => <span className="text-caption text-muted whitespace-nowrap">{r.checkedAt.toISOString().slice(0, 10)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      searchable
      searchPlaceholder={t(locale, "conflicts.colSubject")}
      initialSort={{ key: "when", dir: "desc" }}
      empty={{ title: t(locale, "conflicts.listTitle"), body: t(locale, "conflicts.subtitle") }}
    />
  );
}
