import { getFeatureFlags } from "@/lib/flags";
import {
  parseFixtureTours,
  type FixtureTourState,
} from "@/lib/tour-access";
import { type TestSession } from "@/lib/test-session";
import {
  CANONICAL_SEARCH_QUERY,
  parseSearchQuery,
  rankSearchListings,
  type RankedSearchResult,
  type SearchCriteria,
  type SearchFeedbackEvent,
  type SearchInventory,
} from "../../convex/lib/propertySearch";
import {
  getSampleListing,
  isSeedSearchPropertyId,
  seedSearchListings,
  SEED_SEARCH,
} from "@/lib/seed-search";
import type { SearchListing } from "../../convex/lib/propertySearch";

export const FIXTURE_SEARCH_COOKIE = "hb_fixture_search";

export type FixtureSearchSignals = Record<string, "save" | "dislike">;

export type FixtureSearchState = {
  signals: Record<string, FixtureSearchSignals>;
};

export function parseFixtureSearch(value: string | undefined): FixtureSearchState {
  if (value === undefined || value.length === 0) {
    return { signals: {} };
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || !("signals" in parsed)) {
      return { signals: {} };
    }
    const signals = (parsed as { signals: unknown }).signals;
    if (typeof signals !== "object" || signals === null) {
      return { signals: {} };
    }
    return { signals: signals as Record<string, FixtureSearchSignals> };
  } catch {
    return { signals: {} };
  }
}

export function canSearch(session: TestSession | null) {
  if (session === null) {
    return { ok: false as const, reason: "UNAUTHENTICATED" as const };
  }
  if (session.role === "vendor") {
    return { ok: false as const, reason: "FORBIDDEN" as const };
  }
  return { ok: true as const, session };
}

export function loadFixtureListing(input: {
  session: TestSession | null;
  listingId: string;
}):
  | { ok: true; listing: SearchListing }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" } {
  const access = canSearch(input.session);
  if (!access.ok) {
    return access;
  }
  const listing = getSampleListing(input.listingId);
  if (listing === null) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  return { ok: true, listing };
}

function feedbackFrom(
  clerkId: string,
  searchState: FixtureSearchState,
  tourState: FixtureTourState,
): SearchFeedbackEvent[] {
  const events: SearchFeedbackEvent[] = [];
  const signals = searchState.signals[clerkId] ?? {};
  for (const [propertyId, kind] of Object.entries(signals)) {
    events.push({ kind, propertyId });
  }
  for (const tour of tourState.tours) {
    if (tour.ownerClerkId !== clerkId || tour.status === "canceled") {
      continue;
    }
    for (const stop of tour.stops) {
      events.push({ kind: "tour", propertyId: stop.propertyId });
    }
    for (const row of tour.feedback) {
      events.push({
        kind: "showing",
        propertyId: row.propertyId,
        verdict: row.verdict,
      });
    }
  }
  return events;
}

export type FixtureSearchView = {
  query: string;
  criteria: SearchCriteria;
  inventory: SearchInventory;
  mlsEnabled: boolean;
  results: RankedSearchResult[];
  signals: FixtureSearchSignals;
};

export function loadFixtureSearch(input: {
  session: TestSession | null;
  query?: string;
  searchState: FixtureSearchState;
  tourCookie?: string;
}):
  | { ok: true; view: FixtureSearchView }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  const access = canSearch(input.session);
  if (!access.ok) {
    return access;
  }
  const query = input.query?.trim() ? input.query : CANONICAL_SEARCH_QUERY;
  const criteria = parseSearchQuery(query);
  const flags = getFeatureFlags();
  const tourState = parseFixtureTours(input.tourCookie);
  const feedback =
    access.session.role === "buyer"
      ? feedbackFrom(access.session.clerkId, input.searchState, tourState)
      : [];
  const ranked = rankSearchListings({
    listings: seedSearchListings(),
    criteria,
    feedback,
    town: SEED_SEARCH.town.coordinates,
    mlsEnabled: flags.FLAG_MLS,
  });
  return {
    ok: true,
    view: {
      query,
      criteria,
      inventory: ranked.inventory,
      mlsEnabled: flags.FLAG_MLS,
      results: ranked.results,
      signals:
        access.session.role === "buyer"
          ? (input.searchState.signals[access.session.clerkId] ?? {})
          : {},
    },
  };
}

export function recordFixtureSignal(input: {
  session: TestSession | null;
  searchState: FixtureSearchState;
  propertyId: string;
  kind: "save" | "dislike" | "clear";
}):
  | { ok: true; state: FixtureSearchState }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  const access = canSearch(input.session);
  if (!access.ok) {
    return access;
  }
  if (access.session.role !== "buyer") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (!isSeedSearchPropertyId(input.propertyId)) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const listing = seedSearchListings().find((row) => row.id === input.propertyId);
  if (listing === undefined || listing.source === "mls") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  const clerkId = access.session.clerkId;
  const current = input.searchState.signals[clerkId] ?? {};
  const nextSignals =
    input.kind === "clear"
      ? Object.fromEntries(
          Object.entries(current).filter(([id]) => id !== input.propertyId),
        )
      : {
          ...current,
          [input.propertyId]: input.kind,
        };
  return {
    ok: true,
    state: {
      signals: {
        ...input.searchState.signals,
        [clerkId]: nextSignals,
      },
    },
  };
}
