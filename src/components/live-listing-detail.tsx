"use client";

import { useQuery } from "convex/react";

import { homeActionFor } from "@/components/access-denied-card";
import { ListingDenied, ListingDetail } from "@/components/listing-detail";
import { getSampleListing } from "@/lib/seed-search";
import { api } from "../../convex/_generated/api";

export function LiveListingDetail({
  listingId,
  query,
  notice,
}: {
  listingId: string;
  query: string;
  notice?: string;
}) {
  const allowed = useQuery(api.search.assertCanSearch, {});
  const session = useQuery(api.me.getSession, {});

  if (allowed === undefined || session === undefined) {
    return <p className="text-sm text-muted-foreground">Loading listing…</p>;
  }

  const listing = getSampleListing(listingId);
  if (listing === null) {
    return <ListingDenied action={homeActionFor(session.role)} />;
  }

  return <ListingDetail listing={listing} query={query} notice={notice} />;
}
