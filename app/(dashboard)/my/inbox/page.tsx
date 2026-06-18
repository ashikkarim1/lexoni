import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { Inbox, FileText, Mail, Sparkles, AlertCircle, Clock } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listInbox } from "@/lib/data/document-inbox";
import { listEmailInbox } from "@/lib/data/matter-emails";
import { listMatters } from "@/lib/data/matters";
import { listDraftsForSession } from "@/lib/data/time";

export const dynamic = "force-dynamic";

/**
 * "My Inbox" - the lawyer's single place for everything waiting on them.
 *
 * Combines:
 *   - Document inbox items uploaded by or routed to them
 *   - Emails captured to their matters
 *   - Time entry drafts awaiting confirmation
 *
 * This is the page a lawyer opens after Desk to triage. No surprises,
 * no decisions; everything actionable in one column.
 */
export default async function MyInboxPage() {
  const session = await getSession();
  const [docs, emails, timeDrafts, matters] = await Promise.all([
    listInbox(session, { status: "pending" }),
    listEmailInbox(session),
    listDraftsForSession(session),
    listMatters(session),
  ]);

  // Triage to "mine": items the user uploaded OR items routed to matters where the user is lead.
  const myMatterIds = new Set(matters.filter((m) => m.lead === session.fullName).map((m) => m.id));
  const myDocs = docs.filter((d) => d.uploadedByName === session.fullName || (d.suggestedRouting?.caseId && myMatterIds.has(d.suggestedRouting.caseId)));
  const myEmails = emails.filter((e) => !e.caseId || myMatterIds.has(e.caseId));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My inbox"
        subtitle="Everything waiting for you in one place. Triage, then move on."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Documents to triage" value={myDocs.length}      icon={FileText} delta={`${docs.length} firm-wide`} deltaTone="neutral" />
        <Kpi label="Emails to triage"    value={myEmails.length}    icon={Mail}     delta={`${emails.length} firm-wide`} deltaTone="neutral" />
        <Kpi label="Time to confirm"     value={timeDrafts.length}  icon={Clock}    delta="end-of-day sweep" deltaTone="neutral" />
        <Kpi label="My matters"          value={myMatterIds.size}   icon={Inbox}    delta="where you are lead" deltaTone="neutral" />
      </div>

      {/* Documents needing triage */}
      <Card>
        <CardHeader
          title={`Documents awaiting triage · ${myDocs.length}`}
          subtitle="The AI parked these for human review. Open one and file it into a matter."
          action={<Link href="/documents" className="btn-secondary btn-sm">Firm-wide inbox</Link>}
        />
        <CardBody className="!p-0">
          {myDocs.length === 0 ? (
            <div className="p-10 text-center text-muted text-body-sm">
              Nothing waiting. The AI router has filed every document so far.
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Document</th><th>AI suggestion</th><th>Confidence</th><th>Uploaded</th></tr></thead>
              <tbody>
                {myDocs.slice(0, 12).map((d) => (
                  <tr key={d.id} className="align-top">
                    <td>
                      <div className="font-medium truncate max-w-xs">{d.filename}</div>
                      <div className="text-caption text-muted">{(d.bytes / 1024).toFixed(1)} KB</div>
                    </td>
                    <td className="text-body-sm max-w-md">
                      {d.suggestedRouting?.caseTitle ? (
                        <>
                          <div className="font-medium">{d.suggestedRouting.caseTitle}</div>
                          <div className="text-caption text-muted truncate">{d.suggestedRouting.reasoning}</div>
                        </>
                      ) : <span className="text-caption text-muted">No suggestion yet.</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 w-24">
                        <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                          <div className={`h-full rounded ${(d.routingConfidence ?? 0) >= 60 ? "bg-success-600" : (d.routingConfidence ?? 0) >= 30 ? "bg-warning-500" : "bg-danger-500"}`} style={{ width: `${d.routingConfidence ?? 0}%` }} />
                        </div>
                        <span className="text-caption tabular-nums">{d.routingConfidence ?? 0}%</span>
                      </div>
                    </td>
                    <td className="text-caption text-muted">{d.createdAt.toISOString().slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Emails awaiting triage */}
      <Card>
        <CardHeader
          title={`Emails to file · ${myEmails.length}`}
          subtitle="Captured from your inbox or routed by AI. Confirm the matter or mark not-relevant."
        />
        <CardBody className="!p-0">
          {myEmails.length === 0 ? (
            <div className="p-10 text-center text-muted text-body-sm">No emails awaiting triage.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Subject</th><th>From</th><th>AI suggestion</th><th>Received</th></tr></thead>
              <tbody>
                {myEmails.slice(0, 12).map((e) => (
                  <tr key={e.id}>
                    <td className="font-medium truncate max-w-xs">{e.subject}</td>
                    <td className="text-caption">{e.fromAddress}</td>
                    <td className="text-caption text-muted max-w-md truncate">{e.classificationReasoning ?? "No suggestion"}</td>
                    <td className="text-caption text-muted">{e.receivedAt.toISOString().slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Time to confirm */}
      {timeDrafts.length > 0 && (
        <Card>
          <CardHeader
            title={`Time entries to confirm · ${timeDrafts.length}`}
            subtitle="Passive capture from your editor, Outlook and Teams. Confirm at end of day."
            action={<Link href="/desk" className="btn-secondary btn-sm">Open the confirm sweep</Link>}
          />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Activity</th><th>Matter</th><th>Source</th><th className="text-end">Minutes</th></tr></thead>
              <tbody>
                {timeDrafts.slice(0, 8).map((d) => (
                  <tr key={d.id}>
                    <td className="text-body-sm truncate max-w-md">{d.activity}</td>
                    <td className="text-caption">{d.matter}</td>
                    <td><Badge tone="neutral">{d.source}</Badge></td>
                    <td className="text-end tabular-nums">{d.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* Empty state, fully clear */}
      {myDocs.length + myEmails.length + timeDrafts.length === 0 && (
        <Card>
          <CardBody className="text-center py-12 space-y-2">
            <div className="h-10 w-10 rounded-full bg-success-50 text-success-700 flex items-center justify-center mx-auto">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-h3">Inbox zero</div>
            <p className="text-body-sm text-muted">
              Nothing waiting. Take a moment. Lexoni will surface the next item the moment it arrives.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Quick links into the matters where the user is lead */}
      {myMatterIds.size > 0 && (
        <Card>
          <CardHeader title="My matters" subtitle="Where you are lead lawyer." action={<Link href="/matters" className="btn-secondary btn-sm">All matters</Link>} />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Matter</th><th>Client</th><th>Process</th><th>Progress</th></tr></thead>
              <tbody>
                {matters.filter((m) => myMatterIds.has(m.id)).slice(0, 8).map((m) => (
                  <tr key={m.id}>
                    <td><Link href={`/matters/${m.id}`} className="font-medium hover:underline">{m.title}</Link></td>
                    <td className="text-body-sm">{m.client}</td>
                    <td><Badge tone="info">{m.processTitle}</Badge></td>
                    <td>
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                          <div className="h-full bg-primary-600 rounded" style={{ width: `${m.progressPct}%` }} />
                        </div>
                        <span className="text-caption tabular-nums">{m.progressPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

void AlertCircle;
