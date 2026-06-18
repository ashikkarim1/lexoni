import type { ReactNode } from "react";

/**
 * Page header - every dashboard page composes this. Title is `text-h1`,
 * subtitle is muted body. Actions sit end-aligned. RTL flips automatically.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && <div className="sec-title mb-1.5">{eyebrow}</div>}
        <h1 className="text-h1">{title}</h1>
        {subtitle && <p className="text-body-sm text-muted mt-1 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
