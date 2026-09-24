import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const DEFAULT_JOURNEY_STAGES = [
  { key: "discovery", label: "Discovery", order: 1 },
  { key: "financing", label: "Financing", order: 2 },
  { key: "showings", label: "Showings", order: 3 },
  { key: "offer", label: "Offer", order: 4 },
  { key: "under_contract", label: "Under Contract", order: 5 },
  { key: "inspection", label: "Inspection", order: 6 },
  { key: "closing", label: "Closing", order: 7 },
] as const;

export async function bootstrapOrgJourneyStages(
  ctx: MutationCtx,
  orgId: Id<"orgs">,
) {
  for (const stage of DEFAULT_JOURNEY_STAGES) {
    await ctx.db.insert("journeyStages", {
      orgId,
      key: stage.key,
      label: stage.label,
      order: stage.order,
      defaultTasks: [],
      requiredDocuments: [],
    });
  }
}
