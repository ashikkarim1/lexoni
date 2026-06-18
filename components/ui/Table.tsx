"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Search, Filter as FilterIcon, Inbox, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Skeleton, SkeletonRow } from "./Skeleton";
import { EmptyState } from "./EmptyState";

/**
 * DataTable v2 - the enterprise-grade table primitive.
 *
 * Supports:
 *   • Search (`searchable`)
 *   • Sortable columns (`sortable: true` on a column)
 *   • Right-aligned columns (`align: "end"`)
 *   • Bulk select with action toolbar (`bulkActions`)
 *   • Custom toolbar slot (`toolbar`)
 *   • Export hook (`onExport`)
 *   • Loading skeleton (`loading`)
 *   • Empty state (`empty: { title, body, action }`)
 *   • Pagination (`pageSize` defaults to 25)
 *   • Sticky header
 *
 * Pages should compose this - never raw <table className="tbl"> from now on.
 */

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
  sortable?: boolean;
  /** Value used for sorting/search; defaults to the cell text content. */
  value?: (row: T) => string | number;
};

export type BulkAction<T> = {
  label: string;
  onRun: (rows: T[]) => void;
  destructive?: boolean;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  searchable = false,
  searchPlaceholder = "Search…",
  toolbar,
  bulkActions,
  loading = false,
  onExport,
  empty,
  pageSize = 25,
  initialSort,
  rowHref,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  bulkActions?: BulkAction<T>[];
  loading?: boolean;
  onExport?: () => void;
  empty?: { title: string; body?: string; action?: { label: string; href?: string; onClick?: () => void } };
  pageSize?: number;
  initialSort?: { key: string; dir: "asc" | "desc" };
  rowHref?: (row: T) => string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Search
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const term = q.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = c.value ? String(c.value(r)) : String(extractText(c.cell(r)));
        return v.toLowerCase().includes(term);
      }),
    );
  }, [rows, q, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const acc = (r: T) => (col.value ? col.value(r) : extractText(col.cell(r)));
    return [...filtered].sort((a, b) => {
      const av = acc(a); const bv = acc(b);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (sort.dir === "asc" ? 1 : -1);
    });
  }, [filtered, sort, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows  = sorted.slice(page * pageSize, page * pageSize + pageSize);
  const pageStart = sorted.length === 0 ? 0 : page * pageSize + 1;
  const pageEnd   = Math.min(sorted.length, (page + 1) * pageSize);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.id));
      else                   pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);

  const onHeaderClick = (col: Column<T>) => {
    if (!col.sortable) return;
    setSort((prev) => prev?.key === col.key
      ? { key: col.key, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { key: col.key, dir: "asc" });
  };

  const hasBulk = !!bulkActions?.length;

  return (
    <div className={cn("card overflow-hidden flex flex-col", className)}>
      {/* Toolbar */}
      {(searchable || toolbar || onExport) && (
        <div className="flex items-center gap-2 px-4 h-12 border-b border-line bg-neutral-50/50">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" aria-hidden />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="input h-8 ps-8 text-caption"
              />
            </div>
          )}
          {toolbar}
          {onExport && (
            <button onClick={onExport} className="btn-secondary btn-sm ms-auto">
              <Download className="h-3.5 w-3.5" aria-hidden /> Export
            </button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {hasBulk && selectedRows.length > 0 && (
        <div className="flex items-center gap-3 px-4 h-11 bg-primary-50/60 border-b border-primary-100">
          <span className="text-body-sm text-primary-800 font-medium">{selectedRows.length} selected</span>
          <div className="flex items-center gap-2 ms-auto">
            {bulkActions!.map((a) => (
              <button
                key={a.label}
                onClick={() => a.onRun(selectedRows)}
                className={cn("btn-sm", a.destructive ? "btn-danger" : "btn-secondary")}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="tbl" role="table">
          <thead className="sticky top-0 z-10">
            <tr>
              {hasBulk && (
                <th className="w-10 px-4">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    aria-label="Select all on this page"
                    className="h-4 w-4 rounded border-line text-primary-600"
                  />
                </th>
              )}
              {columns.map((c) => {
                const dir = sort?.key === c.key ? sort.dir : null;
                const SortIcon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;
                return (
                  <th
                    key={c.key}
                    className={cn(
                      c.className,
                      c.align === "end" && "text-end",
                      c.align === "center" && "text-center",
                      c.sortable && "cursor-pointer select-none",
                    )}
                    onClick={() => onHeaderClick(c)}
                    aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable && <SortIcon className="h-3 w-3 opacity-60" aria-hidden />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length + (hasBulk ? 1 : 0)} />)
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasBulk ? 1 : 0)}>
                  {empty
                    ? <EmptyState icon={Inbox} title={empty.title} body={empty.body} primary={empty.action} />
                    : <div className="text-center text-body-sm text-muted py-10">No records.</div>}
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr
                  key={r.id}
                  className={cn(rowHref && "cursor-pointer")}
                  onClick={() => { if (rowHref) window.location.href = rowHref(r); }}
                >
                  {hasBulk && (
                    <td className="px-4 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        aria-label={`Select row`}
                        className="h-4 w-4 rounded border-line text-primary-600"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        c.className,
                        c.align === "end" && "text-end",
                        c.align === "center" && "text-center",
                      )}
                    >
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      {!loading && sorted.length > pageSize && (
        <div className="flex items-center gap-3 px-4 h-11 border-t border-line text-caption text-muted">
          <span>{pageStart}–{pageEnd} of {sorted.length}</span>
          <div className="ms-auto flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Extract text from a React node for sort/search comparison. Best-effort. */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (typeof node === "object" && "props" in (node as { props?: { children?: ReactNode } })) {
    return extractText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

// Re-export for callers that still import Skeleton-related pieces from Table.
export { Skeleton };
