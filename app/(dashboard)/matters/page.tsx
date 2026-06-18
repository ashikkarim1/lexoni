import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, FolderKanban } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listMatters } from "@/lib/data/matters";
import { t } from "@/lib/i18n";

export default async function MattersPage() {
  const session = await getSession();
  const locale = session.locale;
  const matters = await listMatters(session);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "matters.listTitle")}
        subtitle={t(locale, "matters.listSubtitle")}
        actions={<button className="btn-primary text-xs"><FolderKanban className="h-4 w-4" /> {t(locale, "matters.newMatter")}</button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {matters.map((m) => {
          const signed = m.slots.filter((s) => ["signed", "filed", "approved"].includes(s.status)).length;
          return (
            <Link key={m.id} href={`/matters/${m.id}`}>
              <Card className="p-5 hover:border-royal transition cursor-pointer h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-muted mt-0.5">#{m.matterNumber} · {m.client}</div>
                  </div>
                  <Badge tone="info">{m.processTitle}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted">
                  <span>{m.jurisdiction}</span><span>·</span><span>{m.language.toUpperCase()}</span>
                  <span>·</span><span>{m.feeModel}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-royal rounded-full" style={{ width: `${m.progressPct}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted">{t(locale, "matters.docs", { signed, total: m.slots.length })}</span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
