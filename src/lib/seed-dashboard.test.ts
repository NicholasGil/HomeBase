import { describe, expect, it } from "vitest";

import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";

describe("seed dashboard preview", () => {
  it("answers the ten-second test for Alex Rivera", () => {
    const view = seedDashboardForBuyerA();
    expect(view.where.key).toBe("inspection");
    expect(view.done).toContain("Sign purchase agreement");
    expect(view.next?.title).toBe("Schedule inspection");
    expect(view.waitingOn).toBe("agent");
    expect(view.owedToday?.provenance).toBe("title_issued");
  });
});
