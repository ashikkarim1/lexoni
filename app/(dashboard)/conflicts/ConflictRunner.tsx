"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { t, type Locale } from "@/lib/i18n";

type Match = { kind: string; party: string; via: string; severity: string };
type Result = { id: string; outcome: "clear" | "potential" | "confirmed" | "waived"; matches: Match[] };

export function ConflictRunner({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [adverseText, setAdverseText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    if (!subject.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/conflicts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName: subject.trim(),
          adverseParties: adverseText.split("\n").map((l) => l.trim()).filter(Boolean),
        }),
      });
      const r = (await res.json()) as Result;
      setResult(r);
      router.refresh();
    });
  };

  const waive = async () => {
    if (!result) return;
    await fetch("/api/conflicts/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: result.id }),
    });
    setResult(null);
    setSubject("");
    setAdverseText("");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader
        title={t(locale, "conflicts.newCheck.title")}
        action={<Sparkles className="h-4 w-4 text-royal" />}
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted">
              {t(locale, "conflicts.newCheck.subject")}
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t(locale, "conflicts.newCheck.subjectPlaceholder")}
              className="w-full mt-1 h-10 text-sm rounded-lg border border-line bg-canvas px-3 focus:outline-none focus:ring-2 focus:ring-royal/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              {t(locale, "conflicts.newCheck.adverse")}
            </label>
            <textarea
              value={adverseText}
              onChange={(e) => setAdverseText(e.target.value)}
              placeholder={t(locale, "conflicts.newCheck.adversePlaceholder")}
              className="w-full mt-1 text-sm rounded-lg border border-line bg-canvas px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-royal/30"
            />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            onClick={run}
            disabled={!subject.trim() || pending}
            className="btn-primary text-sm disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> {t(locale, "conflicts.newCheck.submit")}
          </button>
        </div>

        {result && (
          <div className={`card p-4 ${result.outcome === "clear" ? "bg-success-50" : "bg-warning-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {result.outcome === "clear" ? (
                    <ShieldCheck className="h-5 w-5 text-success-700" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-warning-700" />
                  )}
                  <div className="font-semibold">
                    {result.outcome === "clear"
                      ? t(locale, "conflicts.result.clearTitle")
                      : t(locale, result.matches.length === 1 ? "conflicts.result.potentialTitle" : "conflicts.result.potentialTitlePlural", { n: result.matches.length })}
                  </div>
                </div>
                <p className="text-sm text-muted mt-1">
                  {result.outcome === "clear"
                    ? t(locale, "conflicts.result.clearBody")
                    : t(locale, "conflicts.result.potentialBody")}
                </p>
                {result.matches.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {result.matches.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge tone="warning">{m.severity}</Badge>
                        <div>
                          <span className="font-medium">{t(locale, `conflicts.match.${m.kind}`)}</span>{" "}
                          <span className="text-muted">- {m.party} · {t(locale, "conflicts.result.via", { matter: m.via })}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {result.outcome !== "clear" && (
                <button onClick={waive} className="btn-ghost border border-line text-xs whitespace-nowrap">
                  {t(locale, "conflicts.result.waive")}
                </button>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
