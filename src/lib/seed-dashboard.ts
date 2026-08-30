import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { summarizeBuyerDashboard } from "../../convex/lib/dashboardView";
import {
  SEED_CLERK_IDS,
  SEED_PLAN,
  seedTransactionStatus,
} from "../../convex/seedPlan";

export type TestBuyerClerkId =
  | (typeof SEED_CLERK_IDS)["buyerA"]
  | (typeof SEED_CLERK_IDS)["buyerB"]
  | (typeof SEED_CLERK_IDS)["buyerH"];

const BUYER_TASKS = {
  [SEED_CLERK_IDS.buyerA]: [
    {
      title: "Sign purchase agreement",
      status: "done" as const,
      assigneeRole: "agent" as const,
      stage: "under_contract",
      blocksStage: true,
    },
    {
      title: "Submit earnest money",
      status: "done" as const,
      assigneeRole: "buyer" as const,
      stage: "under_contract",
      blocksStage: true,
    },
    {
      title: "Schedule inspection",
      status: "open" as const,
      assigneeRole: "agent" as const,
      stage: "inspection",
      blocksStage: true,
    },
    {
      title: "Review inspection report",
      status: "blocked" as const,
      assigneeRole: "buyer" as const,
      stage: "inspection",
      blocksStage: true,
    },
  ],
  [SEED_CLERK_IDS.buyerB]: [
    {
      title: "Send lender documents",
      status: "done" as const,
      assigneeRole: "buyer" as const,
      stage: "financing",
      blocksStage: true,
    },
    {
      title: "Tour Saturday listings",
      status: "open" as const,
      assigneeRole: "buyer" as const,
      stage: "showings",
      blocksStage: false,
    },
  ],
  [SEED_CLERK_IDS.buyerH]: [
    {
      title: "Confirm closing appointment",
      status: "done" as const,
      assigneeRole: "buyer" as const,
      stage: "closing",
      blocksStage: true,
    },
    {
      title: "Change HVAC filter",
      status: "open" as const,
      assigneeRole: "buyer" as const,
      stage: "move_in",
      blocksStage: false,
    },
  ],
} as const;

export function seedTransactionIdForBuyer(clerkId: TestBuyerClerkId) {
  if (clerkId === SEED_CLERK_IDS.buyerA) {
    return "seed:buyer-a";
  }
  if (clerkId === SEED_CLERK_IDS.buyerB) {
    return "seed:buyer-b";
  }
  return "seed:buyer-h";
}

export function seedDashboardForBuyer(
  clerkId: TestBuyerClerkId,
): BuyerDashboardView {
  const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === clerkId);
  if (buyer === undefined) {
    throw new Error(`seed plan missing ${clerkId}`);
  }
  const current = SEED_PLAN.stages.find((stage) => stage.key === buyer.stage);

  return summarizeBuyerDashboard({
    transactionId: seedTransactionIdForBuyer(clerkId),
    stage: buyer.stage,
    stageLabel: current?.label ?? buyer.stage,
    status: seedTransactionStatus(buyer),
    owedToday: {
      amountCents: buyer.owedToday.amountCents,
      currency: buyer.owedToday.currency,
      provenance: buyer.owedToday.provenance,
      asOf: 0,
      label: buyer.owedToday.label,
    },
    propertyAddress: buyer.property,
    tasks: [...BUYER_TASKS[clerkId]],
    stages: SEED_PLAN.stages,
    deadlines:
      buyer.stage === "inspection"
        ? [{ label: "Inspection due", at: 0 }]
        : [],
    contacts: [{ name: SEED_PLAN.agent.name, role: "agent" }],
  });
}

export function seedDashboardForBuyerA() {
  return seedDashboardForBuyer(SEED_CLERK_IDS.buyerA);
}
