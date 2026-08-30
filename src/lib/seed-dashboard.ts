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

export function seedTransactionIdForClerk(clerkId: string): string | null {
  const match = /^clerk_buyer_([a-h])$/.exec(clerkId);
  if (match === null) {
    return null;
  }
  return `seed:buyer-${match[1]}`;
}

export function clerkIdForSeedTransaction(transactionId: string): string | null {
  const match = /^seed:buyer-([a-h])$/.exec(transactionId);
  if (match === null) {
    return null;
  }
  return `clerk_buyer_${match[1]}`;
}

export function seedBuyerNameForTransaction(transactionId: string): string | null {
  const clerkId = clerkIdForSeedTransaction(transactionId);
  if (clerkId === null) {
    return null;
  }
  return SEED_PLAN.buyers.find((row) => row.clerkId === clerkId)?.name ?? null;
}

export function seedTransactionIdForBuyer(clerkId: TestBuyerClerkId) {
  const transactionId = seedTransactionIdForClerk(clerkId);
  if (transactionId === null) {
    throw new Error(`seed plan missing transaction for ${clerkId}`);
  }
  return transactionId;
}

export function seedDashboardForClerkId(clerkId: string): BuyerDashboardView {
  const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === clerkId);
  const transactionId = seedTransactionIdForClerk(clerkId);
  if (buyer === undefined || transactionId === null) {
    throw new Error(`seed plan missing ${clerkId}`);
  }
  const current = SEED_PLAN.stages.find((stage) => stage.key === buyer.stage);

  return summarizeBuyerDashboard({
    transactionId,
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
    tasks: buyer.tasks.map((task) => ({ ...task })),
    stages: SEED_PLAN.stages,
    deadlines:
      buyer.stage === "inspection"
        ? [{ label: "Inspection due", at: 0 }]
        : [],
    contacts: [{ name: SEED_PLAN.agent.name, role: "agent" }],
  });
}

export function seedDashboardForBuyer(
  clerkId: TestBuyerClerkId,
): BuyerDashboardView {
  return seedDashboardForClerkId(clerkId);
}

export function seedDashboardForBuyerA() {
  return seedDashboardForBuyer(SEED_CLERK_IDS.buyerA);
}
