import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BookOpen } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { searchPrecedents, precedentFacets } from "@/lib/data/precedents";
import { ModuleEmpty } from "@/components/ui/ModuleShell";
import { PrecedentFilters } from "./PrecedentFilters";

export const dynamic = "force-dynamic";

export default async function PrecedentsPage({
  searchParams,
}: { searchParams: { q?: string; kind?: string; jurisdiction?: string; approved?: string } }) {
  const session = await getSession();
  const opts = {
    q: searchParams.q?.trim() || undefined,
    kind: searchParams.kind || undefined,
    jurisdiction: searchParams.jurisdiction || undefined,
    approvedOnly: searchParams.approved === "1",
  };
  const [rows, facets] = await Promise.all([
    searchPrecedents(session, opts),
    precedentFacets(session),
  ]);

  if (rows.length === 0 && !opts.q && !opts.kind && !opts.jurisdiction && !opts.approvedOnly) {
    return (
      <ModuleEmpty
        icon={BookOpen}
        title="Precedent library"
        subtitle="Every executed document is cloned here, redacted, tagged, and searchable. Ask plain-English questions like 'show me every SHA we drafted with anti-dilution for tech in UAE'."
        bullets={[
          "Auto-cloned on engagement counter-sign + signature workflow complete",
          "PII redaction on by default (configurable per firm)",
          "Wall-aware - precedents from walled matters never surface to non-members",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Precedent library"
        subtitle={`${rows.length} precedents · clauses, kinds, jurisdictions tagged for retrieval`}
      />
      <PrecedentFilters facets={facets} active={opts} />

      <Card>
        <CardHeader title={`Results · ${rows.length}`} subtitle={opts.q ? `Matching "${opts.q}"` : "Latest first"} />
        <CardBody className="!p-0">
          {rows.length === 0 ? (
            <div className="p-10 text-center text-muted text-body-sm">No precedents match those filters.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Title</th><th>Kind</th><th>Jurisdiction</th><th>Tags</th><th>Outcome</th><th>Approved</th><th>Trains AI</th></tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-caption text-muted">{p.governingLaw ? `Governing law: ${p.governingLaw}` : "-"}</div>
                    </td>
                    <td>{p.kind ? <Badge tone="info">{p.kind}</Badge> : <span className="text-caption text-muted">-</span>}</td>
                    <td className="text-caption">{p.jurisdiction ?? "-"}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {p.tags.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
                        {p.partyKinds.map((t) => <Badge key={`pk-${t}`} tone="neutral">{t}</Badge>)}
                      </div>
                    </td>
                    <td><Badge tone={p.outcome === "executed" ? "success" : "neutral"}>{p.outcome ?? "-"}</Badge></td>
                    <td>{p.approved ? <Badge tone="success">approved</Badge> : <Badge tone="warning">pending</Badge>}</td>
                    <td>{p.learnFromThis ? <Badge tone="info">yes</Badge> : <Badge tone="neutral">no</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
