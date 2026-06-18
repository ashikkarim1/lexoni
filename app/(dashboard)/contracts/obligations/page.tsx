import { ListChecks } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function ObligationsPage() {
  return (
    <ModuleEmpty
      icon={ListChecks}
      title="Obligations"
      subtitle="Extracted obligations from every executed contract - who owes what, when, and with what consequence on breach."
      bullets={[
        "AI-extracted obligations from each executed contract version",
        "Per-party, per-date reminders that fire as the obligation comes due",
        "Tied to the source clause and the matter that authored it",
      ]}
      primary={{ label: "Open the contracts list", href: "/contracts" }}
    />
  );
}
