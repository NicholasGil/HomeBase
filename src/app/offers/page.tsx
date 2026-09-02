import { redirect } from "next/navigation";

import { loadFixtureExplainer } from "@/app/actions/explainer";
import { loadFixtureOffers } from "@/app/actions/offers";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveOfferCenter } from "@/components/live-offer-center";
import { ContractExplainer } from "@/components/contract-explainer";
import { LiveContractExplainer } from "@/components/live-contract-explainer";
import { FixtureOfferCenter } from "@/components/offer-center";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

async function FixtureOffers({ gate }: { gate?: string }) {
  const loaded = await loadFixtureOffers();
  return (
    <FixtureOfferCenter
      denied={!loaded.ok}
      center={loaded.ok ? loaded.center : null}
      gateFromSubmit={gate}
    />
  );
}

async function FixtureExplainer() {
  const explainer = await loadFixtureExplainer();
  return (
    <ContractExplainer
      denied={!explainer.sections.ok}
      sections={explainer.sections.ok ? explainer.sections.sections : []}
      thread={explainer.thread}
    />
  );
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ gate?: string }>;
}) {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const session = await getTestSession();
  const mode = dashboardRenderMode(process.env, session);
  const params = await searchParams;

  if (mode === "unavailable") {
    throw new ProductionAuthMisconfiguredError();
  }

  if (mode === "login") {
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
    return (
      <AppShell>
        <h1 className="mb-6 text-h1 font-semibold tracking-tight">Offers</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Signed in as {session.name} · {session.role}
        </p>
        <div className="space-y-10">
          <QueryErrorBoundary message="The offer center did not load.">
            <FixtureOffers gate={params.gate} />
          </QueryErrorBoundary>
          <QueryErrorBoundary message="The contract explainer did not load.">
            <FixtureExplainer />
          </QueryErrorBoundary>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-10">
        <QueryErrorBoundary message="The offer center did not load.">
          <LiveOfferCenter />
        </QueryErrorBoundary>
        <QueryErrorBoundary message="The contract explainer did not load.">
          <LiveContractExplainer />
        </QueryErrorBoundary>
      </div>
    </AppShell>
  );
}
