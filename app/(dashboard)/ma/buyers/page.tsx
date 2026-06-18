import { Users } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function Page() {
  return (
    <ModuleEmpty
      icon={Users}
      title="Buyers"
      subtitle="Identified and prospective buyers for sell-side mandates."
      bullets={["Per-deal buyer list with status (cold / warm / engaged / signed)", "Bid history and counter-offers", "Confidentiality undertakings tracked per buyer"]}
      primary={{ label: "Open deals", href: "/ma/deals" }}
    />
  );
}
