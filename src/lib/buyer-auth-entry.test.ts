import { describe, expect, it } from "vitest";

import {
  BUYER_SOLD_SIGN_IN,
  BUYER_SOLD_SIGN_UP,
  DEMO_ENTER_BUYER_COACH,
  pricingContinueCoachHref,
} from "@/lib/buyer-auth-entry";

describe("buyer auth entry paths", () => {
  it("uses sign-up as the sold path for unsigned pricing continue", () => {
    expect(pricingContinueCoachHref(false)).toBe(BUYER_SOLD_SIGN_UP);
    expect(pricingContinueCoachHref(true)).toBe("/coach");
  });

  it("routes unsigned pricing continue to Alex demo entry in demo mode", () => {
    expect(
      pricingContinueCoachHref(false, {
        VERCEL_ENV: "production",
        REALTYRISE_DEMO_MODE: "1",
      }),
    ).toBe(DEMO_ENTER_BUYER_COACH);
  });

  it("keeps sign-in and sign-up as stable product URLs", () => {
    expect(BUYER_SOLD_SIGN_IN).toBe("/sign-in");
    expect(BUYER_SOLD_SIGN_UP).toBe("/sign-up");
  });
});
