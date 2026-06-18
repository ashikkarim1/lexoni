import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listRopa } from "@/lib/data/gdpr";
import { t } from "@/lib/i18n";

export default async function RopaPage() {
  const session = await getSession();
  const locale = session.locale;
  const rows = await listRopa(session);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.gdpr")}
        title={t(locale, "gdpr.ropa.title")}
        subtitle={t(locale, "gdpr.ropa.subtitle")}
        actions={<Link href="/gdpr" className="btn-secondary btn-sm"><ArrowLeft className="h-4 w-4" /> {t(locale, "common.cancel")}</Link>}
      />

      <Card>
        <CardHeader title={t(locale, "gdpr.ropa.title")} subtitle={t(locale, "gdpr.ropa.body")} />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "gdpr.ropa.colName")}</th>
                <th>{t(locale, "gdpr.ropa.colPurpose")}</th>
                <th>{t(locale, "gdpr.ropa.colBasis")}</th>
                <th>{t(locale, "gdpr.ropa.colCategories")}</th>
                <th>{t(locale, "gdpr.ropa.colRetention")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td>
                    <div className="font-medium">{r.name}</div>
                    {r.reviewedAt && <div className="text-caption text-muted">{t(locale, "gdpr.ropa.reviewedAt", { date: r.reviewedAt.toISOString().slice(0, 10) })}</div>}
                  </td>
                  <td className="text-body-sm max-w-md">{r.purpose}</td>
                  <td><Badge tone="info">{r.lawfulBasis.replace("_", " ")}</Badge></td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {r.dataCategories.map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}
                    </div>
                    {(r.thirdCountryTransfers ?? []).length > 0 && (
                      <div className="text-caption text-warning-700 mt-1">{t(locale, "gdpr.ropa.transfers")}: {(r.thirdCountryTransfers ?? []).join(", ")}</div>
                    )}
                  </td>
                  <td className="text-body-sm">{t(locale, "gdpr.ropa.months", { n: r.retentionMonths })}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="text-center text-body-sm text-muted py-8">{t(locale, "gdpr.ropa.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
