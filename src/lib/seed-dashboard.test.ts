import { describe, expect, it } from "vitest";

import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import { seedDashboardForBuyer } from "@/lib/seed-dashboard";

describe("seed dashboard", () => {
  it("answers the ten-second test for Alex Rivera", () => {
    const view = seedDashboardForBuyer(SEED_CLERK_IDS.buyerA);
    expect(view.where.key).toBe("inspection");
    expect(view.done).toContain("Sign purchase agreement");
    expect(view.next?.title).toBe("Schedule inspection");
    expect(view.waitingOn).toBe("agent");
    expect(view.owedToday?.provenance).toBe("title_issued");
    expect(view.stages).toHaveLength(13);
    expect(view.canAdvance).toBe(false);
    expect(view.blockingTasks[0]?.title).toBe("Schedule inspection");
  });

  it("keeps Blair Chen on a distinct transaction", () => {
    const alex = seedDashboardForBuyer(SEED_CLERK_IDS.buyerA);
    const blair = seedDashboardForBuyer(SEED_CLERK_IDS.buyerB);
    expect(blair.transactionId).not.toBe(alex.transactionId);
    expect(blair.where.key).toBe("showings");
    expect(blair.next?.title).toBe("Tour Saturday listings");
  });
});
