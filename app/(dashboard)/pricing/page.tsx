import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listPlans, getSubscription } from "@/lib/data/billing";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default async function PricingPage() {
  const session = await getSession();
  const [plans, sub] = await Promise.all([listPlans(), getSubscription(session)]);

  if (plans.length === 0) return (
    <ModuleEmpty
      icon={Tag}
      title="Pricing & plans"
      subtitle="Pricing tiers backing the firm's subscription. Switching plans is one click and audited."
      bullets={["Solo · small · mid · enterprise tiers", "Stripe webhook updates seatsInUse on every membership change", "Usage credits and white-label setup land as usage_meters rows"]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Pricing & plans" subtitle="Choose the plan that fits how your firm grows." />
      <Card>
        <CardHeader title="Plans" subtitle={sub ? `Current plan: ${sub.planName} · ${sub.planTier}` : "No active subscription."} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const current = sub?.planId === p.id;
              return (
                <div key={p.id} className={`card p-5 ${current ? "border-primary-500 bg-primary-50/40" : ""}`}>
                  <div className="flex items-baseline justify-between">
                    <div className="text-h3">{p.name}</div>
                    <Badge tone="neutral">{p.tier}</Badge>
                  </div>
                  <div className="text-display tabular-nums mt-3">${p.monthlyPriceUsd}<span className="text-body-sm text-muted">/mo</span></div>
                  <div className="text-caption text-muted mt-1">{p.seats} seats included</div>
                  {current && <div className="text-caption text-primary-700 font-medium mt-3">Your current plan - manage from <a href="/billing" className="underline">billing</a>.</div>}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
