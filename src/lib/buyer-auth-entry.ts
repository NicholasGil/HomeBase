import { isDemoMode, type AuthEnv } from "@/lib/auth-config";
import { BUYER_COACH_HOME } from "@/lib/buyer-shell";

/** Product auth URLs (Clerk when keys are present). */
export const BUYER_SOLD_SIGN_IN = "/sign-in" as const;
export const BUYER_SOLD_SIGN_UP = "/sign-up" as const;

/** Preview / CI / agents only — not the buyer product path. */
export const BUYER_PREVIEW_FIXTURE_LOGIN = "/test-login" as const;

import { DEMO_PERSONA_ENTER } from "@/lib/demo-persona-enter";

export const DEMO_ENTER_BUYER_COACH = DEMO_PERSONA_ENTER.buyerCoach;

export function pricingContinueCoachHref(
  isBuyerSignedIn: boolean,
  env: AuthEnv = process.env,
): string {
  if (isBuyerSignedIn) {
    return BUYER_COACH_HOME;
  }
  if (isDemoMode(env)) {
    return DEMO_ENTER_BUYER_COACH;
  }
  return BUYER_SOLD_SIGN_UP;
}
