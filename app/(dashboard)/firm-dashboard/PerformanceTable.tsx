"use client";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/Table";
import { PROMOTION_BAND_TONE } from "@/lib/ui/statuses";
import { t, type Locale } from "@/lib/i18n";

type Row = {
  id: string;
  name: string;
  role: string;
  billableHoursMTD: number;
  targetHoursMTD: number;
  realisationPct: number;
  utilisationPct: number;
  mattersClosedYTD: number;
  onTimeMilestonePct: number;
  promotionBand: string;
  promotionScore: number;
};

export function PerformanceTable({ locale, rows }: { locale: Locale; rows: Row[] }) {
  const cols: Column<Row>[] = [
    { key: "n", header: t(locale, "firmpulse.colLawyer"),    sortable: true, value: (r) => r.name,
      cell: (r) => <div><div className="font-medium">{r.name}</div><div className="text-caption text-muted">{r.role}</div></div> },
    { key: "h", header: t(locale, "firmpulse.colBillable"),  sortable: true, value: (r) => r.billableHoursMTD, align: "end",
      cell: (r) => <span className="tabular-nums">{r.billableHoursMTD}/{r.targetHoursMTD}h</span> },
    { key: "r", header: t(locale, "firmpulse.colRealisation"), sortable: true, value: (r) => r.realisationPct, align: "end",
      cell: (r) => `${r.realisationPct}%` },
    { key: "u", header: t(locale, "firmpulse.colUtilisation"), sortable: true, value: (r) => r.utilisationPct, align: "end",
      cell: (r) => `${r.utilisationPct}%` },
    { key: "c", header: t(locale, "firmpulse.colClosedYtd"),  sortable: true, value: (r) => r.mattersClosedYTD, align: "end",
      cell: (r) => <span className="tabular-nums">{r.mattersClosedYTD}</span> },
    { key: "m", header: t(locale, "firmpulse.colOnTime"),     sortable: true, value: (r) => r.onTimeMilestonePct, align: "end",
      cell: (r) => `${r.onTimeMilestonePct}%` },
    { key: "p", header: t(locale, "firmpulse.colPromotion"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Badge tone={PROMOTION_BAND_TONE[r.promotionBand] ?? "neutral"}>{r.promotionBand.replace(/_/g, " ")}</Badge>
          {r.promotionScore > 0 && <span className="text-caption text-muted tabular-nums">{r.promotionScore}</span>}
        </div>
      ) },
  ];

  return <DataTable columns={cols} rows={rows} initialSort={{ key: "h", dir: "desc" }} />;
}
