import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Form";
import { getSession } from "@/lib/auth/session-server";
import { accessFilterFacets, listAccess, type AccessAction } from "@/lib/data/access";
import { t } from "@/lib/i18n";
import { AccessLogTable } from "./AccessLogTable";

export default async function AccessLogPage({
  searchParams,
}: {
  searchParams: { userId?: string; caseId?: string; action?: string };
}) {
  const session = await getSession();
  const locale = session.locale;

  const filter = {
    userId: searchParams.userId || undefined,
    caseId: searchParams.caseId || undefined,
    action: (searchParams.action as AccessAction | undefined) || undefined,
  };
  const [facets, rows] = await Promise.all([
    accessFilterFacets(session),
    listAccess(session, filter),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.accessLog")}
        title={t(locale, "conflicts.accessLog.title")}
        subtitle={t(locale, "conflicts.accessLog.subtitle")}
      />

      <Card>
        <CardHeader title={t(locale, "common.filter")} />
        <CardBody>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end" method="GET">
            <Field label={t(locale, "conflicts.accessLog.filterUser")}>
              <Select name="userId" defaultValue={filter.userId ?? ""}>
                <option value="">{t(locale, "common.anyone")}</option>
                {facets.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Field label={t(locale, "conflicts.accessLog.filterMatter")}>
              <Select name="caseId" defaultValue={filter.caseId ?? ""}>
                <option value="">{t(locale, "common.anyMatter")}</option>
                {facets.matters.map((m) => <option key={m.id} value={m.id}>{m.matterNumber} - {m.title}</option>)}
              </Select>
            </Field>
            <Field label={t(locale, "conflicts.accessLog.filterAction")}>
              <Select name="action" defaultValue={filter.action ?? ""}>
                <option value="">{t(locale, "common.anyAction")}</option>
                {facets.actions.map((a) => (
                  <option key={a} value={a}>{t(locale, `conflicts.accessLog.actions.${a}`)}</option>
                ))}
              </Select>
            </Field>
            <button type="submit" className="btn-primary">{t(locale, "common.filter")}</button>
          </form>
        </CardBody>
      </Card>

      <AccessLogTable locale={locale} rows={rows} />
    </div>
  );
}
