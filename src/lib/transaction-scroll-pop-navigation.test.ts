import { afterEach, describe, expect, it } from "vitest";

import {
  consumeTransactionScrollPopNavigation,
  markTransactionScrollPopNavigation,
  resetTransactionScrollPopNavigationForTests,
} from "@/lib/transaction-scroll-pop-navigation";

describe("transaction scroll pop navigation", () => {
  afterEach(() => {
    resetTransactionScrollPopNavigationForTests();
  });

  it("consumes a pending pop only for the matching transaction path", () => {
    const path = "/transactions/seed:buyer-a";
    markTransactionScrollPopNavigation(path);
    expect(consumeTransactionScrollPopNavigation(path)).toBe(true);
    expect(consumeTransactionScrollPopNavigation(path)).toBe(false);
  });

  it("ignores non-transaction paths and mismatched paths", () => {
    markTransactionScrollPopNavigation("/coach");
    expect(consumeTransactionScrollPopNavigation("/coach")).toBe(false);
    markTransactionScrollPopNavigation("/transactions/seed:buyer-a");
    expect(
      consumeTransactionScrollPopNavigation("/transactions/other"),
    ).toBe(false);
  });
});
