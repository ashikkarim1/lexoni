import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Brain, FileText, BookOpen, Mail, Library, Database } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { db, dbReady } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { tenantScope } from "@/lib/db/scoped";
import { getSession } from "@/lib/auth/session-server";
import { MemoryConsole } from "./MemoryConsole";

export const dynamic = "force-dynamic";

const SAMPLES = [
  "Have we ever closed a Saudi JV between a US listed acquirer and a family-owned target?",
  "Show me every SHA we drafted with anti-dilution for tech companies in UAE.",
  "Which ADX prospectus drafts have we filed where pricing slipped past the SCA window?",
  "When have we used Form A indemnity caps with Form C escrow on a sell-side mandate?",
];

async function countsByKind(session: Awaited<ReturnType<typeof getSession>>) {
  if (!dbReady) return { document: 0, precedent: 0, knowledge: 0, email: 0, total: 0 };
  const rows = await db
    .select({ kind: s.knowledgeChunks.sourceKind })
    .from(s.knowledgeChunks)
    .where(tenantScope(session, s.knowledgeChunks));
  const counts = { matter_document: 0, precedent: 0, knowledge_item: 0, matter_email: 0 };
  for (const r of rows) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  return {
    document: counts.matter_document,
    precedent: counts.precedent,
    knowledge: counts.knowledge_item,
    email: counts.matter_email,
    total: rows.length,
  };
}

export default async function MemoryPage() {
  const session = await getSession();
  const counts = await countsByKind(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Memory"
        subtitle="Ask the firm anything. Answers grounded in every executed document, precedent, opinion and filed email - wall-aware by construction."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Total chunks indexed"  value={counts.total}     icon={Database}  delta="across all sources" deltaTone="neutral" />
        <Kpi label="Document chunks"       value={counts.document}  icon={FileText}  delta="matter documents"   deltaTone="neutral" />
        <Kpi label="Precedent chunks"      value={counts.precedent} icon={BookOpen}  delta="precedent library"   deltaTone="neutral" />
        <Kpi label="Knowledge chunks"      value={counts.knowledge} icon={Library}   delta="approved + learnable" deltaTone="neutral" />
        <Kpi label="Email chunks"          value={counts.email}     icon={Mail}      delta="filed to matters"    deltaTone="neutral" />
      </div>

      <Card>
        <CardHeader title="Ask the firm" subtitle="The answer cites the underlying matter document, precedent, opinion or email." />
        <CardBody>
          <MemoryConsole samples={SAMPLES} totalChunks={counts.total} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="How this works" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm">
            <div>
              <div className="flex items-center gap-2 font-medium"><Brain className="h-4 w-4 text-primary-600" /> 1. Retrieve</div>
              <p className="text-caption text-muted mt-1.5">Your question is matched against the firm's chunk index. Walls + tenant isolation are enforced before scoring - non-members never see chunks from walled matters, period.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium"><BookOpen className="h-4 w-4 text-primary-600" /> 2. Ground</div>
              <p className="text-caption text-muted mt-1.5">Top chunks are passed to the partner-voice model. The answer can only reference what's in the chunks - no hallucinated matters, no invented parties.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium"><Database className="h-4 w-4 text-primary-600" /> 3. Cite</div>
              <p className="text-caption text-muted mt-1.5">Every claim cites a chunk; every chunk links back to the source document, precedent or matter. Click through to verify.</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
