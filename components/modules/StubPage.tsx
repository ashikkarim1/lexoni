import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CheckCircle2 } from "lucide-react";

export function StubPage({
  title, subtitle, bullets, actions,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <Card>
        <CardHeader title="In this module" />
        <CardBody>
          <ul className="space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-royal mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
