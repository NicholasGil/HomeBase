"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { MoneyFigureView } from "@/components/money-figure-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CANONICAL_SEARCH_QUERY } from "../../convex/lib/propertySearch";

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
          <h2 className="text-xl font-semibold tracking-tight">
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

      <ol className="space-y-4">
        {result.results.map((row, index) => (
          <li key={row.id}>
            <Card
              data-testid={`search-result-${row.id}`}
              data-property-id={row.id}
              data-rank={index + 1}
              data-score={row.score}
            >
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>{row.listing.address.line1}</CardTitle>
                    <CardDescription>
                      {row.listing.address.city}, {row.listing.address.state}
                    </CardDescription>
                  </div>
                  {row.sampleData ? (
                    <Badge variant="secondary">sample data</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
