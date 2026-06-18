import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listWalls, listAccessRequests } from "@/lib/data/walls";
import { t } from "@/lib/i18n";
import { DecideButtons } from "./DecideButtons";
import { WallsTable } from "./WallsTable";

export default async function WallsPage() {
  const session = await getSession();
  const locale = session.locale;
  const [walls, requests] = await Promise.all([
    listWalls(session),
    listAccessRequests(session),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t(locale, "nav.walls")}
        title={t(locale, "conflicts.walls.title")}
        subtitle={t(locale, "conflicts.walls.subtitle")}
        actions={<button className="btn-primary btn-sm"><Lock className="h-4 w-4" />{t(locale, "conflicts.walls.createBtn")}</button>}
      />

      <WallsTable locale={locale} rows={walls} />

      <Card>
        <CardHeader
          title={t(locale, "conflicts.walls.pendingRequestsTitle")}
          subtitle={t(locale, "conflicts.walls.pendingRequestsSubtitle")}
        />
        <CardBody className="space-y-3">
          {requests.length === 0 && (
            <div className="text-body-sm text-muted">{t(locale, "conflicts.walls.noRequests")}</div>
          )}
          {requests.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-4 border-b border-line/60 pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <div className="text-body-sm font-medium">
                  {r.requestedBy} <span className="text-muted">→</span> {r.wallName}
                </div>
                <div className="text-caption text-muted mt-0.5 leading-snug">{r.reason}</div>
                <div className="text-caption text-muted mt-1 flex items-center gap-1.5">
                  <span>{r.createdAt.toISOString().slice(0, 10)}</span>
                  <Badge tone={r.status === "requested" ? "warning" : r.status === "approved" ? "success" : "danger"}>
                    {t(locale, `common.${r.status === "requested" ? "pending" : r.status === "approved" ? "approved" : "denied"}`)}
                  </Badge>
                </div>
              </div>
              {r.status === "requested" && <DecideButtons locale={locale} requestId={r.id} />}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
