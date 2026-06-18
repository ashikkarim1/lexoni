"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Home, FolderKanban, Gauge, ShieldCheck, FileSignature, Settings, Library, LayoutDashboard, Inbox, Receipt, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { t, type Locale } from "@/lib/i18n";

/**
 * Global command palette. ⌘K / Ctrl-K opens it. Linear's biggest UX win,
 * scaled down - keyboard nav, fuzzy match by label, route to anywhere in two
 * keystrokes.
 *
 * The Topbar mounts <CommandPalette/> once and exposes a <CommandTrigger/>
 * input that opens it on click or focus.
 */

export type Command = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  onSelect?: () => void;
  icon?: typeof Search;
  group: "matters" | "navigation" | "actions" | "recent";
};

export function CommandPalette({
  locale,
  commands,
  open,
  onOpenChange,
}: {
  locale: Locale;
  commands: Command[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  // Reset on open.
  useEffect(() => { if (open) { setQ(""); setActive(0); } }, [open]);

  // ⌘K / Ctrl-K global shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(term) || c.hint?.toLowerCase().includes(term));
  }, [commands, q]);

  const groups: Array<[Command["group"], string]> = [
    ["recent",     t(locale, "cmdk.recent")],
    ["matters",    t(locale, "cmdk.matters")],
    ["navigation", t(locale, "cmdk.navigation")],
    ["actions",    t(locale, "cmdk.actions")],
  ];

  const visibleByGroup = groups.map(([g, title]) => [g, title, filtered.filter((c) => c.group === g)] as const)
    .filter(([, , items]) => items.length > 0);

  const flat = visibleByGroup.flatMap(([, , items]) => items);

  const runItem = (item: Command) => {
    onOpenChange(false);
    if (item.onSelect) return item.onSelect();
    if (item.href) router.push(item.href);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onOpenChange(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); const item = flat[active]; if (item) runItem(item); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flat, active]);

  if (!open) return null;

  return (
    <div className="scrim flex items-start justify-center p-4 pt-[12vh]" onClick={() => onOpenChange(false)} role="dialog" aria-modal="true" aria-label={t(locale, "cmdk.title")}>
      <div className="card-raised w-full max-w-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 h-12 border-b border-line">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder={t(locale, "cmdk.placeholder")}
            className="flex-1 bg-transparent text-body outline-none placeholder:text-muted"
            aria-label={t(locale, "cmdk.placeholder")}
          />
          <kbd className="text-caption text-muted bg-neutral-100 border border-line rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <div className="text-center text-body-sm text-muted py-10">{t(locale, "cmdk.empty")}</div>
          ) : (
            visibleByGroup.map(([group, title, items]) => (
              <div key={group} className="mb-3 last:mb-0">
                <div className="sec-title px-2 mb-1">{title}</div>
                <ul role="listbox">
                  {items.map((item) => {
                    const flatIdx = flat.indexOf(item);
                    const Icon = item.icon ?? ArrowRight;
                    const isActive = flatIdx === active;
                    return (
                      <li
                        key={item.id}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActive(flatIdx)}
                        onClick={() => runItem(item)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2 h-9 cursor-pointer text-body-sm",
                          isActive ? "bg-primary-50 text-primary-700" : "hover:bg-neutral-50",
                        )}
                      >
                        <Icon className="h-4 w-4 text-muted shrink-0" aria-hidden />
                        <span className="flex-1 min-w-0 truncate">{item.label}</span>
                        {item.hint && <span className="text-caption text-muted shrink-0">{item.hint}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="px-3 h-9 border-t border-line flex items-center gap-3 text-caption text-muted">
          <span className="inline-flex items-center gap-1"><kbd className="bg-neutral-100 border border-line rounded px-1">↑</kbd><kbd className="bg-neutral-100 border border-line rounded px-1">↓</kbd> {t(locale, "cmdk.navigate")}</span>
          <span className="inline-flex items-center gap-1"><kbd className="bg-neutral-100 border border-line rounded px-1">↵</kbd> {t(locale, "cmdk.select")}</span>
          <span className="ms-auto">{t(locale, "cmdk.hint")}</span>
        </div>
      </div>
    </div>
  );
}

/** Default command set seeded from the app's primary surfaces. Add more as
 *  features ship - every "+ New X" should land in `actions`, every list in
 *  `navigation`, every recently-touched item in `recent`. */
export function buildDefaultCommands(locale: Locale): Command[] {
  return [
    { id: "nav-desk",            label: t(locale, "nav.desk"),       icon: Home,           href: "/desk",            group: "navigation", hint: "G D" },
    { id: "nav-matters",         label: t(locale, "nav.matters"),    icon: FolderKanban,   href: "/matters",         group: "navigation", hint: "G M" },
    { id: "nav-firm",            label: t(locale, "nav.firmdash"),   icon: Gauge,          href: "/firm-dashboard",  group: "navigation", hint: "G F" },
    { id: "nav-conflicts",       label: t(locale, "nav.conflicts"),  icon: ShieldCheck,    href: "/conflicts",       group: "navigation" },
    { id: "nav-walls",           label: t(locale, "nav.walls"),      icon: Lock,           href: "/conflicts/walls", group: "navigation" },
    { id: "nav-accesslog",       label: t(locale, "nav.accessLog"),  icon: Eye,            href: "/conflicts/access-log", group: "navigation" },
    { id: "nav-intake",          label: t(locale, "nav.intake"),     icon: Inbox,          href: "/intake",          group: "navigation" },
    { id: "nav-engagement",      label: t(locale, "nav.engagement"), icon: FileSignature,  href: "/engagement-letters", group: "navigation" },
    { id: "nav-billing",         label: t(locale, "nav.billing"),    icon: Receipt,        href: "/billing",         group: "navigation" },
    { id: "nav-clauses",         label: t(locale, "nav.clauses"),    icon: Library,        href: "/ai/clauses",      group: "navigation" },
    { id: "nav-settings",        label: t(locale, "nav.settings"),   icon: Settings,       href: "/settings",        group: "navigation" },
  ];
}
