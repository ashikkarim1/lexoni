import { FileCheck2 } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function ApprovalsPage() {
  return (
    <ModuleEmpty
      icon={FileCheck2}
      title="Approval chains"
      subtitle="Multi-step approval workflows for matters, contracts, invoices and exports. Configurable per firm."
      bullets={[
        "Matter open requires conflicts cleared (already wired)",
        "Export requires reason + DPO sign-off (already wired)",
        "Invoice and engagement counter-signing live under their own pages",
      ]}
      primary={{ label: "Conflicts & walls", href: "/conflicts" }}
      secondary={{ label: "Access log", href: "/conflicts/access-log" }}
    />
  );
}
