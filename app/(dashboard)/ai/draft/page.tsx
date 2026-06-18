import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles } from "lucide-react";

export default function DraftPage() {
  const templates = [
    { kind: "NDA",          uses: 1_240, region: "GLOBAL" },
    { kind: "SHA",          uses: 412,   region: "UAE" },
    { kind: "SPA",          uses: 286,   region: "UAE" },
    { kind: "Employment",   uses: 921,   region: "UAE" },
    { kind: "Distribution", uses: 168,   region: "KSA" },
    { kind: "JV",           uses: 73,    region: "KSA" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Draft a contract" subtitle="Region-aware AI - picks the most-used templates and clauses for your jurisdiction." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader title="Region context" subtitle="Tailored to UAE practice." />
          <CardBody className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Governing law</span><span className="font-medium">ADGM</span></div>
            <div className="flex justify-between"><span>Dispute forum</span><span className="font-medium">ADGM Courts</span></div>
            <div className="flex justify-between"><span>Language</span><span className="font-medium">EN + AR</span></div>
            <div className="flex justify-between"><span>VAT clause</span><span className="font-medium">5% UAE</span></div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Most-used templates in UAE" subtitle="Ranked by your firm's usage in the last 90 days." />
          <CardBody className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {templates.map((t) => (
              <button key={t.kind} className="card p-4 text-left hover:border-royal transition">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.kind}</div>
                  <Sparkles className="h-4 w-4 text-royal" />
                </div>
                <div className="text-xs text-muted mt-1">{t.uses.toLocaleString()} drafts · {t.region}</div>
                <div className="mt-3"><Badge tone="info">{t.region}</Badge></div>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Compose with AI" subtitle="Describe what you need - clause library + region context auto-applied." />
        <CardBody>
          <textarea
            rows={6}
            placeholder="e.g. 5-year exclusive distribution agreement for FMCG in KSA. Counterparty: Carrefour KSA. Sharia-compliant payment terms. Include force majeure for sanctions."
            className="w-full text-sm rounded-lg border border-line bg-canvas p-3 focus:outline-none focus:ring-2 focus:ring-royal/30"
          />
          <div className="flex justify-end mt-3"><button className="btn-primary text-sm"><Sparkles className="h-4 w-4" /> Generate draft</button></div>
        </CardBody>
      </Card>
    </div>
  );
}
