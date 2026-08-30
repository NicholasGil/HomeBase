import { redirect } from "next/navigation";

import { loadFixturePropertySearch } from "@/app/actions/search";
import { getTestSession } from "@/app/actions/test-session";
import { AppShell } from "@/components/app-shell";
import { FixtureLoginPrompt } from "@/components/fixture-login-prompt";
import { ListingDetail } from "@/components/listing-detail";
import {
  dashboardRenderMode,
  mustFailClosed,
  ProductionAuthMisconfiguredError,
} from "@/lib/auth-config";
import { getSampleListing } from "@/lib/seed-search";
import { CANONICAL_SEARCH_QUERY } from "../../../../convex/lib/propertySearch";

export const dynamic = "force-dynamic";

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

  if (mode === "fixture" && session === null) {
    redirect("/test-login");
  }

  const listing = getSampleListing(listingId);
  if (listing === null) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground" data-testid="listing-denied">
          This sample listing is not available.
        </p>
      </AppShell>
    );
  }

  const loaded =
    mode === "fixture" ? await loadFixturePropertySearch(query) : null;
  const signal = loaded?.ok ? loaded.view.signals[listing.id] : undefined;

  return (
    <AppShell>
      <ListingDetail
        listing={listing}
        query={query}
        signal={signal}
        notice={notice}
      />
    </AppShell>
  );
}
