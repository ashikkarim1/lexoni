import { redirect } from "next/navigation";

/**
 * Dashboard / Desk merger. The lawyer-centric Desk is the single daily-open;
 * the generic manager dashboard is consolidated into Firm Pulse for partners
 * and Desk for fee-earners. Anyone still landing here is forwarded to the
 * right place - no broken bookmarks.
 */
export default function DashboardLegacyRedirect() {
  redirect("/desk");
}
