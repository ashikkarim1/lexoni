import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Lock, ShieldCheck, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listRopa } from "@/lib/data/gdpr";
import { t } from "@/lib/i18n";

/** Retention + residency policy summary. Derived from RoPA + tenant region. */
export default async function PolicyPage() {
  const session = await getSession();
  const locale = session.locale;
  const ropa = await listRopa(session);

  const bands = [
    { months: 12,  label: t(locale, "gdpr.policy.band1y") },
    { months: 36,  label: t(locale, "gdpr.policy.band3y") },
    { months: 84,  label: t(locale, "gdpr.policy.band7y") },
    { months: 120, label: t(locale, "gdpr.policy.band10y") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.gdpr")}
        title={t(locale, "gdpr.policy.title")}
        subtitle={t(locale, "gdpr.policy.subtitle")}
        actions={<Link href="/gdpr" className="btn-secondary btn-sm"><ArrowLeft className="h-4 w-4" /> {t(locale, "common.cancel")}</Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4" aria-hidden /></div>
            <div>
              <div className="sec-title">{t(locale, "gdpr.policy.residency")}</div>
              <div className="text-body font-semibold">{session.region}</div>
              <div className="text-caption text-muted leading-snug mt-1">{t(locale, "gdpr.policy.residencyBody")}</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0"><Lock className="h-4 w-4" aria-hidden /></div>
            <div>
              <div className="sec-title">{t(locale, "gdpr.policy.encryption")}</div>
              <div className="text-body font-semibold">AES-256 + TLS 1.3</div>
              <div className="text-caption text-muted leading-snug mt-1">{t(locale, "gdpr.policy.encryptionBody")}</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0"><ShieldCheck className="h-4 w-4" aria-hidden /></div>
            <div>
              <div className="sec-title">{t(locale, "gdpr.policy.access")}</div>
              <div className="text-body font-semibold">{t(locale, "gdpr.policy.accessVal")}</div>
              <div className="text-caption text-muted leading-snug mt-1">{t(locale, "gdpr.policy.accessBody")}</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={t(locale, "gdpr.policy.retention")} subtitle={t(locale, "gdpr.policy.retentionBody")} />
        <CardBody className="!p-0">
          <table className="tbl">
            <thead><tr><th>{t(locale, "gdpr.policy.colBand")}</th><th>{t(locale, "gdpr.policy.colActivities")}</th></tr></thead>
            <tbody>
              {bands.map((b) => {
                const grouped = ropa.filter((r) => r.retentionMonths <= b.months && (b.months === 12 ? true : r.retentionMonths > previousBand(bands, b.months)));
                return (
                  <tr key={b.months} className="align-top">
                    <td>
                      <div className="font-medium">{b.label}</div>
                      <div className="text-caption text-muted">{t(locale, "gdpr.policy.upTo", { n: b.months })}</div>
                    </td>
                    <td>
                      {grouped.length === 0
                        ? <span className="text-caption text-muted">-</span>
                        : (
                          <ul className="flex flex-wrap gap-2">
                            {grouped.map((r) => <li key={r.id}><Badge tone="neutral">{r.name}</Badge></li>)}
                          </ul>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function previousBand(bands: Array<{ months: number }>, m: number): number {
  let prev = 0;
  for (const b of bands) {
    if (b.months === m) return prev;
    prev = b.months;
  }
  return 0;
}
