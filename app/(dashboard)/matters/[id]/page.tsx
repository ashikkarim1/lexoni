import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { getMatter } from "@/lib/data/matters";
import { listSlotTemplates } from "@/lib/data/slot-templates";
import { listBlockersForFirm } from "@/lib/data/desk";
import { describeMatterWall } from "@/lib/data/walls";
import { recordAccess } from "@/lib/data/access";
import { listDocumentsForSlots, type DocumentRow } from "@/lib/data/documents";
import { listMatterTimeline } from "@/lib/data/matter-timeline";
import { MatterWorkspace } from "./MatterWorkspace";
import { Timeline } from "./Timeline";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/** Process-ordered matter workspace - the signature flow. */
export default async function MatterPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const matter = await getMatter(session, params.id);
  if (!matter) return notFound();
  const [slotTemplates, allBlockers] = await Promise.all([
    listSlotTemplates(),
    listBlockersForFirm(session),
  ]);
  const matterBlockers = allBlockers.filter((b) => b.matterNumber === matter.matterNumber);
  const wall = await describeMatterWall(session, matter.id);

  // Uploaded documents per slot - keyed by slot id.
  const slotIds = matter.slots.map((s) => s.id);
  const docsBySlot = await listDocumentsForSlots(session, slotIds);
  const docsBySlotPlain: Record<string, DocumentRow[]> = {};
  for (const [slotId, docs] of docsBySlot.entries()) {
    // Serialise Date → JSON for the client boundary.
    docsBySlotPlain[slotId] = docs.map((d) => ({ ...d, uploadedAt: d.uploadedAt }));
  }

  // Every matter open is an audit-worthy event.
  await recordAccess(session, {
    action: "view",
    entityKind: "case",
    entityId: matter.id,
    caseId: matter.id,
  });

  const timeline = await listMatterTimeline(session, matter.id, 100);
  const timelineSerialised = timeline.map((e) => ({ ...e, at: e.at.toISOString() }));

  return (
    <div className="space-y-6">
      <MatterWorkspace
        matter={matter}
        templates={slotTemplates}
        blockers={matterBlockers}
        locale={session.locale}
        wall={wall}
        caseId={matter.id}
        docsBySlot={docsBySlotPlain}
      />
      <Card>
        <CardHeader title="Matter timeline" subtitle="Documents, emails, slot transitions, signatures - chronological." />
        <CardBody>
          <Timeline entries={timelineSerialised} />
        </CardBody>
      </Card>
    </div>
  );
}
