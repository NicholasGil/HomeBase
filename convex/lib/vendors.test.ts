import { describe, expect, it } from "vitest";

import {
  assertCompensationModelWrite,
  categoriesForStage,
  isAssignmentLive,
  isLenderCategory,
} from "./vendors";

const flagsOff = {
  FLAG_VENDOR_COMP: false,
  FLAG_MLS: false,
  FLAG_ESIGN: false,
  FLAG_IDV: false,
};

describe("vendor stage surfacing", () => {
  it("surfaces inspectors at inspection and lenders at financing", () => {
    expect(categoriesForStage("inspection")).toContain("inspectors");
    expect(categoriesForStage("financing")).toEqual(["lenders"]);
    expect(categoriesForStage("showings")).toEqual([]);
  });

  it("treats lender and lenders as the same directory family", () => {
    expect(isLenderCategory("lender")).toBe(true);
    expect(isLenderCategory("lenders")).toBe(true);
    expect(isLenderCategory("inspectors")).toBe(false);
  });
});

describe("assignment expiry", () => {
  it("treats an overdue active row as dead", () => {
    expect(
      isAssignmentLive({ status: "active", expiresAt: 10 }, 11),
    ).toBe(false);
    expect(
      isAssignmentLive({ status: "active", expiresAt: 12 }, 11),
    ).toBe(true);
    expect(
      isAssignmentLive({ status: "complete", expiresAt: 12 }, 11),
    ).toBe(false);
  });
});

describe("compensation pin", () => {
  it("accepts none and rejects every other model while the flag is off", () => {
    expect(() =>
      assertCompensationModelWrite(flagsOff, "none"),
    ).not.toThrow();
    expect(() =>
      assertCompensationModelWrite(flagsOff, "referral"),
    ).toThrow("FORBIDDEN");
    expect(() =>
      assertCompensationModelWrite(flagsOff, "flat_fee"),
    ).toThrow("FORBIDDEN");
  });
});
