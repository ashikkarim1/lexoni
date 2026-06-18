import { Users } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function Page() {
  return (
    <ModuleEmpty
      icon={Users}
      title="Sellers"
      subtitle="Sellers and target companies for buy-side mandates."
      bullets={["Per-deal seller / target list", "Position in the funnel (sourced / contacted / NDA'd / DD)", "Linked to the matter's deal room"]}
      primary={{ label: "Open deals", href: "/ma/deals" }}
    />
  );
}
