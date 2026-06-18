import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Kpi } from "@/components/ui/Kpi";
import { Sparkles, Send, Mail, CheckCircle2, MessageSquare } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listOutreach, outreachFunnel } from "@/lib/data/outreach";
import { ModuleEmpty } from "@/components/ui/ModuleShell";
import { OutreachRowActions } from "./OutreachRowActions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  drafted: "warning", sent: "info", opened: "info", replied: "warning", converted: "success", bounced: "danger", unsubscribed: "neutral",
};

export default async function Page() {
  const session = await getSession();
  const [rows, funnel] = await Promise.all([listOutreach(session), outreachFunnel(session)]);

  if (rows.length === 0) return (
    <ModuleEmpty
      icon={Sparkles}
      title="Outreach"
      subtitle="AI-drafted, partner-reviewable outreach grounded in the firm's depth + voice. Sent via Resend, tracked through opens, replies and conversion to an intake."
      bullets={["Draft from any prospect in /growth/prospects", "Click-to-send via Resend with full audit", "Convert tracked back to the originating outreach via intake.bdOutreachId"]}
      primary={{ label: "Open prospect queue", href: "/growth/prospects" }}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Outreach" subtitle={`${rows.length} touches across the BD pipeline`} />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Drafted"   value={funnel.drafted}   icon={Sparkles}      delta="awaiting review" deltaTone="neutral" />
        <Kpi label="Sent"      value={funnel.sent}      icon={Send}          delta="via Resend"      deltaTone="up" />
        <Kpi label="Opened"    value={funnel.opened}    icon={Mail}          delta="tracking"        deltaTone="neutral" />
        <Kpi label="Replied"   value={funnel.replied}   icon={MessageSquare} delta="warm leads"      deltaTone="up" />
        <Kpi label="Converted" value={funnel.converted} icon={CheckCircle2}  delta="became intakes"  deltaTone="up" />
      </div>

      <Card>
        <CardHeader title="Touches" />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>Prospect</th><th>Subject</th><th>Status</th><th>Sent</th><th>Owner</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.prospectName}</td>
                  <td className="max-w-md truncate text-body-sm">{r.subject ?? "-"}</td>
                  <td><Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge></td>
                  <td className="text-caption text-muted">{r.sentAt ? r.sentAt.toISOString().slice(0, 16).replace("T", " ") : "-"}</td>
                  <td className="text-caption">{r.ownerName ?? "-"}</td>
                  <td><OutreachRowActions id={r.id} status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
