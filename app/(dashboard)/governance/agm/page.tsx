import { ClipboardList } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function AgmPage() {
  return (
    <ModuleEmpty
      icon={ClipboardList}
      title="AGM management"
      subtitle="Annual general meeting orchestration - notices, agenda, voting items, attendance, minutes, and post-AGM filings."
      bullets={[
        "AGM filed under board_meetings (kind: 'agm') - see the board calendar",
        "Voting workflows are part of the resolutions module",
        "Post-AGM regulatory filings land on the compliance calendar",
      ]}
      primary={{ label: "Open board calendar", href: "/governance/board" }}
      secondary={{ label: "Open resolutions", href: "/governance/resolutions" }}
    />
  );
}
