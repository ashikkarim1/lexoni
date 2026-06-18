import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Empty-state primitive - used on every list / table / dashboard when there
 * is no data. Treat "empty" as a teaching moment: icon, headline, body,
 * primary CTA. Never leave a table showing a dash.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  primary,
  secondary,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  primary?: { label: string; onClick?: () => void; href?: string };
  secondary?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center px-6 py-12", className)}>
      <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="text-h3">{title}</div>
      {body && <p className="text-body-sm text-muted mt-1 max-w-md">{body}</p>}
      {(primary || secondary) && (
        <div className="flex items-center gap-2 mt-4">
          {secondary && (
            secondary.href
              ? <a href={secondary.href} className="btn-secondary btn-sm">{secondary.label}</a>
              : <button onClick={secondary.onClick} className="btn-secondary btn-sm">{secondary.label}</button>
          )}
          {primary && (
            primary.href
              ? <a href={primary.href} className="btn-primary btn-sm">{primary.label}</a>
              : <button onClick={primary.onClick} className="btn-primary btn-sm">{primary.label}</button>
          )}
        </div>
      )}
    </div>
  );
}
