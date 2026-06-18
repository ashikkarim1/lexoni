"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, ShieldCheck, GitBranch, Network, Radar, Gavel, Building2, MapPin,
  Briefcase, Users, Mail, Compass, Sparkles, Send, CheckCircle2, Loader2,
} from "lucide-react";

const OWNER_EMAIL = "ceo@theupcapital.com";

const MOATS = [
  {
    title: "Dynamic Legal Workflow Generation",
    short: "Outcomes become legal paths in seconds.",
    body:
      "Type the outcome (\"list on ADX\", \"open a Saudi subsidiary\") and our engine generates the full execution path: steps, documents, regulators, deadlines, owners. The competitive moat is the typed legal-process ontology + the firm's historicals feeding it. Document-storage vendors cannot retrofit this.",
    icon: GitBranch,
  },
  {
    title: "Legal Knowledge Graph",
    short: "Typed graph linking everything the firm knows.",
    body:
      "Clients, matters, entities, contracts, clauses, regulations, filings, lawyers, time entries, outcomes, all linked with typed temporal edges. AI reasons across relationships, not over flat documents. Hard to copy because the moat is the graph schema plus the firm's twenty years of work, not the model.",
    icon: Network,
  },
  {
    title: "Regulatory Impact Engine",
    short: "Every new rule mapped to your clients in 24 hours.",
    body:
      "A new regulation lands, our engine resolves it through (regulator -> client -> contract -> entity -> required action). Output: per-client memo (EN and AR), affected-asset list, estimated fee opportunity, deadline. The moat is the gazette-ingest pipeline plus clause-level extraction plus the firm's graph, in one system.",
    icon: Radar,
  },
  {
    title: "Legal Outcome Prediction",
    short: "Cost, duration and risk predicted before signing.",
    body:
      "Trained on the firm's own closed-loop historicals: cost, duration, on-time delivery, risk flags, all predicted before the engagement letter is signed. The moat is the data itself: a firm's history is its data. We are simply the platform that turns it into a forecast.",
    icon: Gavel,
  },
];

const FOCUS = [
  { title: "GCC scale, 2026", body: "We focus on UAE and KSA this year. ADGM, DIFC, DMCC, ADX, Tadawul, MISA, ZATCA. Bilingual EN and AR by default. Residency-pinned to the region by default.", icon: MapPin },
  { title: "Dubai-based, regional team", body: "Headquartered in Dubai. The team and the council of legal advisors will stay regional through 2026. Distribution and design partners will be GCC-resident.", icon: Building2 },
  { title: "Building a council of advisors", body: "We are assembling a small council of senior partners, former managing partners, and ex-regulators across UAE and KSA to shape product direction. If that sounds like you or someone in your network, we want to talk.", icon: Users },
  { title: "Pre-Series A round, open", body: "We are raising a small pre-Series A to scale go-to-market across the region. We are looking for capital, design partners (firms), and a council of advisors. We answer every email.", icon: Compass },
];

const VITALS = [
  { k: "12", l: "outcome-driven modules live" },
  { k: "8",  l: "process packs (M&A, IPO ADX, Nasdaq Dubai, Patent, Litigation, Employment, Fund launch, Co. Formation)" },
  { k: "EN + AR", l: "bilingual everywhere, RTL native" },
  { k: "36", l: "tenant-scoped tables, wall-aware retrieval" },
];

type Intent = "investor" | "trial" | "advisor";

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Section id="moats" eyebrow="The four moats" title="Why nobody in the region will catch us">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOATS.map((m, i) => (
            <div key={m.title} className="card p-6 relative overflow-hidden">
              <div className="absolute top-3 end-3 text-[10px] uppercase tracking-wider text-muted font-medium">IP layer {i + 1}</div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-midnight-900 text-white flex items-center justify-center"><m.icon className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-caption text-muted">{m.short}</div>
                </div>
              </div>
              <p className="text-body-sm text-muted mt-3 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="2026 focus" title="GCC scale. Dubai HQ. Pre-Series A.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FOCUS.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center"><f.icon className="h-4 w-4" /></div>
                <div className="font-semibold">{f.title}</div>
              </div>
              <p className="text-body-sm text-muted mt-2 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Vital signs" title="Where Lexoni is today">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VITALS.map((v) => (
            <div key={v.l} className="card p-5">
              <div className="text-display tracking-tight">{v.k}</div>
              <div className="text-caption text-muted mt-1">{v.l}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Reach the founder" title="Talk to the CEO, directly" tone="dark">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <ContactCard intent="investor" />
          <ContactCard intent="trial" />
          <ContactCard intent="advisor" />
        </div>

        <div className="mt-10 max-w-3xl mx-auto text-center">
          <p className="text-body-sm text-white/80 leading-relaxed">
            Prefer email? Write to{" "}
            <a href={`mailto:${OWNER_EMAIL}?subject=Lexoni%20investor%20enquiry`} className="text-white underline underline-offset-4">
              {OWNER_EMAIL}
            </a>{" "}
            and reference what brought you here. We answer within one business day.
          </p>
        </div>
      </Section>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-midnight flex items-center justify-center text-white font-bold">L</div>
          <div className="font-semibold">Lexoni.ai</div>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted">
          <a href="#moats">The moats</a>
          <Link href="/">Product</Link>
          <Link href="/apply">Try with us</Link>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Link href="/signin" className="btn-ghost text-xs">Sign in</Link>
          <a href={`mailto:${OWNER_EMAIL}`} className="btn-primary text-xs"><Mail className="h-4 w-4" /> Talk to the founder</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas to-white" />
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-royal uppercase">Investors and trial customers</div>
        <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
          We are building the GCC legal operating system. Talk to us.
        </h1>
        <p className="mt-5 text-lg text-muted leading-relaxed max-w-3xl mx-auto">
          Lexoni is the operating system law firms in the UAE and Saudi Arabia open first and close last.
          Outcome-driven, regulator-mapped, residency-pinned, bilingual EN and AR from day one.
          We are headquartered in Dubai, we are raising a small Pre-Series A, and we want to hear from you.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          <a href="#contact-investor" className="btn-primary text-sm">Request investor pack <ArrowRight className="h-4 w-4" /></a>
          <a href="#contact-trial" className="btn-ghost text-sm border border-line">Request a trial</a>
          <a href="#contact-advisor" className="btn-ghost text-sm border border-line">Join the advisory council</a>
        </div>
        <p className="mt-5 text-xs text-muted flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Dubai-based. GCC focus 2026. Council of regional legal advisors in formation.
        </p>
      </div>
    </section>
  );
}

function Section({
  id, eyebrow, title, tone = "light", children,
}: {
  id?: string; eyebrow: string; title: string; tone?: "light" | "dark";
  children: React.ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <section id={id} className={`py-20 border-t ${dark ? "bg-midnight-900 text-white border-midnight-800" : "border-line"}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${dark ? "text-royal-300" : "text-royal"}`}>{eyebrow}</div>
          <h2 className={`mt-2 text-3xl font-semibold tracking-tight ${dark ? "" : ""}`}>{title}</h2>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line py-10 text-center text-caption text-muted">
      <div>Lexoni.ai. Dubai, UAE. All rights reserved.</div>
      <div className="mt-1.5">
        <a href={`mailto:${OWNER_EMAIL}`} className="underline">{OWNER_EMAIL}</a>
        <span className="mx-2">·</span>
        <Link href="/" className="underline">Product</Link>
        <span className="mx-2">·</span>
        <Link href="/signin" className="underline">Sign in</Link>
      </div>
    </footer>
  );
}

const INTENT_META: Record<Intent, { title: string; icon: typeof Briefcase; body: string; subjectTpl: string }> = {
  investor: {
    title: "I am an investor",
    icon: Briefcase,
    body: "Pre-Series A. We will share the deck, financial model and reference calls with serious investors based in the region or with a thesis on the GCC.",
    subjectTpl: "Lexoni - investor enquiry",
  },
  trial: {
    title: "I am a law firm or counsel",
    icon: Sparkles,
    body: "We are onboarding a small cohort of design-partner firms in the UAE and KSA. Two-week guided trial. We bring the playbook, you bring the matters.",
    subjectTpl: "Lexoni - 14-day trial enquiry",
  },
  advisor: {
    title: "I want to advise",
    icon: Compass,
    body: "We are forming a regional advisory council. Senior partners, former managing partners, and ex-regulators across UAE and KSA. Light commitment, big impact on direction.",
    subjectTpl: "Lexoni - advisory council enquiry",
  },
};

function ContactCard({ intent }: { intent: Intent }) {
  const meta = INTENT_META[intent];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firm, setFirm] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.includes("@") || !name.trim()) {
      setError("Please share your name and email so we can reply.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/contact/investors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent, name, email, firm, note }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Sending failed. Email us directly at ceo@theupcapital.com");
      return;
    }
    setSent(true);
  }

  return (
    <div id={`contact-${intent}`} className="card p-6 bg-white text-ink scroll-mt-20 flex flex-col h-full">
      {/* Top block, equalised across cards so the description is the only
          variable height, then min-h on the description guarantees the
          form + CTA sit at identical Y across the three columns. */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-royal text-white flex items-center justify-center"><meta.icon className="h-5 w-5" /></div>
        <div className="font-semibold">{meta.title}</div>
      </div>
      <p className="text-caption text-muted mt-2 leading-relaxed min-h-[5.25rem]">{meta.body}</p>

      {sent ? (
        <div className="mt-4 flex flex-col flex-1 items-center justify-end text-center py-6">
          <CheckCircle2 className="h-8 w-8 text-success-600 mx-auto" aria-hidden />
          <div className="font-semibold mt-2">Email sent to the CEO</div>
          <div className="text-caption text-muted">Reply within one business day, usually same day.</div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col flex-1 space-y-2.5">
          <input className="input w-full" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input w-full" placeholder={intent === "trial" ? "Firm" : "Firm or fund (optional)"} value={firm} onChange={(e) => setFirm(e.target.value)} />
          <textarea className="textarea w-full" rows={3} placeholder="A line on what you are looking for (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <div className="text-caption text-danger-700">{error}</div>}
          {/* mt-auto pushes the CTA to the bottom so all three buttons sit on
              the same baseline regardless of body length. */}
          <button className="btn-primary w-full mt-auto" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Email the CEO
          </button>
        </div>
      )}
    </div>
  );
}
