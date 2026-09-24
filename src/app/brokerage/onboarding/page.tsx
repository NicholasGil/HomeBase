import { redirect } from "next/navigation";

import { getFixtureBrokerageRecord } from "@/app/actions/brokerage-onboarding";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import {
  FixtureBrokerageOnboarding,
  LiveBrokerageOnboarding,
} from "@/components/brokerage-onboarding-screen";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  isAuthConfigured,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { homePathForBrokerageRole } from "@/lib/brokerage-onboarding-fixture";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ join?: string; mode?: string }>;
};

function onboardingTabFromParam(value: string | undefined): "create" | "join" {
  return value === "join" ? "join" : "create";
}

export default async function BrokerageOnboardingPage({ searchParams }: PageProps) {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const params = await searchParams;
  const joinError = params.join === "invalid";
  const initialTab = onboardingTabFromParam(params.mode);
  const session = await getTestSession();
  const mode = dashboardRenderMode(process.env, session);

  if (mode === "unavailable") {
    throw new ProductionAuthMisconfiguredError();
  }

  if (mode === "login" && !isAuthConfigured()) {
    return (
      <AppShell>
        <FixtureLoginPrompt />
      </AppShell>
    );
  }

  if (mode === "fixture") {
    if (session === null) {
      redirect("/test-login");
    }
    if (session.role === "onboarding_agent") {
      const record = await getFixtureBrokerageRecord();
      if (record !== null && record.clerkId === session.clerkId) {
        redirect(homePathForBrokerageRole(record.role));
      }
      return (
        <AppShell>
          <FixtureBrokerageOnboarding
            viewerName={session.name}
            joinError={joinError}
            initialTab={initialTab}
          />
        </AppShell>
      );
    }
    if (session.role === "buyer" || session.role === "vendor") {
      redirect(session.role === "vendor" ? "/vendor" : "/coach");
    }
    return (
      <AppShell>
        <FixtureBrokerageOnboarding
          viewerName={session?.name}
          joinError={joinError}
          initialTab={initialTab}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="Brokerage onboarding did not load.">
        <LiveBrokerageOnboarding initialTab={initialTab} />
      </QueryErrorBoundary>
    </AppShell>
  );
}
