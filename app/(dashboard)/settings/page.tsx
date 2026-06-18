import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Palette, GitBranch, Zap, Lock, Users, Globe, ShieldCheck, Plug, CreditCard } from "lucide-react";

const tiles = [
  { href: "/settings/account",     title: "Account & billing",    icon: CreditCard, sub: "Plan, payment method, invoices, usage. Upgrade / downgrade / cancel." },
  { href: "/settings/members",     title: "Members & invites",    icon: Users,      sub: "Lawyers, helpers, roles, supervision, rates." },
  { href: "/settings/branding",    title: "White-label & brand",  icon: Palette,    sub: "Custom domain, logo, colours, sender identity." },
  { href: "/settings/routing",     title: "Intake routing",       icon: GitBranch,  sub: "Rules + lawyer expertise registry." },
  { href: "/settings/automations", title: "Automations",          icon: Zap,        sub: "Welcome emails, engagement letters, reminders, dunning." },
  { href: "/gdpr",                 title: "Data & privacy",       icon: Lock,       sub: "GDPR, UAE PDPL, KSA PDPL, DSRs, RoPA." },
  { href: "#",                     title: "Language & region",    icon: Globe,      sub: "EN / AR, default region, calendar." },
  { href: "#",                     title: "Security",             icon: ShieldCheck,sub: "SSO (SAML/OIDC), MFA, IP allow-list." },
  { href: "#",                     title: "Integrations",         icon: Plug,       sub: "DocuSign, Zoho, QuickBooks, ZATCA, Notion, Slack." },
];

export default function SettingsHub() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure your workspace." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.title} href={t.href}>
              <Card className="p-5 hover:border-royal transition cursor-pointer">
                <Icon className="h-5 w-5 text-royal" />
                <div className="font-semibold mt-3">{t.title}</div>
                <div className="text-xs text-muted mt-1">{t.sub}</div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
