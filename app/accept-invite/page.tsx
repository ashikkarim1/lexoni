import { Brand } from "@/components/ui/Brand";
import { lookupInvite } from "@/lib/data/invites";
import { AcceptForm } from "./AcceptForm";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";
  const lookup = token ? await lookupInvite(token) : { ok: false as const, reason: "not_found" as const };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="card-raised w-full max-w-md p-7 space-y-5">
        <div className="flex items-center justify-between">
          <Brand />
        </div>
        {!lookup.ok ? (
          <div className="space-y-2">
            <div className="text-h2">Link no longer valid</div>
            <p className="text-body-sm text-muted leading-relaxed">
              {lookup.reason === "expired"   && "This invitation expired. Ask the partner who invited you to resend."}
              {lookup.reason === "cancelled" && "This invitation was cancelled. Contact the firm to be re-invited."}
              {lookup.reason === "accepted"  && "This invitation has already been accepted. Sign in instead."}
              {lookup.reason === "not_found" && "We couldn't find this invitation. Check the link in your email."}
            </p>
          </div>
        ) : (
          <>
            <div>
              <div className="sec-title mb-1">You're invited</div>
              <h1 className="text-h1 leading-tight">Join {lookup.tenantName}</h1>
              <p className="text-body-sm text-muted mt-2 leading-relaxed">
                {lookup.inviterName ? `${lookup.inviterName} invited you to ` : "You've been invited to "}
                <strong className="text-ink">{lookup.tenantName}</strong> on Lexoni.ai as a <strong className="text-ink">{labelFor(lookup.role)}</strong>.
              </p>
            </div>
            <AcceptForm
              token={token}
              prefillName={lookup.fullName ?? ""}
              email={lookup.email}
              tenantName={lookup.tenantName}
            />
            <p className="text-caption text-muted">
              This link expires on {lookup.expiresAt.toISOString().slice(0, 10)}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function labelFor(role: string): string {
  return {
    firm_admin:    "Partner / firm admin",
    lawyer:        "Lawyer",
    lawyer_helper: "Paralegal / helper",
    client_admin:  "Client admin",
    client_member: "Client member",
    client_viewer: "Client viewer",
  }[role] ?? role;
}
