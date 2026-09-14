import { describe, expect, it } from "vitest";

import { coachScopeForBuyerDashboard } from "@/lib/coach-scope";

describe("coachScopeForBuyerDashboard", () => {
  it("uses Discovery when the buyer file is empty", () => {
    expect(coachScopeForBuyerDashboard(null)).toEqual({
      address: "No property on this file yet",
      stage: "Discovery",
    });
  });

  it("maps a populated dashboard to concierge scope", () => {
    expect(
      coachScopeForBuyerDashboard({
        propertyAddress: { line1: "12 Oak St", city: "Mobile" },
        where: { label: "Inspection" },
      }),
    ).toEqual({
      address: "12 Oak St, Mobile",
      stage: "Inspection",
    });
  });
});
