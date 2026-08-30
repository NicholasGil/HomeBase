import { describe, expect, it } from "vitest";

import { DEFAULT_FEATURE_FLAGS } from "./validators";
import {
  CANONICAL_SEARCH_QUERY,
  MLS_FEED_NOT_ENABLED,
  filterSearchableListings,
  parseSearchQuery,
  rankSearchListings,
  SEARCH_SCORE,
  type SearchListing,
} from "./propertySearch";

const town = { lat: 34.7308, lng: -86.5861 };

function listing(
  id: string,
  overrides: Partial<SearchListing> = {},
): SearchListing {
  return {
    id,
    address: {
      line1: `${id} Sample Rd`,
      city: "Huntsville",
      state: "AL",
      postalCode: "35801",
    },
    specs: { beds: 4, baths: 2, sqft: 2100, lotAcres: 0.5, garageSpaces: 2 },
    source: "manual",
    listPrice: {
      amountCents: 42_000_000,
      currency: "USD",
      provenance: "user_entered",
      asOf: 1,
      label: "List price · sample data",
    },
    driveMinutesFromTown: 18,
    ...overrides,
  };
}

const inventory = [
  listing("near-match"),
  listing("far-match", { driveMinutesFromTown: 46 }),
  listing("over-price", {
    listPrice: {
      amountCents: 49_900_000,
      currency: "USD",
      provenance: "user_entered",
      asOf: 1,
      label: "List price · sample data",
    },
  }),
  listing("three-bed", { specs: { beds: 3, lotAcres: 0.5, garageSpaces: 2 } }),
  listing("mls-only", { source: "mls", driveMinutesFromTown: 12 }),
];

describe("conversational property search", () => {
  it("parses the canonical query into structured criteria", () => {
    expect(DEFAULT_FEATURE_FLAGS.FLAG_MLS).toBe(false);
    expect(parseSearchQuery(CANONICAL_SEARCH_QUERY)).toEqual({
      beds: 4,
      priceCapCents: 45_000_000,
      minLotAcres: 0.35,
      minGarageSpaces: 2,
      driveMinutesFromTown: 20,
    });
  });

  it("ranks sample listings with a stated reason on every row", () => {
    const criteria = parseSearchQuery(CANONICAL_SEARCH_QUERY);
    const ranked = rankSearchListings({
      listings: inventory,
      criteria,
      town,
      mlsEnabled: false,
    });
    expect(ranked.inventory).toEqual({ kind: "sample", flagMls: false });
    expect(ranked.results.map((row) => row.id)).toEqual([
      "near-match",
      "far-match",
      "three-bed",
      "over-price",
    ]);
    expect(ranked.results.every((row) => row.reason.length > 0)).toBe(true);
    expect(ranked.results.every((row) => row.sampleData)).toBe(true);
    expect(ranked.results.some((row) => row.id === "mls-only")).toBe(false);
    expect(ranked.results[0]?.reason).toMatch(/4 bedrooms/i);
    expect(ranked.results[0]?.reason).toMatch(/under \$450,000/);
    expect(ranked.results[0]?.reason).toMatch(/garage/i);
    expect(ranked.results[0]?.reason).toMatch(/minutes from town/);
  });

  it("shifts later ranking when save, dislike, tour, and showing feedback land", () => {
    const criteria = parseSearchQuery(CANONICAL_SEARCH_QUERY);
    const baseline = rankSearchListings({
      listings: inventory,
      criteria,
      town,
      mlsEnabled: false,
    });
    expect(baseline.results[0]?.id).toBe("near-match");
    expect(baseline.results[1]?.id).toBe("far-match");
    const nearScore = baseline.results[0]?.score;
    const farScore = baseline.results[1]?.score;
    if (nearScore === undefined || farScore === undefined) {
      throw new Error("expected two scored rows");
    }
    expect(nearScore).toBeGreaterThan(farScore);

    const afterDislike = rankSearchListings({
      listings: inventory,
      criteria,
      town,
      mlsEnabled: false,
      feedback: [{ kind: "dislike", propertyId: "near-match" }],
    });
    expect(afterDislike.results[0]?.id).toBe("far-match");
    expect(afterDislike.results.find((row) => row.id === "near-match")?.score).toBe(
      nearScore + SEARCH_SCORE.dislike,
    );
    expect(afterDislike.results[0]?.score).toBeGreaterThan(
      afterDislike.results.find((row) => row.id === "near-match")?.score ?? 0,
    );

    const afterSaveAndTour = rankSearchListings({
      listings: inventory,
      criteria,
      town,
      mlsEnabled: false,
      feedback: [
        { kind: "save", propertyId: "three-bed" },
        { kind: "tour", propertyId: "three-bed" },
        { kind: "showing", propertyId: "three-bed", verdict: "love" },
      ],
    });
    const lifted = afterSaveAndTour.results.find((row) => row.id === "three-bed");
    const untouched = afterSaveAndTour.results.find((row) => row.id === "near-match");
    if (lifted === undefined || untouched === undefined) {
      throw new Error("expected both rows");
    }
    const threeBedBase = baseline.results.find((row) => row.id === "three-bed");
    if (threeBedBase === undefined) {
      throw new Error("expected three-bed baseline");
    }
    expect(lifted.score).toBe(
      threeBedBase.score +
        SEARCH_SCORE.save +
        SEARCH_SCORE.tour +
        SEARCH_SCORE.showingLove,
    );
    expect(lifted.score).toBeGreaterThan(untouched.score);
    expect(afterSaveAndTour.results[0]?.id).toBe("three-bed");
  });

  it("keeps the licensed-feed path closed and never treats a missing price as zero", () => {
    expect(MLS_FEED_NOT_ENABLED).toBe("MLS_FEED_NOT_ENABLED");
    const closed = filterSearchableListings(inventory, true);
    expect(closed.inventory).toEqual({
      kind: "licensed_feed",
      enabled: false,
      flagMls: true,
    });
    expect(closed.listings).toEqual([]);

    const missingPrice = listing("no-price", { listPrice: undefined });
    const ranked = rankSearchListings({
      listings: [missingPrice, listing("priced")],
      criteria: parseSearchQuery(CANONICAL_SEARCH_QUERY),
      town,
      mlsEnabled: false,
    });
    const row = ranked.results.find((item) => item.id === "no-price");
    expect(row?.reason).toMatch(/list price not stated/i);
    expect(row?.listing.listPrice).toBeUndefined();
  });
});
