import { PageHeader } from "@/components/ui/PageHeader";
import { Kpi } from "@/components/ui/Kpi";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users, UserPlus, ShieldCheck, Inbox, UserMinus, UserCheck } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listMembers, listInvites, memberCounters } from "@/lib/data/members";
import { t } from "@/lib/i18n";
import { InviteButton } from "./InviteButton";
import { MemberRowActions } from "./MemberRowActions";
import { InviteRowActions } from "./InviteRowActions";

const ROLE_TONE: Record<string, "info" | "warning" | "danger" | "neutral" | "success"> = {
  firm_admin:     "info",
  lawyer:         "success",
  lawyer_helper:  "neutral",
  client_admin:   "info",
  client_member:  "neutral",
  client_viewer:  "neutral",
  platform_admin: "danger",
};

export default async function MembersPage() {
  const session = await getSession();
  const locale = session.locale;
  const [members, invites, counters] = await Promise.all([
    listMembers(session),
    listInvites(session),
    memberCounters(session),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "members.eyebrow")}
        title={t(locale, "members.title")}
        subtitle={t(locale, "members.subtitle")}
        actions={<InviteButton locale={locale} members={members.map((m) => ({ id: m.userId, name: m.fullName }))} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label={t(locale, "members.kpi.total")}    value={counters.total}     icon={Users}        delta={t(locale, "members.kpi.totalDelta", { n: counters.partners })} deltaTone="neutral" />
        <Kpi label={t(locale, "members.kpi.lawyers")}  value={counters.lawyers}   icon={UserCheck}    delta={t(locale, "members.kpi.lawyersDelta")} deltaTone="up" />
        <Kpi label={t(locale, "members.kpi.helpers")}  value={counters.helpers}   icon={UserCheck}    delta={t(locale, "members.kpi.helpersDelta")} deltaTone="neutral" />
        <Kpi label={t(locale, "members.kpi.invites")}  value={counters.pendingInvites} icon={Inbox}   delta={t(locale, "members.kpi.invitesDelta")} deltaTone={counters.pendingInvites ? "neutral" : "up"} />
        <Kpi label={t(locale, "members.kpi.inactive")} value={counters.inactive}  icon={UserMinus}    delta={t(locale, "members.kpi.inactiveDelta")} deltaTone="neutral" />
      </div>

      <Card>
        <CardHeader title={t(locale, "members.list.title")} subtitle={t(locale, "members.list.subtitle")} />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "members.list.colMember")}</th>
                <th>{t(locale, "members.list.colRole")}</th>
                <th>{t(locale, "members.list.colSupervises")}</th>
                <th>{t(locale, "members.list.colRate")}</th>
                <th>{t(locale, "members.list.colSecurity")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.membershipId} className={!m.active ? "opacity-50" : undefined}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-caption font-semibold shrink-0">
                        {m.fullName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{m.fullName}</div>
                        <div className="text-caption text-muted truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={ROLE_TONE[m.role]}>{t(locale, `members.role.${m.role}`)}</Badge>
                    {!m.active && <Badge tone="neutral" className="ms-1">{t(locale, "members.list.inactive")}</Badge>}
                  </td>
                  <td className="text-caption text-muted">{m.reportsToName ?? "-"}</td>
                  <td className="text-body-sm tabular-nums">
                    {m.hourlyRateCents ? `$${(m.hourlyRateCents / 100).toLocaleString()}/h` : "-"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {m.mfaEnabled
                        ? <Badge tone="success"><ShieldCheck className="h-3 w-3" />{t(locale, "members.list.mfaOn")}</Badge>
                        : <Badge tone="warning">{t(locale, "members.list.mfaOff")}</Badge>}
                    </div>
                  </td>
                  <td className="text-end">
                    <MemberRowActions locale={locale} membershipId={m.membershipId} role={m.role} active={m.active} />
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={6} className="text-center text-body-sm text-muted py-8">{t(locale, "members.list.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t(locale, "members.invites.title")}
          subtitle={t(locale, "members.invites.subtitle")}
          action={<Badge tone="info"><UserPlus className="h-3 w-3" /> {t(locale, "members.invites.title")}</Badge>}
        />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "members.invites.colEmail")}</th>
                <th>{t(locale, "members.invites.colRole")}</th>
                <th>{t(locale, "members.invites.colInvitedBy")}</th>
                <th>{t(locale, "members.invites.colStatus")}</th>
                <th>{t(locale, "members.invites.colExpires")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invites.map((iv) => (
                <tr key={iv.id}>
                  <td>
                    <div className="font-medium">{iv.email}</div>
                    {iv.fullName && <div className="text-caption text-muted">{iv.fullName}</div>}
                  </td>
                  <td><Badge tone={ROLE_TONE[iv.role]}>{t(locale, `members.role.${iv.role}`)}</Badge></td>
                  <td className="text-body-sm">{iv.invitedByName ?? "-"}</td>
                  <td>
                    <Badge tone={iv.status === "pending" ? "warning" : iv.status === "accepted" ? "success" : "neutral"}>
                      {t(locale, `members.invites.status.${iv.status}`)}
                    </Badge>
                  </td>
                  <td className="text-caption text-muted">{iv.expiresAt.toISOString().slice(0, 10)}</td>
                  <td className="text-end">
                    {iv.status === "pending" && <InviteRowActions locale={locale} id={iv.id} />}
                  </td>
                </tr>
              ))}
              {invites.length === 0 && (
                <tr><td colSpan={6} className="text-center text-body-sm text-muted py-8">{t(locale, "members.invites.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
