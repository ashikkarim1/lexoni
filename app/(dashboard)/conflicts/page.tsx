import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Kpi } from "@/components/ui/Kpi";
import { ShieldAlert, ShieldCheck, Lock, Inbox } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listConflicts } from "@/lib/data/conflicts";
import { listWalls, listAccessRequests } from "@/lib/data/walls";
import { t } from "@/lib/i18n";
import { ConflictRunner } from "./ConflictRunner";
import { ConflictsTable } from "./ConflictsTable";

export default async function ConflictsPage() {
  const session = await getSession();
  const locale = session.locale;
  const [conflicts, walls, requests] = await Promise.all([
    listConflicts(session),
    listWalls(session),
    listAccessRequests(session),
  ]);

  const openPotential = conflicts.filter((c) => c.outcome === "potential" || c.outcome === "confirmed").length;
  const now = new Date();
  const sameMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const clearedThisMonth = conflicts.filter((c) => c.outcome === "waived" && sameMonth(c.checkedAt)).length;
  const walledMatters = walls.reduce((a, w) => a + w.matters, 0);
  const pendingWallRequests = requests.filter((r) => r.status === "requested").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.conflicts")}
        title={t(locale, "conflicts.title")}
        subtitle={t(locale, "conflicts.subtitle")}
        actions={
          <>
            <Link href="/conflicts/access-log" className="btn-secondary btn-sm">
              {t(locale, "conflicts.viewAccessLog")}
            </Link>
            <Link href="/conflicts/walls" className="btn-primary btn-sm">
              <Lock className="h-4 w-4" /> {t(locale, "conflicts.viewWalls")}
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t(locale, "conflicts.kpi.openPotential")}    value={openPotential}      icon={ShieldAlert} delta={t(locale, "conflicts.kpi.openPotentialDelta")}   deltaTone={openPotential ? "down" : "neutral"} />
        <Kpi label={t(locale, "conflicts.kpi.clearedThisMonth")} value={clearedThisMonth}   icon={ShieldCheck} delta={t(locale, "conflicts.kpi.clearedDelta")}         deltaTone="up" />
        <Kpi label={t(locale, "conflicts.kpi.walledMatters")}    value={walledMatters}      icon={Lock}        delta={t(locale, "conflicts.kpi.walledDelta")}          deltaTone="neutral" />
        <Kpi label={t(locale, "conflicts.kpi.pendingRequests")}  value={pendingWallRequests} icon={Inbox}      delta={t(locale, "conflicts.kpi.pendingRequestsDelta")} deltaTone={pendingWallRequests ? "down" : "neutral"} />
      </div>

      <ConflictRunner locale={locale} />

      <ConflictsTable locale={locale} rows={conflicts} />
    </div>
  );
}
