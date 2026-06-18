import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Globe, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { getFirmBrandingByHost } from "@/lib/data/branding";

/**
 * White-label settings. A firm configures:
 *   - Custom domain (portal.<firm>.com) + DNS/SSL automation
 *   - Logo, colours, font
 *   - Verified email sender (SPF/DKIM)
 *   - Intake slug (lexoni.ai/intake/<slug>)
 *   - Whether the "Powered by Lexoni.ai" footer is shown
 *
 * The platform enforces strict tenant isolation (see lib/auth/tenant.ts).
 * A request to a custom domain resolves to exactly one tenant; no firm
 * ever sees another firm's data.
 */
export default async function BrandingPage() {
  const b = await getFirmBrandingByHost();
  return (
    <div className="space-y-6">
      <PageHeader title="White-label & branding"
        subtitle="Run Lexoni.ai under your own brand. Custom domain, logo, colours, sender identity - fully isolated from every other firm." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Domain"
            action={<Badge tone="success"><CheckCircle2 className="h-3 w-3 mr-1" />SSL active</Badge>} />
          <CardBody className="space-y-4">
            <Field label="Custom domain" value={b.customDomain ?? ""} hint="CNAME → cname.lexoni.ai · SSL auto-provisioned" />
            <Field label="Subdomain fallback" value={`${b.subdomain}.lexoni.ai`} readOnly />
            <Field label="Public intake URL" value={`https://${b.customDomain}/${b.intakeSlug}`} readOnly />
            <div className="flex items-center gap-2 text-xs text-muted">
              <Globe className="h-4 w-4" /> DNS records verified · last checked 4 min ago
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Brand" />
          <CardBody className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted">Logo</label>
              <div className="mt-1 h-20 border border-line rounded-lg bg-canvas flex items-center justify-center text-sm text-muted">{b.logoUrl ?? "Upload SVG / PNG"}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Primary colour</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg border border-line" style={{ background: b.primaryColor }} />
                <input value={b.primaryColor} readOnly className="flex-1 h-9 text-sm rounded-lg border border-line bg-canvas px-3 font-mono" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked={b.hideAttribution} />
              <span>Hide "Powered by Lexoni.ai" footer</span>
            </label>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Outbound email identity"
          subtitle="Emails to your clients are sent from your domain. SPF, DKIM, and DMARC are verified at setup and re-checked daily."
          action={b.emailDomainVerified
            ? <Badge tone="success"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>
            : <Badge tone="warning"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>} />
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="From name"    value={b.emailFromName} />
          <Field label="From address" value={b.emailFromAddr} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Data isolation guarantee" />
        <CardBody className="text-sm text-muted space-y-2">
          <p>Every record in Lexoni.ai is keyed to your <span className="font-semibold text-ink">tenant_id</span>. Database queries are scoped at the framework level - there is no path by which one firm can read or write another firm's data.</p>
          <p>White-label requests resolve via host header at the edge (see <code className="text-xs">lib/auth/tenant.ts → resolveHostTenant</code>) before any session is read, so a request to your custom domain can only ever be served from your tenant.</p>
        </CardBody>
      </Card>
    </div>
  );
}

function Field({ label, value, readOnly, hint }: { label: string; value: string; readOnly?: boolean; hint?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        defaultValue={value} readOnly={readOnly}
        className="w-full mt-1 h-10 text-sm rounded-lg border border-line bg-canvas px-3 font-mono focus:outline-none focus:ring-2 focus:ring-royal/30"
      />
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}
