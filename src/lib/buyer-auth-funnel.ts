import { BUYER_COACH_HOME } from "@/lib/buyer-shell";

/** Post-auth destination for buyer sign-in / sign-up (coach-first). */
export const BUYER_POST_AUTH_PATH = BUYER_COACH_HOME;

export function clerkSignInRedirectProps() {
  return {
    forceRedirectUrl: BUYER_POST_AUTH_PATH,
    fallbackRedirectUrl: BUYER_POST_AUTH_PATH,
    signUpForceRedirectUrl: BUYER_POST_AUTH_PATH,
    signUpFallbackRedirectUrl: BUYER_POST_AUTH_PATH,
  };
}

export function clerkSignUpRedirectProps() {
  return {
    forceRedirectUrl: BUYER_POST_AUTH_PATH,
    fallbackRedirectUrl: BUYER_POST_AUTH_PATH,
    signInForceRedirectUrl: BUYER_POST_AUTH_PATH,
    signInFallbackRedirectUrl: BUYER_POST_AUTH_PATH,
  };
}
