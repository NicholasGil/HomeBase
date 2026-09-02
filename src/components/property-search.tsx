import Link from "next/link";

import { ListingCardFrame } from "@/components/listing-card";
import { ListingSignalForms } from "@/components/listing-signals";
import { MoneyFigureView } from "@/components/money-figure-view";
import { SearchQueryPill } from "@/components/search-pill";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CANONICAL_SEARCH_QUERY } from "../../convex/lib/propertySearch";
import type { FixtureSearchView } from "@/lib/search-access";
import { listingPath } from "@/lib/seed-search";
import { tripHeadingClassName } from "@/lib/trip-ui";
import { cn } from "@/lib/utils";

function criteriaLine(view: FixtureSearchView) {
  const { criteria } = view;
  const parts: string[] = [];
  if (criteria.location !== null) {
    parts.push(`in ${criteria.location}`);
  }
  if (criteria.beds !== null) {
    parts.push(`${criteria.beds} beds`);
  }
  if (criteria.priceCapCents !== null) {
    parts.push(`under $${Math.round(criteria.priceCapCents / 100).toLocaleString("en-US")}`);
  }
  if (criteria.minLotAcres !== null) {
    parts.push("some land");
  }
  if (criteria.minGarageSpaces !== null) {
    parts.push("good garage");
  }
  if (criteria.driveMinutesFromTown !== null) {
    parts.push(`~${criteria.driveMinutesFromTown} minutes from town`);
  }
  return parts.join(" · ");
}

function SearchNotice({
  notice,
  propertyId,
  query,
}: {
  notice?: string;
  propertyId?: string;
  query: string;
}) {
  if (notice === "saved") {
    return (
      <p
        data-testid="search-notice"
        className="rounded-lg border bg-sage/40 px-4 py-3 text-sm"
      >
        Saved.{" "}
        <Link href={`/search?q=${encodeURIComponent(query)}&saved=1`} className="underline">
          See saved homes
        </Link>
      </p>
    );
  }
  if (notice === "disliked" && propertyId) {
    return (
      <p
        data-testid="search-notice"
        className="rounded-lg border bg-sand px-4 py-3 text-sm"
      >
        Removed from the top of this ranking. Use Restore on the card if that
        was a mistake.
      </p>
    );
  }
  if (notice === "restored") {
    return (
      <p
        data-testid="search-notice"
        className="rounded-lg border bg-sky/50 px-4 py-3 text-sm"
      >
        Restored. That home is back in the usual ranking.
      </p>
    );
  }
  return null;
}

export function PropertySearch({
  denied,
  view,
  savedOnly,
  notice,
  noticePropertyId,
}: {
  denied?: boolean;
  view: FixtureSearchView | null;
  savedOnly?: boolean;
  notice?: string;
  noticePropertyId?: string;
}) {
  if (denied || view === null) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="search-denied">
        You cannot open property search.
      </p>
    );
  }

  const shown = savedOnly
    ? view.results.filter((row) => view.signals[row.id] === "save")
    : view.results;
  const queryHref = `/search?q=${encodeURIComponent(view.query)}`;

  return (
    <section className="space-y-8" data-testid="property-search">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={tripHeadingClassName}>
            Property search
          </h2>
          <p className="text-sm text-muted-foreground">
            Natural language in, ranked sample listings out. FLAG_MLS stays off.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="sage" data-testid="search-sample-banner">
            sample data
          </Badge>
          <Badge variant="sky" data-testid="search-mls-flag">
            FLAG_MLS {view.mlsEnabled ? "on" : "off"}
          </Badge>
        </div>
      </div>

      <form className="space-y-3" action="/search" method="get">
        <SearchQueryPill name="q" defaultValue={view.query} />
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <Link
            href={`/search?q=${encodeURIComponent(CANONICAL_SEARCH_QUERY)}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            data-testid="search-canonical"
          >
            Canonical query
          </Link>
          <p className="text-sm text-muted-foreground" data-testid="search-criteria">
            {criteriaLine(view)}
          </p>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={queryHref}
          className={cn(
            buttonVariants({ variant: savedOnly ? "outline" : "default", size: "sm" }),
          )}
          data-testid="search-all-filter"
        >
          All
        </Link>
        <Link
          href={`${queryHref}&saved=1`}
          className={cn(
            buttonVariants({ variant: savedOnly ? "default" : "outline", size: "sm" }),
          )}
          data-testid="search-saved-filter"
        >
          Saved
        </Link>
      </div>

      <SearchNotice
        notice={notice}
        propertyId={noticePropertyId}
        query={view.query}
      />

      {shown.length === 0 ? (
        <p
          data-testid="search-empty"
          className="rounded-lg border bg-card px-4 py-6 text-sm text-muted-foreground"
        >
          {savedOnly
            ? "No saved sample homes yet."
            : `No sample homes match "${view.query}". Try another city or a beds and price search.`}
        </p>
      ) : (
        <ol className="grid gap-6 sm:grid-cols-2">
          {shown.map((row, index) => {
            const signal = view.signals[row.id];
            return (
              <li key={row.id}>
                <ListingCardFrame
                  testId={`search-result-${row.id}`}
                  propertyId={row.id}
                  rank={index + 1}
                  score={row.score}
                  href={listingPath(row.id)}
                  addressLine={row.listing.address.line1}
                  cityState={`${row.listing.address.city}, ${row.listing.address.state}`}
                  sample={row.sampleData}
                  sampleTestId="search-sample-label"
                >
                  <p
                    className="line-clamp-2 text-sm text-muted-foreground"
                    data-testid={`search-reason-${row.id}`}
                  >
                    {row.reason}
                  </p>
                  {row.listing.listPrice ? (
                    <MoneyFigureView
                      figure={row.listing.listPrice}
                      testId={`search-price-${row.id}`}
                      size="md"
                    />
                  ) : (
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid={`search-price-missing-${row.id}`}
                    >
                      None
                    </p>
                  )}
                  <ListingSignalForms
                    propertyId={row.id}
                    query={view.query}
                    signal={signal}
                  />
                </ListingCardFrame>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
