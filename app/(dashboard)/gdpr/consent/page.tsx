import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listConsent } from "@/lib/data/gdpr";
import { t } from "@/lib/i18n";

export default async function ConsentPage() {
  const session = await getSession();
  const locale = session.locale;
  const rows = await listConsent(session);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.gdpr")}
        title={t(locale, "gdpr.consent.title")}
        subtitle={t(locale, "gdpr.consent.subtitle")}
        actions={<Link href="/gdpr" className="btn-secondary btn-sm"><ArrowLeft className="h-4 w-4" /> {t(locale, "common.cancel")}</Link>}
      />

      <Card>
        <CardHeader title={t(locale, "gdpr.consent.title")} subtitle={t(locale, "gdpr.consent.body")} />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t(locale, "gdpr.consent.colSubject")}</th>
                <th>{t(locale, "gdpr.consent.colPurpose")}</th>
                <th>{t(locale, "gdpr.consent.colBasis")}</th>
                <th>{t(locale, "gdpr.consent.colGranted")}</th>
                <th>{t(locale, "gdpr.consent.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.subjectEmail}</td>
                  <td className="text-body-sm">{r.purpose}</td>
                  <td className="text-caption">{r.basis.replace("_", " ")}</td>
                  <td className="text-caption text-muted">{r.grantedAt.toISOString().slice(0, 10)}</td>
                  <td>
                    {r.revokedAt ? <Badge tone="danger">{t(locale, "gdpr.consent.revoked")}</Badge>
                     : r.granted ? <Badge tone="success">{t(locale, "gdpr.consent.active")}</Badge>
                     : <Badge tone="neutral">{t(locale, "gdpr.consent.refused")}</Badge>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="text-center text-body-sm text-muted py-8">{t(locale, "gdpr.consent.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
