import { FilePen } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function Page() {
  return (
    <ModuleEmpty
      icon={FilePen}
      title="Letters of intent"
      subtitle="LOIs drafted from firm templates, sent for e-signature, executed into the matter."
      bullets={["Same engagement-letter pipeline, retuned for LOIs", "Counter-party + price + exclusivity terms extracted", "Binding vs. non-binding flag carried in the version metadata"]}
      primary={{ label: "Engagement letter pipeline", href: "/engagement-letters" }}
    />
  );
}
