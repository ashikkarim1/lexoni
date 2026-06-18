/**
 * Slot-template library — the canonical set of "this kind of document
 * needs these fields, this kind of regulator, this language" definitions
 * surfaced inside the matter workspace's document lookup.
 *
 * Pages import from here so the demo-vs-DB switch is hidden behind a
 * stable boundary. Once `process_document_slots` is fully seeded with
 * the firm's template library, this swaps to a DB read.
 */
import { slotTemplates as mockSlotTemplates, type SlotTemplate } from "@/lib/mock";

export type { SlotTemplate };

export async function listSlotTemplates(): Promise<SlotTemplate[]> {
  return mockSlotTemplates;
}
