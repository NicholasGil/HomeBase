import { redirect } from "next/navigation";

import { BuyerLockedRouteGate } from "@/components/buyer-locked-upsell";
import { LiveBuyerLockedRoute } from "@/components/live-buyer-locked-route";
import { loadFixturePropertySearch } from "@/app/actions/search";
import { buyerLockedUpsell } from "@/lib/buyer-shell";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { LivePropertySearch } from "@/components/live-property-search";
import { PropertySearch } from "@/components/property-search";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import { RouteHeader } from "@/components/route-header";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { isDemoMode } from "@/lib/auth-config";
import { buyerFixtureOsUnlocked } from "@/lib/demo-buyer-os";
import { fixtureEntryPath } from "@/lib/demo-copy";

export const dynamic = "force-dynamic";

async function FixtureSearch({
  query,
  savedOnly,
  notice,
  noticePropertyId,
  polishDemoUi,
}: {
  query?: string;
  savedOnly: boolean;
  notice?: string;
  noticePropertyId?: string;
  polishDemoUi?: boolean;
}) {
  const loaded = await loadFixturePropertySearch(query);
  return (
    <PropertySearch
      denied={!loaded.ok}
      view={loaded.ok ? loaded.view : null}
      savedOnly={savedOnly}
      notice={notice}
      noticePropertyId={noticePropertyId}
      polishDemoUi={polishDemoUi}
    />
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    saved?: string;
    notice?: string;
    propertyId?: string;
  }>;
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
      redirect(fixtureEntryPath());
    }
    if (session.role === "buyer" && !buyerFixtureOsUnlocked()) {
      return (
        <AppShell>
          <RouteHeader
            title="Search"
            caption={`Signed in as ${session.name} · buyer`}
          />
          <BuyerLockedRouteGate upsell={buyerLockedUpsell("search")} />
        </AppShell>
      );
    }
    if (session.role === "buyer") {
      return (
        <AppShell>
          <RouteHeader title="Search" caption="Sample listings · demo data" />
          <QueryErrorBoundary message="Property search did not load.">
            <FixtureSearch
              query={params.q}
              savedOnly={params.saved === "1"}
              notice={params.notice}
              noticePropertyId={params.propertyId}
              polishDemoUi={isDemoMode()}
            />
          </QueryErrorBoundary>
        </AppShell>
      );
    }
    return (
      <AppShell>
        <RouteHeader
          title="Search"
          caption={`Signed in as ${session.name} · ${session.role}`}
        />
        <QueryErrorBoundary message="Property search did not load.">
          <FixtureSearch
            query={params.q}
            savedOnly={params.saved === "1"}
            notice={params.notice}
            noticePropertyId={params.propertyId}
          />
        </QueryErrorBoundary>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary message="Property search did not load.">
        <LiveBuyerLockedRoute area="search">
          <LivePropertySearch />
        </LiveBuyerLockedRoute>
      </QueryErrorBoundary>
    </AppShell>
  );
}
