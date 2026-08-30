import { describe, expect, it } from "vitest";

import { nextActionHref, owedTodayHref } from "@/lib/dashboard-links";

describe("dashboard card destinations", () => {
  it("sends schedule and tour next cards to tours", () => {
    expect(
      nextActionHref({
        title: "Schedule inspection",
        transactionId: "seed:buyer-a",
      }),
    ).toBe("/tours");
    expect(
      nextActionHref({
        title: "Tour Saturday listings",
        transactionId: "seed:buyer-b",
      }),
    ).toBe("/tours");
  });

  it("sends document work to the vault and leaves a fallback on the file", () => {
    expect(
      nextActionHref({
        title: "Send lender documents",
        transactionId: "seed:buyer-c",
      }),
    ).toBe("/vault");
    expect(
      nextActionHref({
        title: "Share must-haves",
        transactionId: "seed:buyer-g",
      }),
    ).toBe("/transactions/seed:buyer-g");
    expect(owedTodayHref()).toBe("/vault");
  });
});
