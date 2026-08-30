import { describe, expect, it } from "vitest";

import { SEED_VENDORS } from "../../convex/seedPlan";
import { listSeedVendors, seedVendorsForStage } from "@/lib/seed-vendors";

describe("seed vendors", () => {
  it("pins every seeded vendor to none and includes the DESIGN.md categories", () => {
    const listed = listSeedVendors();
    expect(listed.every((row) => row.compensationModel === "none")).toBe(true);
    expect(SEED_VENDORS).toHaveLength(listed.length);
    const categories = new Set(listed.map((row) => row.category));
    expect(categories.has("lenders")).toBe(true);
    expect(categories.has("inspectors")).toBe(true);
    expect(categories.has("internet")).toBe(true);
    expect(seedVendorsForStage("inspection").map((row) => row.name)).toContain(
      "Riley Brooks",
    );
    expect(seedVendorsForStage("showings")).toEqual([]);
  });
});
