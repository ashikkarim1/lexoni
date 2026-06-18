import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Inbox, FileCheck2, Trash2, FolderInput } from "lucide-react";
import { getSession } from "@/lib/auth/session-server";
import { listInbox } from "@/lib/data/document-inbox";
import { listMatters } from "@/lib/data/matters";
import { ModuleEmpty } from "@/components/ui/ModuleShell";
import { InboxDropzone } from "./InboxDropzone";
import { InboxRowActions } from "./InboxRowActions";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await getSession();
  const [pending, filed, rejected, matters] = await Promise.all([
    listInbox(session, { status: "pending" }),
    listInbox(session, { status: "filed" }),
    listInbox(session, { status: "rejected" }),
    listMatters(session),
  ]);

  const allEmpty = pending.length + filed.length + rejected.length === 0;
  if (allEmpty) return (
    <div className="space-y-4">
      <InboxDropzone matters={matters} />
      <ModuleEmpty
        icon={Inbox}
        title="Document inbox"
        subtitle="Drop a document - anywhere, any time - and it lands in the right matter slot. The classifier files high-confidence routings instantly; everything else lands here for one-click triage."
        bullets={[
          "Drag-drop, email-forward, mobile share-sheet - all routed to the same inbox",
          "AI files at confidence ≥ 80; everything else triaged here",
          "Wall-aware - the classifier never suggests a matter you cannot see",
        ]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document inbox"
        subtitle="Drop a document. Lexoni routes it to the right matter slot."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Pending triage" value={pending.length} icon={Inbox}      delta="awaiting one-click filing" deltaTone="neutral" />
        <Kpi label="Auto-filed"     value={filed.length}   icon={FileCheck2} delta="confidence ≥ 80%"          deltaTone="up" />
        <Kpi label="Rejected"       value={rejected.length}icon={Trash2}     delta="not matter-relevant"       deltaTone="neutral" />
        <Kpi label="Matters in book"value={matters.length} icon={FolderInput}delta="visible to you"            deltaTone="neutral" />
      </div>

      <InboxDropzone matters={matters} />

      {pending.length > 0 && (
        <Card>
          <CardHeader title={`Awaiting triage · ${pending.length}`} subtitle="Pick the matter and slot for each; we'll file it and audit it." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Document</th><th>AI suggestion</th><th>Confidence</th><th>Uploaded by</th><th>Action</th></tr></thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td>
                      <div className="font-medium truncate max-w-xs">{r.filename}</div>
                      <div className="text-caption text-muted">{(r.bytes / 1024).toFixed(1)} KB · {r.mime.split("/").pop()}</div>
                    </td>
                    <td className="text-body-sm max-w-md">
                      {r.suggestedRouting?.caseTitle ? (
                        <>
                          <div className="font-medium">{r.suggestedRouting.caseTitle}</div>
                          <div className="text-caption text-muted">{r.suggestedRouting.reasoning}</div>
                        </>
                      ) : <span className="text-caption text-muted">No AI guess.</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                          <div className={`h-full rounded ${(r.routingConfidence ?? 0) >= 60 ? "bg-success-600" : (r.routingConfidence ?? 0) >= 30 ? "bg-warning-500" : "bg-danger-500"}`} style={{ width: `${r.routingConfidence ?? 0}%` }} />
                        </div>
                        <span className="text-caption tabular-nums">{r.routingConfidence ?? 0}%</span>
                      </div>
                    </td>
                    <td className="text-caption text-muted">{r.uploadedByName ?? "-"}</td>
                    <td>
                      <InboxRowActions
                        inboxId={r.id}
                        suggestedCaseId={r.suggestedRouting?.caseId ?? null}
                        matters={matters}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {filed.length > 0 && (
        <Card>
          <CardHeader title={`Auto-filed · ${filed.length}`} subtitle="Filed by the AI router at high confidence." />
          <CardBody className="!p-0">
            <table className="tbl">
              <thead><tr><th>Document</th><th>Filed into</th><th>Confidence</th><th>When</th></tr></thead>
              <tbody>
                {filed.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium truncate max-w-xs">{r.filename}</td>
                    <td className="text-body-sm">{r.suggestedRouting?.caseTitle ?? "-"}</td>
                    <td className="text-caption tabular-nums">{r.routingConfidence ?? 0}%</td>
                    <td className="text-caption text-muted">{r.filedAt?.toISOString().slice(0, 16).replace("T", " ") ?? "-"}</td>
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
