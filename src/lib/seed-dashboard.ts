import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { summarizeBuyerDashboard } from "../../convex/lib/dashboardView";
import { SEED_CLERK_IDS, SEED_PLAN } from "../../convex/seedPlan";

export type TestBuyerClerkId =
  (typeof SEED_CLERK_IDS)["buyerA"] | (typeof SEED_CLERK_IDS)["buyerB"];

const BUYER_TASKS = {
  [SEED_CLERK_IDS.buyerA]: [
    {
      title: "Sign purchase agreement",
      status: "done" as const,
      assigneeRole: "agent" as const,
    },
    {
      title: "Submit earnest money",
      status: "done" as const,
      assigneeRole: "buyer" as const,
    },
    {
      title: "Schedule inspection",
      status: "open" as const,
      assigneeRole: "agent" as const,
    },
    {
      title: "Review inspection report",
      status: "blocked" as const,
      assigneeRole: "buyer" as const,
    },
  ],
  [SEED_CLERK_IDS.buyerB]: [
    {
      title: "Send lender documents",
      status: "done" as const,
      assigneeRole: "buyer" as const,
    },
    {
      title: "Tour Saturday listings",
      status: "open" as const,
      assigneeRole: "buyer" as const,
    },
  ],
} as const;

const STAGE_LABEL: Record<string, string> = {
  inspection: "Inspection",
  showings: "Showings",
};

export function seedTransactionIdForBuyer(clerkId: TestBuyerClerkId) {
  return clerkId === SEED_CLERK_IDS.buyerA ? "seed:buyer-a" : "seed:buyer-b";
}

export function seedDashboardForBuyer(
  clerkId: TestBuyerClerkId,
): BuyerDashboardView {
  const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === clerkId);
  if (buyer === undefined) {
    throw new Error(`seed plan missing ${clerkId}`);
  }

  return summarizeBuyerDashboard({
    transactionId: seedTransactionIdForBuyer(clerkId),
    stage: buyer.stage,
    stageLabel: STAGE_LABEL[buyer.stage] ?? buyer.stage,
    status: "active",
    owedToday: {
      amountCents: buyer.owedToday.amountCents,
      currency: buyer.owedToday.currency,
      provenance: buyer.owedToday.provenance,
      asOf: 0,
      label: buyer.owedToday.label,
    },
    propertyAddress: buyer.property,
    tasks: [...BUYER_TASKS[clerkId]],
  });
}

export function seedDashboardForBuyerA() {
  return seedDashboardForBuyer(SEED_CLERK_IDS.buyerA);
}
