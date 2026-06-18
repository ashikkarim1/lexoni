"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Globe, Plus, Moon, Menu, FolderKanban, Inbox, ShieldCheck } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import type { Session } from "@/lib/auth/session";
import { CoachToggle } from "@/components/coaching/CoachToggle";
import { CommandPalette, buildDefaultCommands } from "@/components/ui/CommandPalette";

/**
 * Topbar. Single keyboard surface (cmd-K) drives navigation + creation. The
 * search input is the command palette trigger - there is no second "search"
 * elsewhere.
 */
export function Topbar({ session }: { session: Session }) {
  const router = useRouter();
  const locale: Locale = session.locale;
  const openNav = () => window.dispatchEvent(new CustomEvent("lexoni:open-mobile-nav"));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const commands = buildDefaultCommands(locale);

  return (
    <div className="h-14 border-b border-line bg-surface flex items-center gap-2 sm:gap-3 px-3 sm:px-5">
      <button
        aria-label="Open menu"
        onClick={openNav}
        className="lg:hidden btn-ghost btn-sm -ms-1"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Command palette trigger - looks like search, behaves like cmd-K */}
      <button
        onClick={() => setPaletteOpen(true)}
        aria-label={t(locale, "topbar.searchOpen")}
        className="flex-1 max-w-2xl min-w-0 flex items-center gap-2 h-9 px-3 rounded-lg border border-line bg-canvas text-start text-body-sm text-muted hover:bg-surface hover:border-neutral-300 transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1 min-w-0 truncate">{t(locale, "common.search")}</span>
        <kbd className="text-caption text-muted bg-surface border border-line rounded px-1.5 py-0.5 shrink-0">⌘K</kbd>
      </button>

      <button
        className="hidden sm:inline-flex btn-ghost btn-sm"
        aria-label={t(locale, "topbar.switchLanguage")}
      >
        <Globe className="h-4 w-4" /> {locale.toUpperCase()}
      </button>

      <CoachToggle locale={locale} />

      <button className="hidden sm:inline-flex btn-ghost btn-sm" aria-label="Toggle theme">
        <Moon className="h-4 w-4" />
      </button>

      <button
        className="btn-ghost btn-sm relative"
        aria-label={t(locale, "topbar.notifications")}
      >
        <Bell className="h-4 w-4" />
        <span className="absolute top-1 end-1 h-1.5 w-1.5 rounded-full bg-danger-500" aria-hidden />
      </button>

      {/* Create-new menu - opens a small dropdown rather than doing nothing. */}
      <div className="relative hidden sm:inline-flex">
        <button
          onClick={() => setNewOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={newOpen}
          aria-label={t(locale, "topbar.newMenu")}
          className="btn-primary btn-sm"
        >
          <Plus className="h-4 w-4" /> {t(locale, "common.new")}
        </button>
        {newOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNewOpen(false)} aria-hidden />
            <div role="menu" className="absolute end-0 top-full mt-1 z-50 w-56 card-raised py-1 animate-slide-up">
              <button role="menuitem" onClick={() => { setNewOpen(false); router.push("/matters"); }} className="flex items-center gap-2 px-3 h-9 w-full text-start text-body-sm hover:bg-neutral-50">
                <FolderKanban className="h-4 w-4 text-muted" /> {t(locale, "topbar.newMatter")}
              </button>
              <button role="menuitem" onClick={() => { setNewOpen(false); router.push("/intake"); }} className="flex items-center gap-2 px-3 h-9 w-full text-start text-body-sm hover:bg-neutral-50">
                <Inbox className="h-4 w-4 text-muted" /> {t(locale, "topbar.newIntake")}
              </button>
              <button role="menuitem" onClick={() => { setNewOpen(false); router.push("/conflicts"); }} className="flex items-center gap-2 px-3 h-9 w-full text-start text-body-sm hover:bg-neutral-50">
                <ShieldCheck className="h-4 w-4 text-muted" /> {t(locale, "topbar.newConflict")}
              </button>
            </div>
          </>
        )}
      </div>

      <ProfileMenu session={session} />

      <CommandPalette locale={locale} commands={commands} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function ProfileMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center gap-2 ps-2 sm:ps-3 sm:border-s border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={session.fullName}
        className="flex items-center gap-2 rounded-md p-0.5 hover:bg-neutral-50"
      >
        <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-caption font-semibold">
          {session.fullName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
        </div>
        <div className="hidden md:block text-start">
          <div className="text-body-sm font-medium leading-none">{session.fullName}</div>
          <div className="text-caption text-muted mt-0.5">{session.role.replace("_", " ")}</div>
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute end-0 top-full mt-1 z-50 w-56 card-raised py-1 animate-slide-up">
            <div className="px-3 py-2 border-b border-line">
              <div className="text-caption text-muted">Signed in as</div>
              <div className="text-body-sm font-medium truncate">{session.email}</div>
            </div>
            <form action="/api/auth/signout" method="post">
              <button role="menuitem" type="submit" className="w-full text-start px-3 h-9 text-body-sm hover:bg-neutral-50">
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
