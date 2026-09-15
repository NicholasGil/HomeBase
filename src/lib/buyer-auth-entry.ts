import { BUYER_COACH_HOME } from "@/lib/buyer-shell";

/** Product auth URLs (Clerk when keys are present). */
export const BUYER_SOLD_SIGN_IN = "/sign-in" as const;
export const BUYER_SOLD_SIGN_UP = "/sign-up" as const;

/** Preview / CI / agents only — not the buyer product path. */
export const BUYER_PREVIEW_FIXTURE_LOGIN = "/test-login" as const;

export function pricingContinueCoachHref(isBuyerSignedIn: boolean): string {
  return isBuyerSignedIn ? BUYER_COACH_HOME : BUYER_SOLD_SIGN_UP;
}
