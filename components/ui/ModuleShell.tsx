import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * Generic shell for a domain module that has no rows yet. Replaces the old
 * StubPage marketing copy with an honest empty state - "nothing here yet,
 * here's what this module does, primary action available."
 *
 * Pages with real data fall through to their own list table; this only
 * renders when listX().length === 0.
 */
export function ModuleEmpty({
  icon: Icon,
  title,
  subtitle,
  bullets,
  primary,
  secondary,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  bullets?: string[];
  primary?: { label: string; href?: string };
  secondary?: { label: string; href?: string };
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <CardBody className="flex flex-col items-center text-center py-14">
          <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <div className="text-h2">No records yet</div>
          <p className="text-body-sm text-muted mt-1 max-w-md">{subtitle}</p>
          {bullets && bullets.length > 0 && (
            <ul className="mt-5 space-y-1.5 text-body-sm text-muted text-start max-w-md">
              {bullets.map((b) => <li key={b} className="flex items-start gap-2"><span className="h-1 w-1 rounded-full bg-muted mt-2 shrink-0" /><span>{b}</span></li>)}
            </ul>
          )}
          {(primary || secondary) && (
            <div className="mt-5 flex items-center gap-2">
              {secondary && (secondary.href
                ? <a href={secondary.href} className="btn-secondary btn-sm">{secondary.label}</a>
                : <button className="btn-secondary btn-sm" disabled>{secondary.label}</button>)}
              {primary && (primary.href
                ? <a href={primary.href} className="btn-primary btn-sm">{primary.label}</a>
                : <button className="btn-primary btn-sm" disabled>{primary.label}</button>)}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
