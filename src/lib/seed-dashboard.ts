import type { BuyerDashboardView } from "../../convex/lib/dashboardView";
import { summarizeBuyerDashboard } from "../../convex/lib/dashboardView";
import { SEED_PLAN } from "../../convex/seedPlan";

export function seedDashboardForBuyerA(): BuyerDashboardView {
  const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === "clerk_buyer_a");
  if (buyer === undefined) {
    throw new Error("seed plan missing buyer A");
  }

  return summarizeBuyerDashboard({
    transactionId: "seed:buyer-a",
    stage: buyer.stage,
    stageLabel: "Inspection",
    status: "active",
    owedToday: {
      amountCents: buyer.owedToday.amountCents,
      currency: buyer.owedToday.currency,
      provenance: buyer.owedToday.provenance,
      asOf: 0,
      label: buyer.owedToday.label,
    },
    propertyAddress: buyer.property,
    tasks: [
      {
        title: "Sign purchase agreement",
        status: "done",
        assigneeRole: "agent",
      },
      {
        title: "Submit earnest money",
        status: "done",
        assigneeRole: "buyer",
      },
      {
        title: "Schedule inspection",
        status: "open",
        assigneeRole: "agent",
      },
      {
        title: "Review inspection report",
        status: "blocked",
        assigneeRole: "buyer",
      },
    ],
  });
}
