import { headers } from "next/headers";
import { Brand } from "@/components/ui/Brand";
import { Badge } from "@/components/ui/Badge";
import { publicLookupByToken, publicMarkViewed } from "@/lib/data/engagement";
import { renderMarkdown } from "@/lib/md/render";
import { SignActions } from "./SignActions";

export default async function PublicEngagementPage({ params }: { params: { token: string } }) {
  const view = await publicLookupByToken(params.token);

  if (!view) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="card-raised w-full max-w-md p-7">
          <Brand />
          <div className="mt-5">
            <div className="text-h2">Link not found</div>
            <p className="text-body-sm text-muted mt-2 leading-relaxed">
              We couldn't find this engagement letter. The link may have been mistyped, expired or withdrawn - please contact the firm that sent it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fire-and-forget viewed mark on every load (idempotent after the first).
  const h = headers();
  await publicMarkViewed(params.token, h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, h.get("user-agent"));

  const amount = view.feeQuoteCents != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: view.currency, maximumFractionDigits: 0 }).format(view.feeQuoteCents / 100)
    : "-";

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-surface border-b border-line">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Brand />
          <Badge tone={view.signedByClient ? "success" : view.declined ? "danger" : "info"}>
            {view.signedByClient ? "Signed" : view.declined ? "Declined" : "For review"}
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="card p-5">
          <div className="sec-title">Engagement letter</div>
          <h1 className="text-h1 leading-tight mt-1">{view.firmName} ↔ {view.clientName}</h1>
          <div className="mt-2 text-body-sm text-muted">Fee: <span className="text-ink font-medium">{view.feeArrangement.toUpperCase()}</span> · Quote: <span className="text-ink font-medium">{amount}</span></div>
        </div>

        <article
          className="card-raised p-8 prose-render"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(view.bodyMd) }}
        />

        {!view.signedByClient && !view.declined && (
          <div className="card p-5">
            <SignActions token={params.token} clientName={view.clientName} />
          </div>
        )}

        {view.signedByClient && (
          <div className="card p-5 bg-success-50/40 border-success-200">
            <div className="text-h3 text-success-800">Thank you - your acceptance has been recorded.</div>
            <p className="text-body-sm text-success-800 mt-1">
              The firm will counter-sign and the matter will open automatically. Your signature is sealed with a tamper-evident certificate hash held in the firm's audit log.
            </p>
          </div>
        )}

        {view.declined && (
          <div className="card p-5 bg-danger-50/40 border-danger-200">
            <div className="text-h3 text-danger-800">You declined this engagement.</div>
            <p className="text-body-sm text-danger-800 mt-1">If you'd like to reopen the conversation, contact the firm directly.</p>
          </div>
        )}
      </main>
    </div>
  );
}
