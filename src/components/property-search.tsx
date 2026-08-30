import Link from "next/link";

import {
  recordSearchSignalFromForm,
} from "@/app/actions/search";
import { ListingCardFrame } from "@/components/listing-card";
import { MoneyFigureView } from "@/components/money-figure-view";
import { SearchQueryPill } from "@/components/search-pill";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CANONICAL_SEARCH_QUERY } from "../../convex/lib/propertySearch";
import type { FixtureSearchView } from "@/lib/search-access";
import { tripHeadingClassName } from "@/lib/trip-ui";
import { cn } from "@/lib/utils";

function criteriaLine(view: FixtureSearchView) {
  const { criteria } = view;
  const parts: string[] = [];
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

export function PropertySearch({
  denied,
  view,
}: {
  denied?: boolean;
  view: FixtureSearchView | null;
}) {
  if (denied || view === null) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="search-denied">
        You cannot open property search.
      </p>
    );
  }

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
          <Badge variant="outline" data-testid="search-sample-banner">
            sample data
          </Badge>
          <Badge variant="outline" data-testid="search-mls-flag">
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

      <ol className="grid gap-6 sm:grid-cols-2">
        {view.results.map((row, index) => {
          const signal = view.signals[row.id];
          return (
            <li key={row.id}>
              <ListingCardFrame
                testId={`search-result-${row.id}`}
                propertyId={row.id}
                rank={index + 1}
                score={row.score}
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
                  />
                ) : (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid={`search-price-missing-${row.id}`}
                  >
                    None
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <form action={recordSearchSignalFromForm}>
                    <input type="hidden" name="propertyId" value={row.id} />
                    <input type="hidden" name="kind" value="save" />
                    <input type="hidden" name="query" value={view.query} />
                    <Button
                      type="submit"
                      variant={signal === "save" ? "default" : "outline"}
                      size="sm"
                      data-testid={`search-save-${row.id}`}
                    >
                      Save
                    </Button>
                  </form>
                  <form action={recordSearchSignalFromForm}>
                    <input type="hidden" name="propertyId" value={row.id} />
                    <input type="hidden" name="kind" value="dislike" />
                    <input type="hidden" name="query" value={view.query} />
                    <Button
                      type="submit"
                      variant={signal === "dislike" ? "destructive" : "outline"}
                      size="sm"
                      data-testid={`search-dislike-${row.id}`}
                    >
                      Dislike
                    </Button>
                  </form>
                </div>
              </ListingCardFrame>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
