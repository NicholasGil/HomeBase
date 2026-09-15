import { describe, expect, it } from "vitest";

import { BUYER_COACH_HOME } from "@/lib/buyer-shell";
import {
  BUYER_POST_AUTH_PATH,
  clerkSignInRedirectProps,
  clerkSignUpRedirectProps,
} from "@/lib/buyer-auth-funnel";

describe("buyer auth funnel", () => {
  it("uses coach as the post-auth destination", () => {
    expect(BUYER_POST_AUTH_PATH).toBe(BUYER_COACH_HOME);
    expect(BUYER_POST_AUTH_PATH).toBe("/coach");
  });

  it("points Clerk sign-in and sign-up at coach", () => {
    expect(clerkSignInRedirectProps()).toEqual({
      forceRedirectUrl: "/coach",
      fallbackRedirectUrl: "/coach",
      signUpForceRedirectUrl: "/coach",
      signUpFallbackRedirectUrl: "/coach",
    });
    expect(clerkSignUpRedirectProps()).toEqual({
      forceRedirectUrl: "/coach",
      fallbackRedirectUrl: "/coach",
      signInForceRedirectUrl: "/coach",
      signInFallbackRedirectUrl: "/coach",
    });
  });

});
