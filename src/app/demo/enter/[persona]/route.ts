import { NextResponse } from "next/server";

import {
  fixtureAllowed,
  isDemoMode,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { DEMO_CHOOSER_PATH } from "@/lib/demo-copy";
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
  const config = PERSONAS[persona];
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
  if (started.session.role === "vendor") {
    response.cookies.delete(VENDOR_EXPIRY_COOKIE);
  }
  return response;
}
