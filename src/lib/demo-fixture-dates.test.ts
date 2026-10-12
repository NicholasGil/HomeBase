import { describe, expect, it } from "vitest";

import { formatDisplayDateTime } from "../../convex/lib/displayTime";
import { SEED_CONCIERGE } from "../../convex/seedPlan";
import {
  DEMO_INSPECTION_DAYS_AHEAD,
  fixtureConciergeInspectionAt,
  fixtureConciergeShowingAt,
  fixtureLenderExpiresAt,
  fixtureOwedTodayAsOf,
} from "@/lib/demo-fixture-dates";
import { seedConciergeFacts } from "@/lib/seed-concierge";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

const demoProductionEnv = {
  REALTYRISE_DEMO_MODE: "1",
  VERCEL_ENV: "production",
  NODE_ENV: "production",
} as NodeJS.ProcessEnv;

/** Oct 11, 2026 — canonical seed inspection (Sep 8) is in the past. */
const DEMO_NOW = Date.UTC(2026, 9, 11, 18, 0, 0);

describe("demo fixture dates", () => {
  it("keeps canonical instants when demo mode is off", () => {
    const env = { VERCEL_ENV: "production", NODE_ENV: "production" } as NodeJS.ProcessEnv;
    expect(fixtureConciergeInspectionAt(env, DEMO_NOW)).toBe(
      SEED_CONCIERGE.inspectionStartsAt,
    );
    expect(fixtureConciergeShowingAt(env, DEMO_NOW)).toBe(
      SEED_CONCIERGE.showingStartsAt,
    );
    expect(fixtureOwedTodayAsOf(env, DEMO_NOW)).toBe(0);
    expect(fixtureLenderExpiresAt(env, DEMO_NOW)).toBe(Date.UTC(2026, 9, 30));
  });

  it("places the demo inspection in the future relative to now", () => {
    const at = fixtureConciergeInspectionAt(demoProductionEnv, DEMO_NOW);
    expect(at).toBeGreaterThan(DEMO_NOW);
    const daysAhead = (at - DEMO_NOW) / 86_400_000;
    expect(daysAhead).toBeGreaterThanOrEqual(DEMO_INSPECTION_DAYS_AHEAD - 0.25);
    expect(daysAhead).toBeLessThanOrEqual(DEMO_INSPECTION_DAYS_AHEAD + 1);
  });

  it("keeps showing before inspection in demo mode", () => {
    const inspection = fixtureConciergeInspectionAt(demoProductionEnv, DEMO_NOW);
    const showing = fixtureConciergeShowingAt(demoProductionEnv, DEMO_NOW);
    expect(showing).toBeLessThan(inspection);
  });

  it("sets owed-today asOf to the current Chicago day and lender expiry ahead", () => {
    const asOf = fixtureOwedTodayAsOf(demoProductionEnv, DEMO_NOW);
    expect(asOf).toBeLessThanOrEqual(DEMO_NOW);
    expect(DEMO_NOW - asOf).toBeLessThan(86_400_000);
    expect(fixtureLenderExpiresAt(demoProductionEnv, DEMO_NOW)).toBeGreaterThan(
      DEMO_NOW,
    );
  });

  it("surfaces a future inspection time in demo concierge facts", () => {
    const facts = seedConciergeFacts(SEED_CLERK_IDS.buyerA, {
      env: demoProductionEnv,
      now: DEMO_NOW,
    });
    const when = facts.find((row) => row.key === "inspection_when");
    expect(when?.text).toBeDefined();
    const inspectionAt = fixtureConciergeInspectionAt(demoProductionEnv, DEMO_NOW);
    expect(when?.text).toContain(formatDisplayDateTime(inspectionAt));
    expect(inspectionAt).toBeGreaterThan(DEMO_NOW);
  });
});
