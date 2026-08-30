import { redirect } from "next/navigation";

import { loadFixturePropertySearch } from "@/app/actions/search";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { ListingDetail } from "@/components/listing-detail";
import { LiveListingDetail } from "@/components/live-listing-detail";
import { QueryErrorBoundary } from "@/components/query-error-boundary";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { loadFixtureListing } from "@/lib/search-access";
import { CANONICAL_SEARCH_QUERY } from "../../../../convex/lib/propertySearch";

export const dynamic = "force-dynamic";

function ListingDenied({ children }: { children: string }) {
  return (
    <p className="text-sm text-muted-foreground" data-testid="listing-denied">
      {children}
    </p>
  );
}

export default async function ListingPage({
  params,
  searchParams,
}: PageProps<"/listings/[listingId]">) {
  if (mustFailClosed()) {
    throw new ProductionAuthMisconfiguredError();
  }

  const session = await getTestSession();
  const mode = dashboardRenderMode(process.env, session);
  const { listingId: rawListingId } = await params;
  const listingId = decodeURIComponent(rawListingId);
  const queryParams = await searchParams;
  const query =
    typeof queryParams.q === "string" && queryParams.q.length > 0
      ? queryParams.q
      : CANONICAL_SEARCH_QUERY;
  const notice =
    typeof queryParams.notice === "string" ? queryParams.notice : undefined;

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
    const loaded = loadFixtureListing({ session, listingId });
    if (!loaded.ok) {
      return (
        <AppShell>
          <ListingDenied>
            {loaded.reason === "NOT_FOUND"
              ? "This sample listing is not available."
              : "You cannot open this listing."}
          </ListingDenied>
        </AppShell>
      );
    }
    const search = await loadFixturePropertySearch(query);
    return (
      <AppShell>
        <ListingDetail
          listing={loaded.listing}
          query={query}
          signal={search.ok ? search.view.signals[loaded.listing.id] : undefined}
          notice={notice}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <QueryErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground" data-testid="listing-denied">
            You cannot open this listing.
          </p>
        }
      >
        <LiveListingDetail
          listingId={listingId}
          query={query}
          notice={notice}
        />
      </QueryErrorBoundary>
    </AppShell>
  );
}
