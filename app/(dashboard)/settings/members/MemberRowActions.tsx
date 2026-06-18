"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";

export function MemberRowActions({
  locale,
  membershipId,
  role,
  active,
}: {
  locale: Locale;
  membershipId: string;
  role: string;
  active: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  void role;

  const setActive = (next: boolean) => {
    startTransition(async () => {
      const res = await fetch("/api/members/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, active: next }),
      });
      if (!res.ok) { toast.error(t(locale, "common.loading")); return; }
      toast.success(t(locale, next ? "members.actions.reactivated" : "members.actions.deactivated"));
      router.refresh();
    });
  };

  return (
    <button onClick={() => setActive(!active)} disabled={pending} className="btn-secondary btn-sm">
      {active ? <UserMinus className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
      {active ? t(locale, "members.actions.deactivate") : t(locale, "members.actions.reactivate")}
    </button>
  );
}
