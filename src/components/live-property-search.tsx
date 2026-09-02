"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SearchSectionSkeleton } from "@/components/route-skeletons";
import { ListingCardFrame } from "@/components/listing-card";
import { MoneyFigureView } from "@/components/money-figure-view";
import { SearchQueryPill } from "@/components/search-pill";
import { listingPath } from "@/lib/seed-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CANONICAL_SEARCH_QUERY } from "../../convex/lib/propertySearch";
import { tripHeadingClassName } from "@/lib/trip-ui";

export function LivePropertySearch() {
  const [query, setQuery] = useState(CANONICAL_SEARCH_QUERY);
  const [submitted, setSubmitted] = useState(CANONICAL_SEARCH_QUERY);
  const result = useQuery(api.search.run, { query: submitted });
  const recordSignal = useMutation(api.search.recordSignal);

  if (result === undefined) {
    return <SearchSectionSkeleton />;
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
          <Badge variant="sage" data-testid="search-sample-banner">
            sample data
          </Badge>
          <Badge variant="sky" data-testid="search-mls-flag">
            FLAG_MLS {result.mlsEnabled ? "on" : "off"}
          </Badge>
        </div>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(query);
        }}
      >
        <SearchQueryPill value={query} onChange={setQuery} />
        <div className="px-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="search-canonical"
            onClick={() => {
              setQuery(CANONICAL_SEARCH_QUERY);
              setSubmitted(CANONICAL_SEARCH_QUERY);
            }}
          >
            Canonical query
          </Button>
        </div>
      </form>

      {result.results.length === 0 ? (
        <EmptyState
          testId="search-empty"
          icon={SearchX}
          title={`No sample homes match "${submitted}".`}
          description="Try another city, or a beds and price search."
        >
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-4"
            onClick={() => {
              setQuery(CANONICAL_SEARCH_QUERY);
              setSubmitted(CANONICAL_SEARCH_QUERY);
            }}
          >
            Try the canonical query
          </Button>
        </EmptyState>
      ) : (
      <ol className="grid gap-6 sm:grid-cols-2">
        {result.results.map((row, index) => (
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
                <MoneyFigureView figure={row.listing.listPrice} size="md" />
              ) : (
                <p className="text-sm text-muted-foreground">None</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void recordSignal({
                      propertyId: row.id as Id<"properties">,
                      kind: "save",
                    })
                  }
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void recordSignal({
                      propertyId: row.id as Id<"properties">,
                      kind: "dislike",
                    })
                  }
                >
                  Dislike
                </Button>
              </div>
            </ListingCardFrame>
          </li>
        ))}
      </ol>
      )}
    </section>
  );
}
