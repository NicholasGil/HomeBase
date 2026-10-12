import { describe, expect, it } from "vitest";

import {
  coachFileNextDisplayLabel,
  DEMO_ATTEND_INSPECTION_TITLE,
} from "@/lib/demo-file-session-view";
import { seedDashboardForClerkId } from "@/lib/seed-dashboard";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

const demoProductionEnv = {
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  REALTYRISE_DEMO_MODE: "1",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
  CLERK_SECRET_KEY: "",
} as NodeJS.ProcessEnv;

const fixturePreviewEnv = {
  NODE_ENV: "development",
  VERCEL_ENV: "preview",
  REALTYRISE_DEMO_MODE: "0",
} as NodeJS.ProcessEnv;

describe("coachFileNextDisplayLabel", () => {
  it("shows Attend inspection with date in demo mode", () => {
    const base = seedDashboardForClerkId(SEED_CLERK_IDS.buyerA);
    const view = {
      ...base,
      next: { title: DEMO_ATTEND_INSPECTION_TITLE, assigneeRole: "buyer" },
    };
    const label = coachFileNextDisplayLabel(view, demoProductionEnv);
    expect(label).toMatch(/^Attend inspection · /);
  });

  it("shows Schedule inspection outside demo mode", () => {
    const view = seedDashboardForClerkId(SEED_CLERK_IDS.buyerA);
    expect(view.next?.title).toBe("Schedule inspection");
    expect(coachFileNextDisplayLabel(view, fixturePreviewEnv)).toBe(
      "Schedule inspection",
    );
  });
});
