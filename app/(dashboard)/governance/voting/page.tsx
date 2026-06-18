import { BadgeCheck } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function VotingPage() {
  return (
    <ModuleEmpty
      icon={BadgeCheck}
      title="Voting"
      subtitle="Shareholder + board voting on resolutions - quorum check, vote capture, certified count, with a tamper-evident audit trail."
      bullets={[
        "Voting items are linked to the resolution they decide",
        "Per-shareholder weighted votes from the cap table",
        "Certified results signed into the resolution + board minutes",
      ]}
      primary={{ label: "Open resolutions", href: "/governance/resolutions" }}
    />
  );
}
