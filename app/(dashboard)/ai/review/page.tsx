import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldAlert, CheckCircle2, AlertTriangle, FileSearch } from "lucide-react";

export default function ReviewPage() {
  const findings = [
    { tone: "danger",  label: "Missing arbitration seat - recommend ADGM Courts", icon: ShieldAlert },
    { tone: "warning", label: "Indemnity cap exceeds firm default (1.5x vs 1x)",  icon: AlertTriangle },
    { tone: "warning", label: "Non-compete duration > KSA enforceable max (12mo)", icon: AlertTriangle },
    { tone: "success", label: "VAT clause matches UAE 5% standard",                icon: CheckCircle2 },
    { tone: "success", label: "Governing law clearly stated (DIFC)",               icon: CheckCircle2 },
  ] as const;
  return (
    <div className="space-y-6">
      <PageHeader title="Review a contract" subtitle="Drop a contract - get a risk score, missing-clauses list, and inline suggestions." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader title="Upload" />
          <CardBody>
            <div className="border-2 border-dashed border-line rounded-xl p-8 text-center">
              <FileSearch className="h-8 w-8 mx-auto text-muted" />
              <div className="mt-3 text-sm font-medium">Drag PDF or DOCX</div>
              <div className="text-xs text-muted mt-1">or browse</div>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Findings - SHA Series A · v7" subtitle="Risk score 62 / 100"
            action={<Badge tone="warning">High risk</Badge>} />
          <CardBody className="space-y-2">
            {findings.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${f.tone === "danger" ? "bg-danger-50" : f.tone === "warning" ? "bg-warning-50" : "bg-success-50"}`}>
                  <Icon className={`h-4 w-4 mt-0.5 ${f.tone === "danger" ? "text-danger" : f.tone === "warning" ? "text-warning" : "text-success"}`} />
                  <div className="text-sm">{f.label}</div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
