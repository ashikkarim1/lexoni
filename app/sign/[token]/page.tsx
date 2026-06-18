import { headers } from "next/headers";
import { Brand } from "@/components/ui/Brand";
import { Badge } from "@/components/ui/Badge";
import { publicLookupParty, publicMarkPartyViewed } from "@/lib/data/signatures";
import { renderMarkdown } from "@/lib/md/render";
import { PartySignActions } from "./PartySignActions";

export default async function PublicSignPage({ params }: { params: { token: string } }) {
  const view = await publicLookupParty(params.token);
  if (!view) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="card-raised w-full max-w-md p-7">
          <Brand />
          <div className="mt-5">
            <div className="text-h2">Link not found</div>
            <p className="text-body-sm text-muted mt-2 leading-relaxed">
              We couldn't find this signature request. The link may have been mistyped, expired or withdrawn - please contact the firm that sent it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const h = headers();
  await publicMarkPartyViewed(params.token, h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-surface border-b border-line">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Brand />
          <Badge tone={view.partyStatus === "signed" ? "success" : view.partyStatus === "declined" ? "danger" : "info"}>
            {view.partyStatus === "signed" ? "Signed" : view.partyStatus === "declined" ? "Declined" : "For signature"}
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="card p-5">
          <div className="sec-title">Signature request from {view.firmName}</div>
          <h1 className="text-h1 leading-tight mt-1">{view.title}</h1>
          <div className="text-body-sm text-muted mt-2">Signing as <span className="text-ink font-medium">{view.partyName}</span> ({view.partyRole})</div>
          {view.workflowOrder === "sequential" && !view.yourTurn && view.partyStatus === "pending" && (
            <div className="mt-3 inline-flex items-center gap-1.5 chip-warning">Waiting for earlier signers in this sequence</div>
          )}
        </div>

        <article
          className="card-raised p-8 prose-render"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(view.bodyMd) }}
        />

        {view.yourTurn && (
          <div className="card p-5">
            <PartySignActions token={params.token} signerName={view.partyName} />
          </div>
        )}

        {view.partyStatus === "signed" && (
          <div className="card p-5 bg-success-50/40 border-success-200">
            <div className="text-h3 text-success-800">Thank you - your signature is on file.</div>
          </div>
        )}
        {view.partyStatus === "declined" && (
          <div className="card p-5 bg-danger-50/40 border-danger-200">
            <div className="text-h3 text-danger-800">You declined this document.</div>
          </div>
        )}
      </main>
    </div>
  );
}
