"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { EN, AR, type LangPack } from "@/lib/i18n/landing";
import { plans } from "@/lib/marketing/plans";
import {
  ArrowRight, Sparkles, Building2, ShieldCheck, FileSignature, Globe, Check, X,
  TrendingUp, Zap, UserMinus, Smile, Users, ChevronRight, GraduationCap, BookOpen, AlertTriangle, MessageSquare, Info, Lightbulb,
  Compass, Brain, Bot, Radar, GitBranch, Network, ScrollText, Briefcase, Scale, Gavel, FolderKanban, Library, ShieldCheck as ShieldCheckIcon, Wallet, BadgeCheck, Lock,
} from "lucide-react";

const BUY_ICONS = [TrendingUp, Zap, UserMinus, Smile, Users];
// The OS suite renders 12 modules in the same order as `osSuite.modules`
// in lib/i18n/landing, keep the icons aligned with that list.
const OS_ICONS = [
  Briefcase,       // Corporate Secretary OS
  Building2,       // Company Formation OS
  GitBranch,       // Workflow OS
  ShieldCheckIcon, // Governance OS
  Wallet,          // Billing OS
  BadgeCheck,      // Regulatory OS
  ScrollText,      // Document Management OS
  Library,         // Knowledge OS
  TrendingUp,      // IPO OS
  FolderKanban,    // M&A OS
  Scale,           // Fund Launch OS
  Brain,           // AI Legal Copilot
];
const BREAKTHROUGH_ICONS = [Compass, Brain, Bot, Radar, Sparkles];
const MOAT_ICONS = [GitBranch, Network, Radar, Gavel];

export default function LandingPage() {
  const [lang, setLang]   = useState<"en" | "ar">("en");
  const [view, setView]   = useState<"cards" | "table">("cards");
  const t: LangPack = lang === "en" ? EN : AR;

  return (
    <div dir={t.dir} className="min-h-screen bg-white" style={{ fontFamily: lang === "ar" ? "'IBM Plex Sans Arabic', Inter, sans-serif" : undefined }}>
      {/* NAV */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-midnight flex items-center justify-center text-white font-bold">L</div>
            <div className="font-semibold">Lexoni.ai</div>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm text-muted">
            <a href="#os">{lang === "en" ? "Operating system" : "نظام التشغيل"}</a>
            <a href="#breakthroughs">{lang === "en" ? "Breakthroughs" : "الإنجازات"}</a>
            <a href="#moat">{lang === "en" ? "Moat" : "الميزة"}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#security">{t.nav.security}</a>
            <Link href="/investors" className="text-royal font-medium">
              {lang === "en" ? "Partner with us" : "كن شريكاً"}
            </Link>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="btn-ghost text-xs"><Globe className="h-4 w-4" />{lang === "en" ? "العربية" : "English"}</button>
            <Link href="/signin" className="btn-ghost text-xs">{t.nav.signin}</Link>
            <Link href="/investors" className="btn-primary text-xs">
              {lang === "en" ? "Partner with us" : "كن شريكاً"}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas to-white" />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-royal uppercase">{t.hero.eyebrow}</div>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">{t.hero.title}</h1>
            <p className="mt-5 text-lg text-muted leading-relaxed">{t.hero.subtitle}</p>
            <div className="mt-7 flex items-center justify-center gap-3">
              <Link href="/investors" className="btn-primary text-sm">
                {lang === "en" ? "Partner with us" : "كن شريكاً"} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#pricing" className="btn-ghost text-sm border border-line">{t.hero.cta2}</a>
            </div>
            <p className="mt-5 text-xs text-muted flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> {t.hero.trust}
            </p>
          </div>

          {/* Hero device frame, Legal Matter Copilot in action.
              The single most demoable thing the product does: type an
              outcome, get a complete legal plan. This is the "wow." */}
          <div className="mt-14 max-w-5xl mx-auto card shadow-pop overflow-x-auto md:overflow-hidden">
            <div className="min-w-[820px] md:min-w-0">
            {/* Browser chrome */}
            <div className="h-9 bg-canvas border-b border-line flex items-center px-3 gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ms-3 text-[11px] text-muted font-mono">levant-legal.lexoni.ai/copilot</span>
            </div>

            <div className="grid grid-cols-12 min-h-[420px]">
              {/* Sidebar */}
              <div className="col-span-3 bg-midnight-900 text-slate-300 p-4 text-xs space-y-0.5">
                <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-3">Workspace</div>
                {[
                  { l: "My Desk",          d: false },
                  { l: "Firm Pulse",       d: false },
                  { l: "Matter Copilot",   d: true  },
                  { l: "Institutional Memory", d: false },
                  { l: "Document inbox",   d: false },
                  { l: "Precedents",       d: false },
                  { l: "Regulatory changes", d: false },
                  { l: "Engagement letters", d: false },
                  { l: "Billing",          d: false },
                ].map((it) => (
                  <div key={it.l} className={`px-2 py-1.5 rounded text-[11px] ${it.d ? "bg-royal/30 text-white font-medium" : ""}`}>{it.l}</div>
                ))}
              </div>

              {/* Main panel, Copilot output */}
              <div className="col-span-9 p-6 bg-canvas space-y-4">
                {/* Outcome prompt */}
                <div className="rounded-lg border border-line bg-white p-3 flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-md bg-royal/15 text-royal flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted">Outcome</div>
                    <div className="text-sm font-medium mt-0.5">"Take this company public on ADX."</div>
                  </div>
                  <div className="text-[10px] text-success-700 bg-success-50 border border-success-200 rounded-md px-1.5 py-0.5 shrink-0">
                    Plan ready · 8s
                  </div>
                </div>

                {/* KPI strip, the generated plan summary */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { k: "Confidence",  v: "84%",    sub: "from 11 historicals", tone: "success" },
                    { k: "Duration",    v: "270 d",  sub: "230–340 d band",      tone: "info" },
                    { k: "Fee range",   v: "$220k", sub: "to $480k (P80)",      tone: "info" },
                    { k: "Steps",       v: "11",     sub: "+ 10 doc slots",      tone: "neutral" },
                  ].map((m) => (
                    <div key={m.k} className="card p-2.5">
                      <div className="text-[9px] uppercase text-muted">{m.k}</div>
                      <div className="text-lg font-semibold leading-tight mt-0.5">{m.v}</div>
                      <div className="text-[9px] text-muted">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Steps + Regulators / Risks */}
                <div className="grid grid-cols-5 gap-3">
                  {/* Steps */}
                  <div className="col-span-3 card p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Plan · 11 steps</div>
                    <ol className="space-y-1 text-[11px]">
                      {[
                        { n: 1,  l: "Board approval to list",          ms: true,  d: 14 },
                        { n: 2,  l: "Audited financials (3y)",        ms: false, d: 60 },
                        { n: 3,  l: "Appoint advisers + lead manager",ms: false, d: 14 },
                        { n: 4,  l: "Restructuring + share capital",  ms: false, d: 30 },
                        { n: 5,  l: "Prospectus drafting",             ms: false, d: 60 },
                        { n: 6,  l: "SCA approval submission",         ms: true,  d: 45 },
                        { n: 7,  l: "ADX listing application",         ms: true,  d: 30 },
                        { n: 8,  l: "Roadshow + bookbuilding",         ms: false, d: 14 },
                      ].map((s) => (
                        <li key={s.n} className="flex items-baseline gap-2">
                          <span className="text-[9px] text-muted tabular-nums w-4 shrink-0">{String(s.n).padStart(2, "0")}</span>
                          <span className={`flex-1 truncate ${s.ms ? "font-semibold" : ""}`}>{s.l}</span>
                          {s.ms && <span className="text-[9px] bg-royal/10 text-royal rounded px-1 py-0.5 shrink-0">milestone</span>}
                          <span className="text-[9px] text-muted tabular-nums shrink-0">{s.d}d</span>
                        </li>
                      ))}
                      <li className="text-[10px] text-muted ms-6 mt-0.5">+ 3 more →</li>
                    </ol>
                  </div>

                  {/* Regulators + Risks stacked */}
                  <div className="col-span-2 space-y-3">
                    <div className="card p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Regulators</div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] bg-royal/10 text-royal rounded px-1.5 py-0.5">ADX</span>
                        <span className="text-[10px] bg-royal/10 text-royal rounded px-1.5 py-0.5">SCA</span>
                        <span className="text-[10px] bg-canvas text-muted rounded px-1.5 py-0.5 border border-line">MoE</span>
                      </div>
                    </div>
                    <div className="card p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Risks flagged</div>
                      <ul className="space-y-1.5 text-[11px]">
                        <li className="flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
                          <span><span className="font-medium">Regulator comment cycle</span><span className="text-muted"> · pre-filing meeting recommended</span></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                          <span><span className="font-medium">Market window</span><span className="text-muted"> · contingent debt facility</span></span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                          <span><span className="font-medium">RPT disclosure</span><span className="text-muted"> · independent committee</span></span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Grounded-in pill */}
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <span className="font-medium text-ink">Grounded in:</span>
                  <span className="bg-canvas border border-line rounded px-1.5 py-0.5">2023 · Falcon × Pearl ADX listing</span>
                  <span className="bg-canvas border border-line rounded px-1.5 py-0.5">2024 · Mawarid Industries (closed)</span>
                  <span className="bg-canvas border border-line rounded px-1.5 py-0.5">+4 firm precedents</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PHASE 2 POSITIONING ───────────────────────────────────────────
          The four sections below carry the GCC-Legal-OS narrative.
          Outcome → OS suite → Breakthroughs → Moat → Buyers. */}

      {/* OUTCOME, the positioning headline */}
      <section className="relative py-20 border-t border-line bg-gradient-to-b from-canvas to-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="sec-title">{t.outcome.eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15]">{t.outcome.title}</h2>
          <p className="mt-5 text-lg text-muted leading-relaxed max-w-3xl mx-auto">{t.outcome.subtitle}</p>
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-royal-100 text-royal-700 text-xs font-medium">
            <Compass className="h-3.5 w-3.5" /> {t.outcome.note}
          </div>
        </div>
      </section>

      {/* OS SUITE, the 12 modules */}
      <section id="os" className="py-20 border-t border-line">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="sec-title">{t.osSuite.eyebrow}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.osSuite.title}</h2>
            <p className="mt-3 text-muted">{t.osSuite.subtitle}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.osSuite.modules.map((m, i) => {
              const Icon = OS_ICONS[i] ?? Sparkles;
              const isLive = m.status === "live";
              return (
                <div key={m.name} className="card p-5 flex gap-3 items-start">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isLive ? "bg-success-100 text-success-700" : "bg-royal-100 text-royal-600"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm">{m.name}</div>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-medium ${isLive ? "bg-success-100 text-success-700" : "bg-royal-100 text-royal-700"}`}>
                        {isLive ? t.osSuite.statusLive : t.osSuite.statusNext}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1.5 leading-snug">{m.descr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BREAKTHROUGHS, the 5 capabilities */}
      <section id="breakthroughs" className="py-20 border-t border-line bg-canvas">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="sec-title">{t.breakthroughs.eyebrow}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.breakthroughs.title}</h2>
            <p className="mt-3 text-muted">{t.breakthroughs.subtitle}</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4">
            {t.breakthroughs.items.map((b, i) => {
              const Icon = BREAKTHROUGH_ICONS[i] ?? Sparkles;
              return (
                <div key={b.name} className="card p-6 md:p-7 grid grid-cols-12 gap-5 items-start">
                  <div className="col-span-12 md:col-span-1 flex md:block">
                    <div className="h-11 w-11 rounded-xl bg-royal text-white flex items-center justify-center"><Icon className="h-5 w-5" /></div>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted">#{(i + 1).toString().padStart(2, "0")}</div>
                    <div className="font-semibold mt-1 text-lg leading-tight">{b.name}</div>
                  </div>
                  <p className="col-span-12 md:col-span-8 text-body text-ink leading-relaxed">{b.descr}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIVE DEMO PANELS, Institutional Memory + Regulatory Impact.
          Mirrors the hero device-frame treatment so the page now has
          three concrete "this is what it looks like" surfaces investors +
          testers can read in 20 seconds each. */}
      <section className="py-20 border-t border-line bg-canvas/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="sec-title">{lang === "en" ? "See it in action" : "شاهده عمليًا"}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {lang === "en" ? "Two screens that change how a firm grows." : "شاشتان تغيّران طريقة نمو المكتب."}
            </h2>
            <p className="mt-3 text-muted">
              {lang === "en"
                ? "Institutional Memory answers \"have we ever done this before?\" in seconds. Growth Intelligence turns the firm's own history into a hunting map."
                : "تجيب الذاكرة المؤسسية على \"هل سبق أن نفّذنا هذا؟\" في ثوانٍ. ذكاء النمو يحوّل تاريخ المكتب نفسه إلى خريطة لاصطياد العملاء."}
            </p>
          </div>

          {/* MEMORY MOCKUP */}
          <div className="mt-14 max-w-5xl mx-auto card shadow-pop overflow-x-auto md:overflow-hidden">
            <div className="min-w-[820px] md:min-w-0">
            <div className="h-9 bg-canvas border-b border-line flex items-center px-3 gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ms-3 text-[11px] text-muted font-mono">levant-legal.lexoni.ai/memory</span>
            </div>
            <div className="grid grid-cols-12 min-h-[440px]">
              <div className="col-span-3 bg-midnight-900 text-slate-300 p-4 text-xs space-y-0.5">
                <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-3">Workspace</div>
                {[
                  { l: "My Desk",          d: false },
                  { l: "Firm Pulse",       d: false },
                  { l: "Matter Copilot",   d: false },
                  { l: "Institutional Memory", d: true },
                  { l: "Document inbox",   d: false },
                  { l: "Precedents",       d: false },
                  { l: "Regulatory changes", d: false },
                  { l: "Engagement letters", d: false },
                  { l: "Billing",          d: false },
                ].map((it) => (
                  <div key={it.l} className={`px-2 py-1.5 rounded text-[11px] ${it.d ? "bg-royal/30 text-white font-medium" : ""}`}>{it.l}</div>
                ))}
              </div>

              <div className="col-span-9 p-6 bg-canvas space-y-4">
                {/* Question */}
                <div className="rounded-lg border border-line bg-white p-3 flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-md bg-royal/15 text-royal flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted">Question · senior associate</div>
                    <div className="text-sm font-medium mt-0.5">"Have we ever closed a Saudi JV between a US-listed acquirer and a family-owned target?"</div>
                  </div>
                  <div className="text-[10px] text-success-700 bg-success-50 border border-success-200 rounded-md px-1.5 py-0.5 shrink-0">
                    Answered · 3.2s
                  </div>
                </div>

                {/* Stat strip */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { k: "Chunks searched", v: "12,847", sub: "wall-aware" },
                    { k: "Documents",       v: "1,203",  sub: "executed + drafts" },
                    { k: "Precedents",      v: "89",     sub: "approved + tagged" },
                    { k: "Citations",       v: "6",      sub: "in answer" },
                  ].map((m) => (
                    <div key={m.k} className="card p-2.5">
                      <div className="text-[9px] uppercase text-muted">{m.k}</div>
                      <div className="text-lg font-semibold leading-tight mt-0.5">{m.v}</div>
                      <div className="text-[9px] text-muted">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Answer + sources */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3 card p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Answer · partner-voice</div>
                    <p className="text-[11px] leading-relaxed text-ink">
                      <span className="font-medium">Yes</span>-two closely-matched transactions. <span className="bg-royal/10 text-royal rounded px-1">[1]</span> <span className="font-medium">2023, Falcon Industries × Riyadh Cement</span> (closed, lead: Mona Faraj). Used Form A indemnity caps + Form C escrow; Nitaqat-compliance flag at closing held up signing by 3 weeks <span className="bg-royal/10 text-royal rounded px-1">[3]</span>. <span className="bg-royal/10 text-royal rounded px-1">[2]</span> <span className="font-medium">2021, Pearl Holdings × Jeddah Logistics</span> (terminated pre-SPA on price). See the 2023-08-14 partner memo on <em>Saudisation cliff in JV closings</em> <span className="bg-royal/10 text-royal rounded px-1">[4]</span>.
                    </p>
                  </div>
                  <div className="col-span-2 card p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Sources</div>
                    <ul className="space-y-1.5 text-[10px]">
                      {[
                        { n: 1, kind: "Matter",    title: "Falcon × Riyadh Cement",        meta: "SPA · 2023 · closed",      tone: "bg-success-50 text-success-700 border-success-200" },
                        { n: 2, kind: "Matter",    title: "Pearl × Jeddah Logistics",      meta: "term sheet · 2021",        tone: "bg-canvas text-muted border-line" },
                        { n: 3, kind: "Precedent", title: "Form A indemnity caps",         meta: "approved · tagged JV",      tone: "bg-royal/10 text-royal border-royal/20" },
                        { n: 4, kind: "Memo",      title: "Saudisation cliff · partner",   meta: "2023-08-14 · M.Faraj",     tone: "bg-warning-50 text-warning-700 border-warning-200" },
                      ].map((s) => (
                        <li key={s.n} className="rounded-md border border-line p-1.5 bg-white">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted tabular-nums">[{s.n}]</span>
                            <span className={`rounded px-1 py-0.5 border ${s.tone}`}>{s.kind}</span>
                          </div>
                          <div className="font-medium truncate mt-0.5">{s.title}</div>
                          <div className="text-muted truncate">{s.meta}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <Lock className="h-3 w-3" />
                  <span><span className="font-medium text-ink">Wall-aware:</span> {`8 walled chunks excluded from this answer; the requester is not in those walls.`}</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* GROWTH INTELLIGENCE MOCKUP */}
          <div className="mt-12 max-w-5xl mx-auto card shadow-pop overflow-x-auto md:overflow-hidden">
            <div className="min-w-[820px] md:min-w-0">
            <div className="h-9 bg-canvas border-b border-line flex items-center px-3 gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ms-3 text-[11px] text-muted font-mono">levant-legal.lexoni.ai/growth</span>
            </div>
            <div className="grid grid-cols-12 min-h-[460px]">
              <div className="col-span-3 bg-midnight-900 text-slate-300 p-4 text-xs space-y-0.5">
                <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-3">Workspace</div>
                {[
                  { l: "My Desk",          d: false },
                  { l: "Firm Pulse",       d: false },
                  { l: "Matter Copilot",   d: false },
                  { l: "Institutional Memory", d: false },
                  { l: "Document inbox",   d: false },
                  { l: "Regulatory changes", d: false },
                  { l: "Billing",          d: false },
                  { l: "Profitability",    d: false },
                  { l: "Growth Intelligence", d: true },
                ].map((it) => (
                  <div key={it.l} className={`px-2 py-1.5 rounded text-[11px] ${it.d ? "bg-royal/30 text-white font-medium" : ""}`}>{it.l}</div>
                ))}
              </div>

              <div className="col-span-9 p-6 bg-canvas space-y-4">
                {/* Headline */}
                <div className="rounded-lg border border-line bg-white p-3 flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-md bg-success/15 text-success-700 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted">Headline · managing partner</div>
                    <div className="text-sm font-medium mt-0.5">M&A buy-side up <span className="text-success-700">+38%</span> in 6 months, and 38 of your clients are affected by the new ZATCA rule.</div>
                  </div>
                  <div className="text-[10px] text-success-700 bg-success-50 border border-success-200 rounded-md px-1.5 py-0.5 shrink-0 whitespace-nowrap">
                    Live · refreshes hourly
                  </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { k: "Total LTV",   v: "$4.8M",  sub: "47 clients",        tone: "success" },
                    { k: "Win rate",    v: "62%",    sub: "intake → engaged",  tone: "success" },
                    { k: "Lapsed",      v: "8",      sub: ">12mo, recover ready", tone: "warning" },
                    { k: "Prospects",   v: "147",    sub: "62 high-fit",       tone: "info" },
                  ].map((m) => (
                    <div key={m.k} className="card p-2.5">
                      <div className="text-[9px] uppercase text-muted">{m.k}</div>
                      <div className={`text-lg font-semibold leading-tight mt-0.5 ${m.tone === "success" ? "text-success-700" : m.tone === "warning" ? "text-warning-700" : ""}`}>{m.v}</div>
                      <div className="text-[9px] text-muted">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Practice momentum + Headlines */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3 card p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Practice momentum · last 12 months</div>
                    <ul className="space-y-1 text-[11px]">
                      {[
                        { l: "M&A buy-side",       n: 18, v: "$1.2M", g: 38 },
                        { l: "IPO / go-public",    n: 5,  v: "$840k", g: 24 },
                        { l: "Fund launch",        n: 11, v: "$620k", g: 15 },
                        { l: "Licensing / reg.",   n: 24, v: "$510k", g: 8 },
                        { l: "Company formation",  n: 31, v: "$460k", g: 3 },
                        { l: "Litigation",         n: 9,  v: "$380k", g: -12 },
                        { l: "Employment",         n: 14, v: "$210k", g: -22 },
                      ].map((r, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-md border border-line bg-white p-1.5">
                          <span className="flex-1 truncate font-medium">{r.l}</span>
                          <span className="text-muted tabular-nums w-8 text-end">{r.n}</span>
                          <span className="text-muted tabular-nums w-14 text-end">{r.v}</span>
                          <span className="w-20 flex items-center gap-1.5 shrink-0">
                            <span className="flex-1 h-1 bg-line rounded overflow-hidden">
                              <span className={`block h-full ${r.g > 20 ? "bg-success-600" : r.g > 0 ? "bg-success-300" : r.g < -10 ? "bg-danger-500" : "bg-warning-400"}`} style={{ width: `${Math.min(100, Math.abs(r.g))}%` }} />
                            </span>
                            <span className={`tabular-nums ${r.g > 0 ? "text-success-700" : "text-danger-700"}`}>{r.g > 0 ? "+" : ""}{r.g}%</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-span-2 space-y-3">
                    <div className="card p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Depth radar · top-5</div>
                      <ul className="space-y-1 text-[10px]">
                        {[
                          { l: "Company formation", n: 31, t: "91% on-time" },
                          { l: "Licensing / reg.",  n: 24, t: "86% on-time" },
                          { l: "M&A buy-side",      n: 18, t: "78% on-time" },
                          { l: "Employment",        n: 14, t: "92% on-time" },
                          { l: "Fund launch",       n: 11, t: "74% on-time" },
                        ].map((d, i) => (
                          <li key={i} className="flex items-center justify-between rounded-md bg-white border border-line p-1.5">
                            <span className="font-medium">{d.l}</span>
                            <span className="text-muted">{d.n} · {d.t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card p-3 bg-success-50/40 border-success-200">
                      <div className="text-[10px] uppercase tracking-wider text-success-700 mb-1">Hunting tip</div>
                      <p className="text-[10px] text-ink leading-relaxed">147 prospects added from the ZATCA Phase 2 assessment, 62 score &gt; 70 on lookalike. Estimated pipeline value <span className="font-semibold">$1.86M</span>.</p>
                      <div className="mt-1.5 text-[10px] text-success-700 font-medium">Open prospect queue →</div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  <span><span className="font-medium text-ink">AI outreach</span> drafts the first 47 emails using your firm's voice + ZATCA hook. Partner reviews, sends in batches via Resend, conversions tracked back to intakes.</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted mt-10 max-w-2xl mx-auto">
            {lang === "en"
              ? "Both screens are live in the product. Sign in to /memory and /growth."
              : "الشاشتان متاحتان في المنتج."}
          </p>
        </div>
      </section>

      {/* MOAT, the 4 defensible IP layers */}
      <section id="moat" className="py-20 border-t border-line">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="sec-title">{t.moat.eyebrow}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.moat.title}</h2>
            <p className="mt-3 text-muted">{t.moat.subtitle}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.moat.items.map((m, i) => {
              const Icon = MOAT_ICONS[i] ?? Sparkles;
              return (
                <div key={m.name} className="card p-6 relative overflow-hidden">
                  <div className="absolute top-3 end-3 text-[10px] uppercase tracking-wider text-muted font-medium">{lang === "en" ? "IP layer" : "طبقة الملكية"} · {i + 1}</div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-midnight-900 text-white flex items-center justify-center"><Icon className="h-5 w-5" /></div>
                    <div className="font-semibold">{m.name}</div>
                  </div>
                  <p className="text-sm text-muted mt-3 leading-relaxed">{m.descr}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BUYERS, six channels for the same OS */}
      <section className="py-20 border-t border-line bg-canvas">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <div className="sec-title">{t.buyers.eyebrow}</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.buyers.title}</h2>
              <p className="mt-3 text-muted">{t.buyers.subtitle}</p>
            </div>
            <ul className="space-y-2.5">
              {t.buyers.items.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-royal-100 text-royal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-body">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* END-BUYS */}
      <section id="product" className="py-20 border-t border-line">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="sec-title">5 Outcomes</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.endBuys.title}</h2>
            <p className="mt-3 text-muted">{t.endBuys.subtitle}</p>
            <div className="mt-6 inline-flex border border-line rounded-lg p-1 bg-canvas text-xs">
              <button onClick={() => setView("cards")}
                className={`px-3 py-1.5 rounded-md ${view === "cards" ? "bg-white shadow-sm font-medium" : "text-muted"}`}>
                {lang === "en" ? "Cards" : "بطاقات"}
              </button>
              <button onClick={() => setView("table")}
                className={`px-3 py-1.5 rounded-md ${view === "table" ? "bg-white shadow-sm font-medium" : "text-muted"}`}>
                {lang === "en" ? "Table" : "جدول"}
              </button>
            </div>
          </div>

          {view === "cards" ? (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {t.buys.map((b, i) => {
                const Icon = BUY_ICONS[i] ?? Sparkles;
                return (
                  <div key={b.label} className="card p-5 flex flex-col">
                    <div className="h-9 w-9 rounded-lg bg-royal-100 text-royal-600 flex items-center justify-center"><Icon className="h-5 w-5" /></div>
                    <div className="text-[10px] uppercase tracking-wider text-muted mt-4">{b.short}</div>
                    <div className="font-semibold mt-1">{b.label}</div>
                    <p className="text-sm text-muted mt-2 flex-1">{b.body}</p>
                    <div className="mt-4 pt-4 border-t border-line">
                      <div className="text-2xl font-semibold tracking-tight text-royal">{b.proofStat}</div>
                      <div className="text-[11px] text-muted">{b.proofLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 card overflow-hidden">
              <table className="tbl">
                <thead><tr>
                  <th>{lang === "en" ? "Pillar" : "الركيزة"}</th>
                  <th>{lang === "en" ? "What changes" : "ما الذي يتغير"}</th>
                  <th>{lang === "en" ? "Result" : "النتيجة"}</th>
                </tr></thead>
                <tbody>
                  {t.buys.map((b, i) => {
                    const Icon = BUY_ICONS[i] ?? Sparkles;
                    return (
                      <tr key={b.label}>
                        <td className="font-semibold align-top">
                          <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-royal" />{b.label}</div>
                        </td>
                        <td className="text-sm text-muted">{b.body}</td>
                        <td className="align-top">
                          <div className="text-xl font-semibold text-royal">{b.proofStat}</div>
                          <div className="text-[11px] text-muted">{b.proofLabel}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* JUNIOR COACHING, "a senior at your elbow" */}
      <section id="coaching" className="py-20 border-t border-line bg-gradient-to-b from-canvas to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 sec-title text-royal">
              <GraduationCap className="h-3.5 w-3.5" /> {t.coaching.eyebrow}
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">{t.coaching.title}</h2>
            <p className="mt-4 text-muted leading-relaxed">{t.coaching.subtitle}</p>
          </div>

          <div className="mt-12 grid lg:grid-cols-5 gap-6 items-start">
            {/* Feature cards, 3 of 4 in left column, plus a fourth wide card */}
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
              {t.coaching.items.map((it, i) => {
                const Icon = [BookOpen, Info, ShieldCheck, MessageSquare][i] ?? Sparkles;
                return (
                  <div key={i} className="card p-5 flex flex-col h-full">
                    <div className="h-9 w-9 rounded-lg bg-royal-100 text-royal-600 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-semibold mt-4">{it.title}</div>
                    <p className="text-sm text-muted mt-2 leading-relaxed">{it.body}</p>
                  </div>
                );
              })}
            </div>

            {/* Right preview column, mocks of the actual in-app tooltips */}
            <div className="lg:col-span-2 space-y-4">
              {/* Glossary tooltip preview */}
              <div className="card p-5 shadow-pop">
                <div className="text-[11px] uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" /> {lang === "en" ? "Hover any term" : "مرّر فوق أي مصطلح"}
                </div>
                <div className="text-sm leading-relaxed">
                  {lang === "en" ? "Verify the " : "تحقّق من "}
                  <span className="inline-flex items-center gap-0.5 underline decoration-dotted decoration-royal/60 underline-offset-2 text-royal-700">
                    {t.coaching.sampleTermLabel}<GraduationCap className="h-3 w-3" />
                  </span>
                  {lang === "en" ? " before opening the matter." : " قبل فتح القضية."}
                </div>
                <div className="mt-3 card bg-canvas p-3 border-royal/30">
                  <div className="text-xs font-semibold text-royal mb-1">{t.coaching.sampleTermLabel}</div>
                  <div className="text-xs leading-snug text-ink">{t.coaching.sampleTermDefinition}</div>
                </div>
              </div>

              {/* Step explainer preview */}
              <div className="card p-5 shadow-pop">
                <div className="text-[11px] uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                  <Info className="h-3 w-3" /> {lang === "en" ? "Click any (i) on a step" : "اضغط (i) بجانب أي خطوة"}
                </div>
                <div className="text-sm font-medium flex items-center gap-1.5">
                  {t.coaching.sampleStepTitle}
                  <Info className="h-3.5 w-3.5 text-royal-600" />
                </div>
                <div className="mt-3 space-y-2 text-xs leading-snug">
                  <div className="flex items-start gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-royal-700 mt-0.5 shrink-0" />
                    <span>{t.coaching.sampleStepWhy}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning-700 mt-0.5 shrink-0" />
                    <span>{t.coaching.sampleStepWatch}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10 text-sm text-muted italic">{t.coaching.outro}</div>
        </div>
      </section>

      {/* NORTH STAR, Company Health Score */}
      <section className="py-20 border-t border-line">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="sec-title">{lang === "en" ? "North Star" : "النجم الشمالي"}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.northStar.title}</h2>
            <p className="mt-3 text-muted leading-relaxed">{t.northStar.subtitle}</p>
            <div className="mt-6 card p-5 bg-canvas">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-royal shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">{t.northStar.cta}</div>
                  <p className="text-xs text-muted mt-2 leading-relaxed">{t.northStar.ctaSub}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client health dashboard mock, what a lawyer sees for each client in their book */}
          <div className="card shadow-pop overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted">{t.northStar.scoreLabel}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tight">{t.northStar.score}</span>
                  <span className="text-sm text-muted">/ 100</span>
                </div>
              </div>
              <div className="text-end">
                <div className="text-[11px] uppercase tracking-wider text-muted">{lang === "en" ? "Status" : "الحالة"}</div>
                <span className="chip-warning mt-1 inline-flex">{lang === "en" ? "1 critical · 2 warnings" : "حرج 1 · تحذيرات 2"}</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="px-5 pt-4">
              <div className="h-2 rounded bg-line overflow-hidden flex">
                <div className="bg-success h-full" style={{ width: "78%" }} />
                <div className="bg-warning h-full" style={{ width: "14%" }} />
                <div className="bg-danger  h-full" style={{ width: "8%"  }} />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <HealthGroup tone="success" title={lang === "en" ? "Green" : "أخضر"} items={t.northStar.green} />
              <HealthGroup tone="warning" title={lang === "en" ? "Yellow" : "أصفر"} items={t.northStar.yellow} />
              <HealthGroup tone="danger"  title={lang === "en" ? "Red"    : "أحمر"} items={t.northStar.red}>
                <Link href="/investors" className="btn-primary text-xs">
                  <Sparkles className="h-3.5 w-3.5" /> {lang === "en" ? "Partner with us" : "كن شريكاً"}
                </Link>
              </HealthGroup>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="templates" className="py-20 border-t border-line bg-canvas">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="sec-title">{lang === "en" ? "Flow" : "السير"}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.how.title}</h2>
            <p className="mt-3 text-muted">{t.how.subtitle}</p>
          </div>
          <ol className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.how.steps.map((step, i) => (
              <li key={i} className="card p-5">
                <div className="h-8 w-8 rounded-full bg-midnight text-white flex items-center justify-center text-xs font-semibold">{i + 1}</div>
                <p className="text-sm mt-3 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TRUST */}
      <section id="security" className="py-20 border-t border-line">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="sec-title">{lang === "en" ? "Trust" : "الثقة"}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.trust.title}</h2>
            <p className="mt-3 text-muted">
              {lang === "en"
                ? "GCC firms are conservative, and they should be. Here is what they get on day one."
                : "مكاتب المحاماة الخليجية محافظة, وذلك مبرَّر. إليكم ما تحصلون عليه من اليوم الأول."}
            </p>
          </div>
          <ul className="space-y-3">
            {t.trust.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 border-t border-line bg-canvas">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="sec-title">{lang === "en" ? "Pricing" : "الأسعار"}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.pricing.title}</h2>
            <p className="mt-3 text-muted">{t.pricing.subtitle}</p>
            <p className="mt-1 text-xs text-muted">{t.pricing.monthly}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const priceText = p.priceMinUsd === "custom"
                ? (lang === "en" ? "Custom" : "مخصص")
                : p.priceMaxUsd && p.priceMaxUsd !== p.priceMinUsd
                  ? `$${p.priceMinUsd}–$${p.priceMaxUsd}`
                  : `$${p.priceMinUsd}`;
              return (
                <div key={p.tier} className={`card p-6 flex flex-col ${p.highlight ? "ring-2 ring-royal relative" : ""}`}>
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-royal text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      {t.pricing.mostPopular}
                    </div>
                  )}
                  <div className="font-semibold text-lg">{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold">{priceText}</span>
                    {p.priceMinUsd !== "custom" && <span className="text-sm text-muted">{t.pricing.perMonth}</span>}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {p.entitiesIncluded === "unlimited"
                      ? (lang === "en" ? "Unlimited entities" : "كيانات غير محدودة")
                      : (lang === "en"
                          ? `${p.entitiesIncluded} ${p.entitiesIncluded === 1 ? "entity" : "entities"} included`
                          : `${p.entitiesIncluded} ${p.entitiesIncluded === 1 ? "كيان" : "كيانات"} مشمولة`)}
                  </div>
                  <ul className="mt-5 space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 pt-4 border-t border-line">
                    <div className="text-[11px] uppercase tracking-wider text-muted">{lang === "en" ? "Best for" : "الأفضل لـ"}</div>
                    <ul className="mt-2 space-y-0.5">
                      {p.target.map((tg) => <li key={tg} className="text-xs text-ink">· {tg}</li>)}
                    </ul>
                  </div>
                  <Link href="/investors" className={`mt-5 text-sm text-center ${p.highlight || p.tier === "enterprise" ? "btn-primary" : "btn-ghost border border-line"}`}>
                    {lang === "en" ? "Partner with us" : "كن شريكاً"}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Entity-based pricing teaser */}
          <div className="mt-8 card p-6">
            <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
              <div>
                <div className="text-[11px] font-semibold tracking-wider uppercase text-royal">{lang === "en" ? "Entity-based add-on" : "إضافة بحسب الكيانات"}</div>
                <h3 className="mt-1 text-xl font-semibold">{lang === "en" ? "Pay for the client entities you manage, not for seats." : "ادفع مقابل كيانات العملاء التي تديرها, لا مقابل المقاعد."}</h3>
                <p className="text-sm text-muted mt-1 max-w-xl">
                  {lang === "en"
                    ? "First client entity included. 2–10: $20 each / month. 11–50: $15 each / month. 51+: custom. A firm with 200 client entities scales naturally, and so does your revenue with us."
                    : "كيان العميل الأول مشمول. 2-10: 20$ شهرياً لكل كيان. 11-50: 15$ شهرياً لكل كيان. 51+: مخصص. مكتب لديه 200 كيان عميل ينمو بشكل طبيعي, وتنمو إيراداتك معنا بنفس النسبة."}
                </p>
              </div>
              <Link href="/investors" className="btn-primary text-sm shrink-0">{lang === "en" ? "Talk to the CEO" : "تواصل مع الرئيس التنفيذي"} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="mt-10 card p-6">
            <div className="font-semibold">{t.pricing.addOns}</div>
            <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted">
              {t.pricing.addOnItems.map((a) => (
                <li key={a} className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-royal mt-0.5" />{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-line">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-center">{t.faq.title}</h2>
          <div className="mt-8 space-y-3">
            {t.faq.items.map((item) => (
              <details key={item.q} className="card p-5 group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium">{item.q}</span>
                  <ChevronRight className="h-4 w-4 text-muted group-open:rotate-90 transition" />
                </summary>
                <p className="mt-3 text-sm text-muted leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR */}
      <section className="py-20 border-t border-line bg-canvas/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="sec-title">{lang === "en" ? "The economics" : "الاقتصاديات"}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {lang === "en"
                ? "What Lexoni saves a 10-lawyer GCC firm in a year."
                : "ما يوفّره Lexoni لمكتب من 10 محامين في الخليج خلال عام."}
            </h2>
            <p className="mt-3 text-muted">
              {lang === "en"
                ? "Based on benchmark studies of regional law firms and our internal pilot data. Numbers conservative."
                : "بناءً على دراسات مرجعية لمكاتب المحاماة الإقليمية وبيانات الإطلاق الداخلية. الأرقام متحفّظة."}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6 text-center">
              <div className="text-display tabular-nums text-royal">$120k</div>
              <div className="text-body-sm font-medium mt-2">
                {lang === "en" ? "Partner time recovered" : "وقت الشركاء المُستردّ"}
              </div>
              <div className="text-caption text-muted mt-1.5 leading-relaxed">
                {lang === "en"
                  ? "6 to 8 hours per associate per week of template work, automated. At a $400/h partner rate, that's $90k to $140k of senior time recovered annually."
                  : "6 إلى 8 ساعات أسبوعياً لكل محامٍ من أعمال النماذج، مؤتمتة. عند سعر شريك 400 دولار/الساعة، يعادل ذلك 90 إلى 140 ألف دولار سنوياً من الوقت المسترد."}
              </div>
            </div>

            <div className="card p-6 text-center">
              <div className="text-display tabular-nums text-royal">+30%</div>
              <div className="text-body-sm font-medium mt-2">
                {lang === "en" ? "Time capture, zero leakage" : "تسجيل الوقت، صفر تسرّب"}
              </div>
              <div className="text-caption text-muted mt-1.5 leading-relaxed">
                {lang === "en"
                  ? "Passive capture from Outlook, Teams, WhatsApp and your editor. Average firm recovers 30 to 45 percent of currently-unbilled hours."
                  : "تسجيل سلبي من Outlook وTeams وواتساب ومحرّرك. يستعيد المكتب المتوسط 30 إلى 45 بالمئة من الساعات غير المُفوترة حالياً."}
              </div>
            </div>

            <div className="card p-6 text-center">
              <div className="text-display tabular-nums text-royal">$312k</div>
              <div className="text-body-sm font-medium mt-2">
                {lang === "en" ? "New revenue from regulator events" : "إيرادات جديدة من أحداث المنظّمين"}
              </div>
              <div className="text-caption text-muted mt-1.5 leading-relaxed">
                {lang === "en"
                  ? "One ZATCA Phase 2 update mapped against the firm's client book generated $312k of qualified pipeline in our internal benchmark. Repeats with every GCC regulator change."
                  : "تحديث ZATCA المرحلة الثانية الواحد، عند ربطه بمحفظة عملاء المكتب، أنتج 312 ألف دولار من الفرص المؤهلة في مرجعنا الداخلي. يتكرّر مع كل تغيير تنظيمي خليجي."}
              </div>
            </div>
          </div>

          <div className="mt-6 max-w-2xl mx-auto text-center">
            <p className="text-caption text-muted">
              {lang === "en"
                ? "Conservative blended payback: under 60 days for most firms."
                : "فترة استرداد متحفّظة: أقل من 60 يوماً لمعظم المكاتب."}
            </p>
          </div>
        </div>
      </section>

      {/* DESIGN PARTNER PROGRAM */}
      <section className="py-20 border-t border-line">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-2">
              <div className="sec-title">{lang === "en" ? "Design partner program" : "برنامج الشركاء المؤسّسين"}</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight leading-tight">
                {lang === "en"
                  ? "10 GCC firms. 90 days free. Founder access."
                  : "10 مكاتب خليجية. 90 يوماً مجاناً. وصول مباشر للمؤسس."}
              </h2>
              <p className="mt-4 text-muted leading-relaxed">
                {lang === "en"
                  ? "We are onboarding a small cohort of design partner firms across UAE and KSA in 2026. The program is built for boutique to mid-size firms (5 to 50 lawyers) ready to shape the product roadmap."
                  : "نستضيف مجموعة محدودة من المكاتب الشريكة المؤسّسة في الإمارات والسعودية خلال 2026. البرنامج مصمّم للمكاتب الصغيرة والمتوسطة (من 5 إلى 50 محامياً) المستعدّة لتشكيل خارطة طريق المنتج."}
              </p>
              <Link href="/investors#contact-trial" className="btn-primary text-sm mt-6 inline-flex">
                {lang === "en" ? "Apply to the program" : "قدّم للبرنامج"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  t: lang === "en" ? "90 days free, full functionality"             : "90 يوماً مجاناً مع كل الوظائف",
                  d: lang === "en" ? "Every module, unlimited matters, unlimited users for the first 90 days." : "كل الوحدات، قضايا غير محدودة، مستخدمون غير محدودين خلال 90 يوماً.",
                },
                {
                  t: lang === "en" ? "Dedicated onboarding manager"                : "مدير تأهيل مخصّص",
                  d: lang === "en" ? "We bring the playbook for your first three matter packs. You bring the matters."  : "نأتيك بدفتر إجراءات أوّل ثلاث حزم قضايا. تأتي أنت بالقضايا.",
                },
                {
                  t: lang === "en" ? "Direct founder access"                       : "وصول مباشر للمؤسس",
                  d: lang === "en" ? "WhatsApp + monthly call with Ashik. Feature requests reviewed the same week."  : "واتساب + مكالمة شهرية مع آشيك. مراجعة طلبات الميزات في الأسبوع نفسه.",
                },
                {
                  t: lang === "en" ? "Quarterly roadmap input"                     : "إسهام ربعي في خارطة الطريق",
                  d: lang === "en" ? "What we ship next is decided with your team. Design partners help write the spec." : "ما نطلقه تالياً يُحسم مع فريقك. الشركاء المؤسّسون يساعدون في صياغة المواصفات.",
                },
                {
                  t: lang === "en" ? "Founding member pricing, forever"            : "تسعير العضو المؤسّس، إلى الأبد",
                  d: lang === "en" ? "After day 90, lock in 40 percent off the published price for as long as you stay." : "بعد اليوم 90، اضمن خصم 40 بالمئة على السعر المنشور ما بقيت معنا.",
                },
                {
                  t: lang === "en" ? "Council of advisors seat"                    : "مقعد في مجلس المستشارين",
                  d: lang === "en" ? "Senior partners from the cohort are invited to our regional council of advisors." : "يُدعى الشركاء الأقدم من المجموعة إلى مجلسنا الإقليمي للمستشارين.",
                },
              ].map((b) => (
                <div key={b.t} className="card p-4">
                  <div className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-success-100 text-success-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="font-semibold text-body-sm">{b.t}</div>
                      <div className="text-caption text-muted mt-0.5 leading-relaxed">{b.d}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="py-20 border-t border-line bg-canvas/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="sec-title">{lang === "en" ? "Built by" : "بُني على يد"}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {lang === "en" ? "A founder based in Dubai, for the region." : "مؤسّس مقيم في دبي، لخدمة المنطقة."}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center max-w-5xl mx-auto">
            <div className="md:col-span-2 flex justify-center">
              <div className="relative">
                <Image
                  src="/ashik-karim.jpg"
                  alt="Ashik Karim, Founder and CEO, Lexoni.ai"
                  width={320}
                  height={320}
                  sizes="(max-width: 768px) 220px, 320px"
                  priority={false}
                  loading="lazy"
                  className="rounded-2xl shadow-pop w-full max-w-[320px] object-cover aspect-square border border-line"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="text-h3">Ashik Karim</div>
              <div className="text-caption text-muted mt-0.5">{lang === "en" ? "Founder & CEO" : "المؤسّس والرئيس التنفيذي"}</div>

              <p className="mt-4 text-body text-ink leading-relaxed">
                {lang === "en"
                  ? "Background in investment banking, corporate governance, public markets and M&A. Built Lexoni from Dubai because the region has world-class lawyers and second-best tools, and I wanted to close that gap."
                  : "خلفية في الاستثمار المصرفي وحوكمة الشركات والأسواق العامة والاندماج والاستحواذ. بنيتُ Lexoni من دبي لأن المنطقة لديها محامون من الطراز الأول وأدوات من الدرجة الثانية، وأردتُ سدّ هذه الفجوة."}
              </p>

              <blockquote className="mt-5 ps-4 border-s-2 border-royal text-body text-ink italic leading-relaxed">
                {lang === "en"
                  ? '"The next decade of regional law belongs to firms that turn their own historical work into an asset. That is what Lexoni is built to do."'
                  : '"العقد القادم للقانون الإقليمي ينتمي للمكاتب التي تحوّل أعمالها التاريخية إلى أصل. هذا ما بُني Lexoni لفعله."'}
              </blockquote>

              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <Link href="/investors" className="btn-primary text-sm">
                  {lang === "en" ? "Talk to the CEO" : "تواصل مع الرئيس التنفيذي"} <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://www.linkedin.com/in/ashikconsulting/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-sm border border-line"
                >
                  LinkedIn <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Built in Dubai trust strip */}
          <div className="mt-12 max-w-5xl mx-auto card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-h3">🇦🇪</div>
              <div className="text-caption font-semibold mt-1">{lang === "en" ? "Dubai HQ" : "المقر الرئيسي في دبي"}</div>
              <div className="text-caption text-muted">{lang === "en" ? "GCC focus 2026" : "تركيز خليجي 2026"}</div>
            </div>
            <div>
              <div className="text-h3"><ShieldCheck className="h-6 w-6 mx-auto text-royal" /></div>
              <div className="text-caption font-semibold mt-1">{lang === "en" ? "PDPL compliant" : "متوافق مع PDPL"}</div>
              <div className="text-caption text-muted">{lang === "en" ? "UAE + KSA" : "الإمارات + السعودية"}</div>
            </div>
            <div>
              <div className="text-h3"><Lock className="h-6 w-6 mx-auto text-royal" /></div>
              <div className="text-caption font-semibold mt-1">{lang === "en" ? "Residency-pinned" : "إقامة بيانات مثبتة"}</div>
              <div className="text-caption text-muted">{lang === "en" ? "Data stays in region" : "البيانات تبقى في المنطقة"}</div>
            </div>
            <div>
              <div className="text-h3"><Users className="h-6 w-6 mx-auto text-royal" /></div>
              <div className="text-caption font-semibold mt-1">{lang === "en" ? "Council of advisors" : "مجلس المستشارين"}</div>
              <div className="text-caption text-muted">{lang === "en" ? "Regional, forming" : "إقليمي، قيد التشكيل"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-line bg-midnight text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {lang === "en" ? "Stop hiring associates to do template work." : "توقّف عن توظيف محامين للقيام بأعمال النماذج."}
          </h2>
          <p className="mt-3 text-slate-300">
            {lang === "en" ? "We are onboarding a small cohort of design-partner firms across the GCC this quarter." : "نستضيف هذا الربع مجموعة محدودة من المكاتب الشريكة في الخليج."}
          </p>
          <Link href="/investors" className="btn-primary text-sm mt-6 inline-flex">{lang === "en" ? "Partner with us" : "كن شريكاً"} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-xs text-muted">
        <div>{t.footer.tagline}</div>
        <div className="mt-1.5 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/investors" className="hover:text-ink underline-offset-4 hover:underline">
            {lang === "en" ? "Partner with us" : "كن شريكاً"}
          </Link>
          <span>·</span>
          <Link href="/signin" className="hover:text-ink underline-offset-4 hover:underline">{t.nav.signin}</Link>
          <span>·</span>
          <Link href="/apply" className="hover:text-ink underline-offset-4 hover:underline">
            {lang === "en" ? "Client intake" : "استقبال العملاء"}
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-ink underline-offset-4 hover:underline">
            {lang === "en" ? "Privacy" : "الخصوصية"}
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-ink underline-offset-4 hover:underline">
            {lang === "en" ? "Terms" : "الشروط"}
          </Link>
        </div>
        <div className="mt-2">© Lexoni.ai · Dubai, UAE · {t.footer.rights}</div>
      </footer>
    </div>
  );
}

function HealthGroup({
  tone, title, items, children,
}: { tone: "success" | "warning" | "danger"; title: string; items: string[]; children?: React.ReactNode }) {
  const dot   = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger";
  const chip  = tone === "success" ? "chip-success" : tone === "warning" ? "chip-warning" : "chip-danger";
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`${chip} text-[10px]`}>{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i} className="text-xs leading-relaxed text-ink">· {i}</li>
        ))}
      </ul>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
