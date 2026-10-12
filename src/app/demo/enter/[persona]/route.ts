import { NextResponse } from "next/server";

import {
  fixtureAllowed,
  isDemoMode,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { DEMO_CHOOSER_PATH } from "@/lib/demo-copy";
import {
  COACH_SCROLL_EPOCH_COOKIE,
  coachScrollEpochCookieOptions,
  nextCoachScrollEpoch,
} from "@/lib/coach-scroll-epoch";
import {
  DEMO_COACH_SCROLL_RESET_COOKIE,
  demoCoachScrollResetCookieOptions,
  demoCoachScrollResetCookieValue,
} from "@/lib/demo-coach-scroll-reset";
import { isDemoEnterPrefetchRequest } from "@/lib/demo-enter-prefetch";
import { redirectToPathFromRequestUrl } from "@/lib/same-origin-redirect";
import {
  encodeTestSessionCookie,
  fixtureHomePath,
  startTestSessionDecision,
  TEST_SESSION_COOKIE,
  testSessionCookieOptions,
} from "@/lib/test-session";
import { VENDOR_EXPIRY_COOKIE } from "@/lib/vendor-access";
import { SEED_CLERK_IDS, SEED_PLAN } from "../../../../../convex/seedPlan";

export const dynamic = "force-dynamic";

type PersonaConfig = {
  clerkId: string;
  emptyCoachFile?: boolean;
};

const PERSONAS: Record<string, PersonaConfig> = {
  "buyer-coach": { clerkId: SEED_CLERK_IDS.buyerA },
  "buyer-discovery": {
    clerkId: SEED_CLERK_IDS.buyerA,
    emptyCoachFile: true,
  },
  agent: { clerkId: SEED_PLAN.agent.clerkId },
  vendor: { clerkId: SEED_PLAN.lender.clerkId },
  onboarding: { clerkId: SEED_CLERK_IDS.onboardingAgent },
};

function redirectToChooser(request: Request) {
  return redirectToPathFromRequestUrl(DEMO_CHOOSER_PATH, request);
}

/**
 * Demo-only GET entry: fixture personas, sameSite=lax session cookie, no real accounts.
 * GET CSRF risk is accepted for this public demo chooser flow.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ persona: string }> },
) {
  if (!fixtureAllowed() || !isDemoMode()) {
    throw new ProductionAuthMisconfiguredError();
  }

  if (isDemoEnterPrefetchRequest(request)) {
    return new NextResponse(null, { status: 204 });
  }

  const { persona } = await context.params;
  const config = Object.hasOwn(PERSONAS, persona)
    ? PERSONAS[persona]
    : undefined;
  if (config === undefined) {
    return redirectToChooser(request);
  }

  const url = new URL(request.url);
  const simulateConciergeServerError =
    url.searchParams.get("simulateConciergeServerError") === "1" &&
    persona === "buyer-coach";

  const started = startTestSessionDecision(config.clerkId, process.env, {
    emptyCoachFile: config.emptyCoachFile,
    simulateConciergeServerError,
  });
  if (!started.ok) {
    return redirectToChooser(request);
  }

  const destination = fixtureHomePath(started.session);
  const response = redirectToPathFromRequestUrl(destination, request);
  response.cookies.set(
    TEST_SESSION_COOKIE,
    encodeTestSessionCookie(started.session),
    testSessionCookieOptions(),
  );
  const scrollEpoch = nextCoachScrollEpoch();
  response.cookies.set(
    COACH_SCROLL_EPOCH_COOKIE,
    scrollEpoch,
    coachScrollEpochCookieOptions(),
  );
  response.cookies.set(
    DEMO_COACH_SCROLL_RESET_COOKIE,
    demoCoachScrollResetCookieValue(),
    demoCoachScrollResetCookieOptions(),
  );
  if (started.session.role === "vendor") {
    response.cookies.delete(VENDOR_EXPIRY_COOKIE);
  }
  return response;
}
