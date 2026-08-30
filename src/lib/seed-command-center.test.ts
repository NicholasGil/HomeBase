import { describe, expect, it } from "vitest";

import { seedCommandCenter } from "@/lib/seed-command-center";
import {
  COMMAND_CENTER_CLIENT_COUNT,
  COMMAND_CENTER_EXCEPTION_NAMES,
  SEED_PLAN,
} from "../../convex/seedPlan";

describe("seed command center", () => {
  it("seeds eight clients and ranks the two exceptions first", () => {
    const view = seedCommandCenter(Date.UTC(2026, 7, 30, 13, 0, 0));
    expect(view.roster).toHaveLength(COMMAND_CENTER_CLIENT_COUNT);
    expect(view.priority[0]?.name).toBe(COMMAND_CENTER_EXCEPTION_NAMES[0]);
    expect(view.priority[1]?.name).toBe(COMMAND_CENTER_EXCEPTION_NAMES[1]);
    for (const buyer of SEED_PLAN.buyers) {
      expect(view.roster.find((row) => row.name === buyer.name)?.stage).toBe(
        buyer.stage,
      );
    }
    expect(JSON.stringify(view)).not.toMatch(/814 Maple Ave/);
    expect(JSON.stringify(view)).not.toMatch(/extractedSummary/);
  });
});
