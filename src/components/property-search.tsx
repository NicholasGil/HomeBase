import Link from "next/link";

import {
  recordSearchSignalFromForm,
} from "@/app/actions/search";
import { MoneyFigureView } from "@/components/money-figure-view";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CANONICAL_SEARCH_QUERY } from "../../convex/lib/propertySearch";
import type { FixtureSearchView } from "@/lib/search-access";
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
            FLAG_MLS {view.mlsEnabled ? "on" : "off"}
          </Badge>
        </div>
      </div>

      <form className="space-y-3" action="/search" method="get">
        <label className="block space-y-2">
          <span className="text-sm font-medium">What are you looking for?</span>
          <textarea
            name="q"
            data-testid="search-query"
            defaultValue={view.query}
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" data-testid="search-submit">
            Search
          </Button>
          <Link
            href={`/search?q=${encodeURIComponent(CANONICAL_SEARCH_QUERY)}`}
            className={cn(buttonVariants({ variant: "outline" }))}
            data-testid="search-canonical"
          >
            Canonical query
          </Link>
        </div>
      </form>

      <p className="text-sm text-muted-foreground" data-testid="search-criteria">
        {criteriaLine(view)}
      </p>

      <ol className="space-y-4">
        {view.results.map((row, index) => {
          const signal = view.signals[row.id];
          return (
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
                    <div className="flex flex-wrap gap-2">
                      {row.sampleData ? (
                        <Badge variant="secondary" data-testid="search-sample-label">
                          sample data
                        </Badge>
                      ) : null}
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {row.listing.brief ? (
                    <p className="text-sm">{row.listing.brief}</p>
                  ) : null}
                  <p
                    className="text-sm"
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
                  <div className="flex flex-wrap gap-2">
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
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
