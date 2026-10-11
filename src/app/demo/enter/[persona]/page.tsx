import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  fixtureAllowed,
  isDemoMode,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { DEMO_CHOOSER_PATH } from "@/lib/demo-copy";
import {
  encodeTestSessionCookie,
  fixtureHomePath,
  startTestSessionDecision,
  TEST_SESSION_COOKIE,
} from "@/lib/test-session";
import { SEED_CLERK_IDS, SEED_PLAN } from "../../../../../convex/seedPlan";

export const dynamic = "force-dynamic";

const PERSONA_CLERK_IDS: Record<string, string> = {
  "buyer-coach": SEED_CLERK_IDS.buyerA,
  agent: SEED_PLAN.agent.clerkId,
  vendor: SEED_PLAN.lender.clerkId,
  onboarding: SEED_CLERK_IDS.onboardingAgent,
};

type PageProps = {
  params: Promise<{ persona: string }>;
};

export default async function DemoEnterPersonaPage({ params }: PageProps) {
  if (!fixtureAllowed() || !isDemoMode()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const { persona } = await params;
  const clerkId = PERSONA_CLERK_IDS[persona];
  if (clerkId === undefined) {
    redirect(DEMO_CHOOSER_PATH);
  }

  const started = startTestSessionDecision(clerkId, process.env);
  if (!started.ok) {
    redirect(DEMO_CHOOSER_PATH);
  }

  const store = await cookies();
  store.set(TEST_SESSION_COOKIE, encodeTestSessionCookie(started.session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(fixtureHomePath(started.session));
}
