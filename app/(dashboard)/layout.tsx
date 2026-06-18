import dynamic from "next/dynamic";
import { Sidebar } from "@/components/nav/Sidebar";
import { Topbar }  from "@/components/nav/Topbar";
import { CoachingProvider } from "@/lib/coaching/state";
import { ToastProvider } from "@/components/ui/Toast";
import { SelectionProvider } from "@/lib/documents/selection";
import { getSession } from "@/lib/auth/session-server";
import { isRtl } from "@/lib/i18n";

/**
 * Authenticated dashboard layout.
 *
 * Reads session here (not in the root layout) so public pages stay static.
 * Sets the user's locale + RTL direction on a wrapper div so Arabic flows
 * correctly inside the app while the root <html> tag remains static.
 *
 * HelpWidget lazy-loads on the client (no SSR) so the dashboard's HTML
 * stream lands faster.
 */
const HelpWidget = dynamic(
  () => import("@/components/help/HelpWidget").then((m) => m.HelpWidget),
  { ssr: false, loading: () => null },
);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const dir = isRtl(session.locale) ? "rtl" : "ltr";
  return (
    <ToastProvider>
      <SelectionProvider>
      <CoachingProvider role={session.role}>
        <div lang={session.locale} dir={dir} className="flex min-h-screen">
          <Sidebar session={session} />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar session={session} />
            <main className="flex-1 overflow-y-auto bg-canvas">
              <div className="max-w-[1400px] mx-auto p-4 md:p-6">{children}</div>
            </main>
          </div>
        </div>
        <HelpWidget />
      </CoachingProvider>
      </SelectionProvider>
    </ToastProvider>
  );
}
