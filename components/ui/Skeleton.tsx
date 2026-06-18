import { cn } from "@/lib/utils/cn";

/** Single-element shimmer skeleton. Compose for list rows / tables / cards. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} aria-hidden="true" />;
}

/** Table-row skeleton - usable inside any DataTable while data loads. */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3 border-b border-line/70">
          <Skeleton className="h-3.5 w-24" />
        </td>
      ))}
    </tr>
  );
}

/** Card / KPI skeleton - full block placeholder. */
export function SkeletonBlock({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("card p-4 space-y-2", className)} aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}
