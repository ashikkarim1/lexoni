"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Home, FolderKanban, Inbox, Compass, Brain, BookOpen, Layers, Library, Wand2,
  Building2, ScrollText, FileText, Pen, CalendarClock, Briefcase,
  Gauge, TrendingUp, ClipboardList, FileSignature, Radar, ShieldCheck, Lock, Eye,
  Receipt, PiggyBank, Users2, Palette, GitBranch, Zap, Plug, Store, Tag, Settings,
  ChevronDown, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { t, type Locale } from "@/lib/i18n";
import type { Session, Role } from "@/lib/auth/session";
import { canSee } from "@/lib/auth/session";
import { Brand } from "@/components/ui/Brand";

/**
 * World-class IA, lawyer-first.
 *
 * The previous taxonomy organised by what we built (domain). The new one
 * organises by how lawyers actually work, with a single rule:
 *
 *   One workflow = one group. A lawyer never crosses a group boundary
 *   to finish a single task.
 *
 * Groups, top to bottom:
 *
 *   MY DAY      (untitled, always visible, default expanded)
 *               The personal rhythm. Desk, matters, inbox.
 *
 *   DRAFT & RESEARCH (default expanded for lawyers)
 *               The toolbox. Copilot, Memory, Precedents, Templates,
 *               Clauses, document automation. The drafting flow.
 *
 *   CLIENT BOOK (default collapsed)
 *               What the client owns. Entities, contracts, governance,
 *               compliance, deals. Lookup-driven.
 *
 *   FIRM        (default collapsed, partner-priority items hidden from lawyers)
 *               Partner & owner views. Firm Pulse, Growth, Intake,
 *               Regulatory, Conflicts & Walls, Billing & Profitability.
 *
 *   ADMIN       (default collapsed, firm_admin only)
 *               Settings, members, branding, integrations, privacy.
 *
 * Persistence: per-user localStorage key. Default state per role on first
 * visit. Version bumped when we change the contract.
 */
type Item  = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Restrict visibility. Undefined = visible to everyone the canSee() check allows. */
  roles?: Role[];
};
type Group = {
  id: string;
  title?: string;
  items: Item[];
  /** When this group's title is shown but its default state varies by role. */
  defaultExpandedFor?: Role[];
};

const groups = (locale: Locale): Group[] => [
  // ────────────────────────────────────────────────────────────
  // MY DAY  - untitled, always visible, lawyer-first
  // ────────────────────────────────────────────────────────────
  { id: "my-day", items: [
    { href: "/desk",     label: t(locale, "nav.desk"),    icon: Home },
    { href: "/matters",  label: t(locale, "nav.matters"), icon: FolderKanban },
    { href: "/my/inbox", label: t(locale, "nav.myInbox"), icon: Inbox },
  ]},

  // ────────────────────────────────────────────────────────────
  // DRAFT & RESEARCH  - the lawyer's toolbox, expanded by default
  // ────────────────────────────────────────────────────────────
  { id: "draft", title: t(locale, "nav.groupDraft"),
    defaultExpandedFor: ["lawyer", "lawyer_helper", "firm_admin", "platform_admin"],
    items: [
      { href: "/copilot",             label: t(locale, "nav.copilot"),    icon: Compass },
      { href: "/memory",              label: t(locale, "nav.memory"),     icon: Brain },
      { href: "/precedents",          label: t(locale, "nav.precedents"), icon: BookOpen },
      { href: "/templates",           label: t(locale, "nav.templates"),  icon: Layers },
      { href: "/ai/clauses",          label: t(locale, "nav.clauses"),    icon: Library },
      { href: "/document-automation", label: t(locale, "nav.docauto"),    icon: Wand2 },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // CLIENT BOOK  - the client's holdings, lookup view
  // ────────────────────────────────────────────────────────────
  { id: "clients", title: t(locale, "nav.groupClientBook"),
    defaultExpandedFor: ["firm_admin", "platform_admin"],
    items: [
      { href: "/companies",              label: t(locale, "nav.companies"),     icon: Building2 },
      { href: "/captable",               label: t(locale, "nav.captable"),      icon: ScrollText },
      { href: "/governance/board",       label: t(locale, "nav.board"),         icon: Briefcase },
      { href: "/contracts",              label: t(locale, "nav.contracts"),     icon: FileText },
      { href: "/contracts/signatures",   label: t(locale, "nav.signatures"),    icon: Pen },
      { href: "/compliance/calendar",    label: t(locale, "nav.calendar"),      icon: CalendarClock },
      { href: "/ma/deals",               label: t(locale, "nav.dealroom"),      icon: FolderKanban },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // FIRM  - partner & owner views. Most items hidden from lawyers.
  // ────────────────────────────────────────────────────────────
  { id: "firm", title: t(locale, "nav.groupFirm"),
    defaultExpandedFor: ["firm_admin", "platform_admin"],
    items: [
      { href: "/firm-dashboard",       label: t(locale, "nav.firmdash"),  icon: Gauge,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/growth",               label: t(locale, "nav.growth"),    icon: TrendingUp,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/intake",               label: t(locale, "nav.intake"),    icon: ClipboardList },
      { href: "/engagement-letters",   label: t(locale, "nav.engagement"),icon: FileSignature },
      { href: "/compliance/changes",   label: t(locale, "nav.regChanges"),icon: Radar },
      { href: "/conflicts",            label: t(locale, "nav.conflicts"), icon: ShieldCheck },
      { href: "/conflicts/walls",      label: t(locale, "nav.walls"),     icon: Lock,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/conflicts/access-log", label: t(locale, "nav.accessLog"), icon: Eye,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/knowledge",            label: t(locale, "nav.knowledge"), icon: Library },
      { href: "/billing",              label: t(locale, "nav.billing"),   icon: Receipt },
      { href: "/billing/collections",  label: t(locale, "nav.collections"),icon: PiggyBank,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/billing/profitability",label: t(locale, "nav.profit"),    icon: TrendingUp,
        roles: ["firm_admin", "platform_admin"] },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // ADMIN  - firm_admin only
  // ────────────────────────────────────────────────────────────
  { id: "admin", title: t(locale, "nav.groupAdmin"),
    defaultExpandedFor: [],
    items: [
      { href: "/settings",             label: t(locale, "nav.settings"),    icon: Settings,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/settings/account",     label: t(locale, "nav.account"),     icon: Receipt,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/settings/members",     label: t(locale, "nav.members"),     icon: Users2,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/settings/branding",    label: t(locale, "nav.branding"),    icon: Palette,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/settings/routing",     label: t(locale, "nav.routing"),     icon: GitBranch,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/settings/automations", label: t(locale, "nav.automations"), icon: Zap,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/integrations",         label: t(locale, "nav.integrations"),icon: Plug,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/gdpr",                 label: t(locale, "nav.gdpr"),        icon: Lock,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/marketplace/law-firms",label: t(locale, "nav.marketplace"), icon: Store,
        roles: ["firm_admin", "platform_admin"] },
      { href: "/pricing",              label: t(locale, "nav.pricing"),     icon: Tag,
        roles: ["firm_admin", "platform_admin"] },
    ],
  },
];

const STORAGE_KEY = "lexoni.nav.collapsed";
const VERSION_KEY = "lexoni.nav.collapsed.v";
/** Bump when the group structure changes so existing users get sensible defaults. */
const STORAGE_VERSION = 3;

function findGroupForPath(gs: Group[], pathname: string): string | undefined {
  for (const g of gs) {
    if (g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))) return g.id;
  }
}

/** Initial-state per role. Untitled groups are always flat-visible. */
function defaultsFor(gs: Group[], role: Role): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (const g of gs) {
    if (!g.title) continue;            // untitled groups are not collapsible
    const expanded = g.defaultExpandedFor ? g.defaultExpandedFor.includes(role) : false;
    m[g.id] = !expanded;
  }
  return m;
}

/** A single nav item, filtered by canSee + role. */
function itemVisible(item: Item, session: Session): boolean {
  if (!canSee(session, item.href)) return false;
  if (item.roles && !item.roles.includes(session.role)) return false;
  return true;
}

export function Sidebar({ session }: { session: Session }) {
  const pathname  = usePathname();
  const locale    = session.locale;
  const gs        = useMemo(() => groups(locale), [locale]);
  const activeGid = findGroupForPath(gs, pathname);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>(() => defaultsFor(gs, session.role));

  // Persistence: hydrate on mount, write on every toggle. Versioned so a
  // structural change rebuilds the defaults instead of stranding the user.
  useEffect(() => {
    try {
      const savedVersion = Number(localStorage.getItem(VERSION_KEY) ?? "0");
      const raw = localStorage.getItem(STORAGE_KEY);
      let next: Record<string, boolean>;
      if (!raw || savedVersion !== STORAGE_VERSION) {
        next = defaultsFor(gs, session.role);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
      } else {
        next = JSON.parse(raw) as Record<string, boolean>;
        // Heal: any new group that didn't exist in the saved blob picks up
        // its role-appropriate default rather than ending up undefined.
        const fresh = defaultsFor(gs, session.role);
        for (const k of Object.keys(fresh)) if (!(k in next)) next[k] = fresh[k];
      }
      if (activeGid) next[activeGid] = false;        // group with the current route stays open
      setCollapsed(next);
    } catch { /* ignore */ }
  }, [activeGid, gs, session.role]);

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
      } catch { /* ignore */ }
      return next;
    });
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const Body = (
    <>
      <div className="px-5 py-5 border-b border-neutral-700 flex items-center justify-between">
        <Brand className="text-white" />
        <button
          aria-label={t(locale, "common.cancel")}
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-neutral-300 hover:text-white p-1 rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-5 pt-3 -mt-1">
        <div className="text-caption text-neutral-400 leading-tight truncate" title={session.fullName}>
          {session.fullName}
        </div>
        <div className="text-caption text-neutral-500 mt-0.5 truncate" title={session.tenantName}>
          {session.tenantName} · {session.region}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {gs.map((g) => {
          const isCollapsed = !!collapsed[g.id];
          const visible = g.items.filter((i) => itemVisible(i, session));
          if (visible.length === 0) return null;

          if (!g.title) {
            return (
              <div key={g.id} className="space-y-0.5">
                {visible.map((i) => <NavLink key={i.href} item={i} pathname={pathname} />)}
              </div>
            );
          }

          return (
            <div key={g.id} className="mt-1">
              <button
                onClick={() => toggle(g.id)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center justify-between gap-2 px-3 mt-4 mb-1 text-caption font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors rounded-md"
              >
                <span>{g.title}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "-rotate-90")} />
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {visible.map((i) => <NavLink key={i.href} item={i} pathname={pathname} />)}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-neutral-700 text-caption text-neutral-400">
        v0.2 · {session.region} · {locale.toUpperCase()}
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-neutral-900 text-neutral-100">
        {Body}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-neutral-900 text-neutral-100 flex flex-col shadow-xl">
            {Body}
          </aside>
        </div>
      )}
    </>
  );
}

function NavLink({ item, pathname }: { item: Item; pathname: string }) {
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-md text-body-sm transition-colors",
        active
          ? "bg-royal/20 text-white font-medium"
          : "text-neutral-300 hover:bg-neutral-800 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
