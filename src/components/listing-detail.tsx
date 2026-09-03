import Link from "next/link";

import {
  AccessDeniedCard,
  type AccessDeniedAction,
} from "@/components/access-denied-card";
import { PhotoTile } from "@/components/listing-card";
import { ListingSignalForms } from "@/components/listing-signals";
import { MoneyFigureView } from "@/components/money-figure-view";
import { Badge } from "@/components/ui/badge";
import type { FixtureSearchSignals } from "@/lib/search-access";
import { listingPath } from "@/lib/seed-search";
import type { SearchListing } from "../../convex/lib/propertySearch";

/**
 * One sentence for every refused listing URL, whether the id is unknown or
 * the viewer's role cannot search. The optional action is the viewer's own
 * home as a way back; it says nothing about what was refused.
 */
export function ListingDenied({ action }: { action?: AccessDeniedAction }) {
  return (
    <AccessDeniedCard
      testId="listing-denied"
      title="You cannot open this listing."
      action={action}
    />
  );
}

function specLine(listing: SearchListing) {
  const parts: string[] = [];
  if (listing.specs.beds !== undefined) {
    parts.push(`${listing.specs.beds} beds`);
  }
  if (listing.specs.baths !== undefined) {
    parts.push(`${listing.specs.baths} baths`);
  }
  if (listing.specs.sqft !== undefined) {
    parts.push(`${listing.specs.sqft.toLocaleString("en-US")} sqft`);
  }
  if (listing.specs.lotAcres !== undefined) {
    parts.push(`${listing.specs.lotAcres} acres`);
  }
  if (listing.specs.garageSpaces !== undefined) {
    parts.push(`${listing.specs.garageSpaces}-car garage`);
  }
  return parts.join(" · ");
}

export function ListingDetail({
  listing,
  query,
  signal,
  notice,
}: {
  listing: SearchListing;
  query: string;
  signal?: FixtureSearchSignals[string];
  notice?: string;
}) {
  const cityState = `${listing.address.city}, ${listing.address.state}`;
  return (
    <article className="space-y-6" data-testid="listing-detail" data-property-id={listing.id}>
      <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-sm underline">
        Back to search
      </Link>
      {notice === "saved" ? (
        <p
          data-testid="search-notice"
          className="rounded-lg border bg-sage/40 px-4 py-3 text-sm"
        >
          Saved.{" "}
          <Link href={`/search?q=${encodeURIComponent(query)}&saved=1`} className="underline">
            See saved homes
          </Link>
        </p>
      ) : null}
      {notice === "disliked" ? (
        <p
          data-testid="search-notice"
          className="rounded-lg border bg-sand px-4 py-3 text-sm"
        >
          Marked disliked. Use Restore if that was a mistake.
        </p>
      ) : null}
      {notice === "restored" ? (
        <p
          data-testid="search-notice"
          className="rounded-lg border bg-sky/50 px-4 py-3 text-sm"
        >
          Restored.
        </p>
      ) : null}
      <PhotoTile className="h-56 w-full rounded-2xl sm:h-72" seed={listing.id}>
        <Badge variant="sage" className="absolute top-3 right-3">
          sample data
        </Badge>
      </PhotoTile>
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {listing.address.line1}
        </h1>
        <p className="text-sm text-muted-foreground">
          {cityState} {listing.address.postalCode}
        </p>
        <p className="text-sm">{specLine(listing)}</p>
        {listing.brief ? (
          <p className="text-sm text-muted-foreground">{listing.brief}</p>
        ) : null}
        {listing.listPrice ? (
          <MoneyFigureView
            figure={listing.listPrice}
            testId={`listing-price-${listing.id}`}
            size="md"
          />
        ) : (
          <p className="text-sm text-muted-foreground">No list price on this sample.</p>
        )}
        <ListingSignalForms
          propertyId={listing.id}
          query={query}
          signal={signal}
          returnTo={listingPath(listing.id)}
        />
      </div>
    </article>
  );
}
