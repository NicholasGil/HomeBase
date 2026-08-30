"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { ListingCardFrame } from "@/components/listing-card";
import { MoneyFigureView } from "@/components/money-figure-view";
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
    return <p className="text-sm text-muted-foreground">Loading search…</p>;
  }

  return (
    <section className="space-y-6" data-testid="property-search">
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
        <label className="block space-y-2">
          <span className="text-sm font-medium">What are you looking for?</span>
          <textarea
            data-testid="search-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" data-testid="search-submit">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
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

      <ol className="space-y-3">
        {result.results.map((row, index) => (
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
              <p className="text-sm" data-testid={`search-reason-${row.id}`}>
                {row.reason}
              </p>
              {row.listing.listPrice ? (
                <MoneyFigureView figure={row.listing.listPrice} />
              ) : (
                <p className="text-sm text-muted-foreground">None</p>
              )}
              <div className="flex flex-wrap gap-2">
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
    </section>
  );
}
