import { MapPin } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function Page() {
  return (
    <ModuleEmpty
      icon={MapPin}
      title="Regulatory tasks"
      subtitle="Per-regulator action items beyond statutory filings - sanctions watchlists, AML, sectoral notifications."
      bullets={[
        "Routine filings live on /compliance/calendar",
        "Ad-hoc tasks land here once the sectoral connectors ship",
      ]}
      primary={{ label: "Open the compliance calendar", href: "/compliance/calendar" }}
    />
  );
}
