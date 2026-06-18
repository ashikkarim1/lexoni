"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Lightbulb, Bug, Heart, MessagesSquare, Loader2 } from "lucide-react";

type Kind = "feature_idea" | "bug" | "praise" | "other";

const CATEGORIES: Array<{ kind: Kind; label: string; icon: typeof Lightbulb; emoji: string; tint: string }> = [
  { kind: "feature_idea", label: "Feature idea", icon: Lightbulb,      emoji: "💡", tint: "bg-warning-50 border-warning-200 text-warning-700" },
  { kind: "bug",          label: "Bug",          icon: Bug,             emoji: "🐞", tint: "bg-danger-50 border-danger-200 text-danger-700" },
  { kind: "praise",       label: "Praise",       icon: Heart,           emoji: "💜", tint: "bg-royal/10 border-royal/30 text-royal" },
  { kind: "other",        label: "Other",        icon: MessagesSquare,  emoji: "💬", tint: "bg-canvas border-line text-muted" },
];

const PLACEHOLDER_BY_KIND: Record<Kind, string> = {
  feature_idea: "What would make Lexoni better for you?",
  bug:          "What's broken? When did it happen? What were you doing?",
  praise:       "What's working well for you?",
  other:        "Anything else on your mind?",
};

export function HelpWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("feature_idea");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state on close + auto-clear "sent" after 4s.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => { setSent(false); setMessage(""); setKind("feature_idea"); setError(null); }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function submit() {
    if (!message.trim()) { setError("Please write a quick note."); return; }
    setBusy(true); setError(null);
    const meta = typeof window === "undefined" ? {} : {
      locale: navigator.language,
      screen: `${window.innerWidth}×${window.innerHeight}`,
      ua: navigator.userAgent.slice(0, 200),
    };
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, message: message.trim(), pageContext: pathname, meta }),
    });
    setBusy(false);
    if (!res.ok) { setError("Sending failed - try again."); return; }
    setSent(true);
    setTimeout(() => setOpen(false), 1100);
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 end-5 z-40 h-12 w-12 rounded-full bg-royal text-white shadow-lg flex items-center justify-center hover:scale-105 transition"
        aria-label="Share feedback"
        title="Share feedback"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={() => setOpen(false)} aria-hidden />
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed bottom-20 end-5 z-40 w-[min(380px,calc(100vw-2rem))] bg-white rounded-xl shadow-2xl border border-line p-5"
          onClick={(e) => e.stopPropagation()}
        >
          {sent ? (
            <div className="text-center py-8">
              <div className="h-10 w-10 rounded-full bg-success-50 text-success-700 flex items-center justify-center mx-auto mb-3">
                <Heart className="h-5 w-5" />
              </div>
              <div className="text-h3">Thank you.</div>
              <p className="text-body-sm text-muted mt-1">We read every note.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-h3">Share feedback</div>
                  <p className="text-caption text-muted mt-0.5">Feature ideas, bugs, or just hello - we read everything.</p>
                </div>
                <button aria-label="Close" onClick={() => setOpen(false)} className="text-muted hover:text-ink p-1 -m-1 rounded-md">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Category cards */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.kind}
                    onClick={() => setKind(c.kind)}
                    className={`rounded-lg border p-2 text-center transition ${
                      kind === c.kind ? "ring-2 ring-royal/30 " + c.tint : "border-line bg-white hover:bg-canvas text-muted"
                    }`}
                  >
                    <div className="text-lg leading-none mb-1" aria-hidden>{c.emoji}</div>
                    <div className="text-[11px] font-medium">{c.label}</div>
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={PLACEHOLDER_BY_KIND[kind]}
                className="w-full rounded-md border border-line bg-canvas p-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
              />

              <div className="flex items-center justify-between text-caption text-muted mt-2">
                <div className="truncate max-w-[60%]" title={pathname ?? ""}>
                  on <span className="font-mono">{pathname ?? "/"}</span>
                </div>
                <div className="tabular-nums">{message.length}/4000</div>
              </div>

              {error && <div className="text-caption text-danger-700 mt-2">{error}</div>}

              <button
                onClick={submit}
                disabled={busy || !message.trim()}
                className="btn-primary w-full mt-3"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Sending…" : "Send feedback"}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
