import {
  buildCommandCenter,
  FINANCING_DOCUMENT_TYPES,
  type CommandCenterView,
} from "../../convex/lib/commandCenter";
import { SEED_PLAN, seedTransactionStatus } from "../../convex/seedPlan";
import { completeCommandCenterPriority } from "../../lib/llm";
import { seedTransactionIdForClerk } from "@/lib/seed-dashboard";

const DAY_MS = 86_400_000;

export function seedCommandCenter(now = Date.now()): CommandCenterView {
  const financing = SEED_PLAN.stages.find((stage) => stage.key === "financing");
  const financingRequired = financing?.requiredDocuments ?? FINANCING_DOCUMENT_TYPES;
  const view = buildCommandCenter(
    SEED_PLAN.buyers.map((buyer) => {
      const stage = SEED_PLAN.stages.find((row) => row.key === buyer.stage);
      const inspectionDueOffsetDays =
        buyer.inspectionDueOffsetDays ??
        (buyer.stage === "inspection" ? 2 : null);
      const closingAtOffsetDays = buyer.closingAtOffsetDays;
      const nextTask = buyer.tasks.find((task) => task.status === "open") ?? null;
      return {
        clientId: `seed-client:${buyer.clerkId}`,
        transactionId: seedTransactionIdForClerk(buyer.clerkId) ?? `seed:${buyer.clerkId}`,
        name: buyer.name,
        stage: buyer.stage,
        stageLabel: stage?.label ?? buyer.stage,
        stageOrder: stage?.order ?? 0,
        status: seedTransactionStatus(buyer),
        documentTypes: buyer.documents,
        financingRequired,
        inspectionDueAt:
          inspectionDueOffsetDays === null
            ? undefined
            : now + inspectionDueOffsetDays * DAY_MS,
        closingAt:
          closingAtOffsetDays === null
            ? undefined
            : now + closingAtOffsetDays * DAY_MS,
        offerStatus: buyer.seedDraftOffer ? "draft" : undefined,
        nextTask:
          nextTask === null
            ? null
            : { title: nextTask.title, assigneeRole: nextTask.assigneeRole },
        propertyCity: buyer.property.city,
        propertyState: buyer.property.state,
      };
    }),
    now,
  );
  return {
    roster: view.roster,
    priority: view.priority.map((row) => ({
      ...row,
      priorityReason: completeCommandCenterPriority({
        exceptions: row.exceptions.map((exception) => exception.kind),
        stageLabel: row.stageLabel,
      }),
    })),
  };
}
