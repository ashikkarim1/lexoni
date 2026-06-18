"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

const ROLES = ["firm_admin", "lawyer", "lawyer_helper", "client_admin", "client_member", "client_viewer"] as const;

export function InviteButton({ locale, members }: { locale: Locale; members: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<typeof ROLES[number]>("lawyer");
  const [reportsTo, setReportsTo] = useState("");
  const [rate, setRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (!email.includes("@")) { setError(t(locale, "members.invites.errorEmail")); return; }
    startTransition(async () => {
      const res = await fetch("/api/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          role,
          reportsToUserId: role === "lawyer_helper" && reportsTo ? reportsTo : undefined,
          hourlyRateCents: rate ? Math.round(Number(rate) * 100) : undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        if (j?.error === "already_member") setError(t(locale, "members.invites.errorAlready"));
        else if (j?.error === "duplicate_invite") setError(t(locale, "members.invites.errorDuplicate"));
        else setError(t(locale, "members.invites.errorGeneric"));
        return;
      }
      toast.success(t(locale, "members.invites.sent", { email }));
      setOpen(false);
      setEmail(""); setFullName(""); setRole("lawyer"); setReportsTo(""); setRate("");
      router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary btn-sm">
        <UserPlus className="h-4 w-4" aria-hidden /> {t(locale, "members.invites.button")}
      </button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={t(locale, "members.invites.modalTitle")}
        description={t(locale, "members.invites.modalBody")}
        closeAriaLabel={t(locale, "common.cancel")}
        footer={
          <>
            <button onClick={() => setOpen(false)} disabled={pending} className="btn-secondary btn-sm">{t(locale, "common.cancel")}</button>
            <button onClick={submit} disabled={pending} className="btn-primary btn-sm">
              <UserPlus className="h-4 w-4" aria-hidden /> {pending ? t(locale, "common.loading") : t(locale, "members.invites.send")}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t(locale, "members.invites.fEmail")} required error={error && error.includes("@") ? error : null}>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="omar@firm.com" />
          </Field>
          <Field label={t(locale, "members.invites.fName")}>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t(locale, "members.invites.fNamePlaceholder")} />
          </Field>
          <Field label={t(locale, "members.invites.fRole")} required>
            <Select value={role} onChange={(e) => setRole(e.target.value as typeof ROLES[number])}>
              {ROLES.map((r) => <option key={r} value={r}>{t(locale, `members.role.${r}`)}</option>)}
            </Select>
          </Field>
          {role === "lawyer_helper" && (
            <Field label={t(locale, "members.invites.fReports")} hint={t(locale, "members.invites.fReportsHint")}>
              <Select value={reportsTo} onChange={(e) => setReportsTo(e.target.value)}>
                <option value="">-</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
            </Field>
          )}
          {(role === "lawyer" || role === "firm_admin" || role === "lawyer_helper") && (
            <Field label={t(locale, "members.invites.fRate")} hint={t(locale, "members.invites.fRateHint")}>
              <Input value={rate} onChange={(e) => setRate(e.target.value)} type="number" min="0" step="10" placeholder="450" />
            </Field>
          )}
          {error && <div className="text-caption text-danger-700">{error}</div>}
        </div>
      </Modal>
    </>
  );
}
