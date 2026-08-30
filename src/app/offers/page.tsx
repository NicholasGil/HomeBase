import { redirect } from "next/navigation";

import { loadFixtureOffers } from "@/app/actions/offers";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LiveOfferCenter } from "@/components/live-offer-center";
import { FixtureOfferCenter } from "@/components/offer-center";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";

export const dynamic = "force-dynamic";

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
    const loaded = await loadFixtureOffers();
    return (
      <AppShell>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Offers</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Signed in as {session.name} · {session.role}
        </p>
        <FixtureOfferCenter
          denied={!loaded.ok}
          center={loaded.ok ? loaded.center : null}
          gateFromSubmit={params.gate}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            You cannot open this offer.
          </p>
        }
      >
        <LiveOfferCenter />
      </QueryErrorBoundary>
    </AppShell>
  );
}
