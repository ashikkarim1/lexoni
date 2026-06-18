import { GitCompare } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function CompareLanding() {
  return (
    <ModuleEmpty
      icon={GitCompare}
      title="Compare versions"
      subtitle="Word-level redline between any two uploaded versions, with an AI summary of what materially moved."
      bullets={[
        "Open the matter, then click Compare versions on any slot with multiple uploads",
        "Lives at /api/documents/compare - also reachable from the version-history dropdown",
      ]}
      primary={{ label: "Open your matters", href: "/matters" }}
    />
  );
}
