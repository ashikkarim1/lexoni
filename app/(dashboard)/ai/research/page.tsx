import { BookOpen } from "lucide-react";
import { ModuleEmpty } from "@/components/ui/ModuleShell";

export default function ResearchPage() {
  return (
    <ModuleEmpty
      icon={BookOpen}
      title="Legal research"
      subtitle="Ask any legal question; the answer is grounded in your firm's approved precedents, clauses and GCC primary sources."
      bullets={[
        "Walled like everything else - only your firm's approved knowledge surfaces",
        "Citations resolve to the source clause or precedent in one click",
        "Ships behind /ai/research once the precedent index is populated",
      ]}
      primary={{ label: "Open knowledge base", href: "/knowledge" }}
      secondary={{ label: "Open clause library", href: "/ai/clauses" }}
    />
  );
}
