import { describe, expect, it } from "vitest";

import { CANONICAL_SEARCH_QUERY } from "../../convex/lib/propertySearch";
import { getFeatureFlags } from "@/lib/flags";
import { SEED_SEARCH_PROPERTY_IDS } from "@/lib/seed-search";
import { SEED_TOUR_PROPERTY_IDS } from "@/lib/seed-tours";
import {
  canSearch,
  loadFixtureListing,
  loadFixtureSearch,
  recordFixtureSignal,
} from "@/lib/search-access";

const blair = {
  clerkId: "clerk_buyer_b" as const,
  name: "Blair Chen",
  role: "buyer" as const,
  transactionId: "seed:buyer-b" as const,
};

const alex = {
  clerkId: "clerk_buyer_a" as const,
  name: "Alex Rivera",
  role: "buyer" as const,
  transactionId: "seed:buyer-a" as const,
};

describe("fixture property search", () => {
  it("parses the canonical query and labels sample data", () => {
    expect(getFeatureFlags().FLAG_MLS).toBe(false);
    const loaded = loadFixtureSearch({
      session: blair,
      query: CANONICAL_SEARCH_QUERY,
      searchState: { signals: {} },
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      throw new Error("expected search view");
    }
    expect(loaded.view.criteria.beds).toBe(4);
    expect(loaded.view.criteria.priceCapCents).toBe(45_000_000);
    expect(loaded.view.criteria.minLotAcres).toBe(0.35);
    expect(loaded.view.criteria.minGarageSpaces).toBe(2);
    expect(loaded.view.criteria.driveMinutesFromTown).toBe(20);
    expect(loaded.view.inventory.kind).toBe("sample");
    expect(loaded.view.mlsEnabled).toBe(false);
    expect(loaded.view.results.every((row) => row.reason.length > 0)).toBe(true);
    expect(loaded.view.results.every((row) => row.sampleData)).toBe(true);
    expect(
      loaded.view.results.some(
        (row) => row.id === SEED_SEARCH_PROPERTY_IDS.mlsHidden,
      ),
    ).toBe(false);
    expect(loaded.view.results[0]?.id).toBe(SEED_SEARCH_PROPERTY_IDS.jonesValley);
  });

  it("changes rank order after dislike and save", () => {
    const baseline = loadFixtureSearch({
      session: blair,
      searchState: { signals: {} },
    });
    if (!baseline.ok) {
      throw new Error("expected baseline");
    }
    const firstId = baseline.view.results[0]?.id;
    const secondId = baseline.view.results[1]?.id;
    if (firstId === undefined || secondId === undefined) {
      throw new Error("expected two results");
    }
    const disliked = recordFixtureSignal({
      session: blair,
      searchState: { signals: {} },
      propertyId: firstId,
      kind: "dislike",
    });
    if (!disliked.ok) {
      throw new Error("expected dislike");
    }
    const saved = recordFixtureSignal({
      session: blair,
      searchState: disliked.state,
      propertyId: secondId,
      kind: "save",
    });
    if (!saved.ok) {
      throw new Error("expected save");
    }
    const next = loadFixtureSearch({
      session: blair,
      searchState: saved.state,
    });
    if (!next.ok) {
      throw new Error("expected rerank");
    }
    expect(next.view.results[0]?.id).toBe(secondId);
    expect(next.view.results[0]?.score).toBeGreaterThan(
      next.view.results.find((row) => row.id === firstId)?.score ?? 0,
    );

    const alexView = loadFixtureSearch({
      session: alex,
      searchState: saved.state,
    });
    if (!alexView.ok) {
      throw new Error("expected alex view");
    }
    expect(alexView.view.results[0]?.id).toBe(firstId);
  });

  it("applies M4 showing feedback from the tour cookie", () => {
    const harvest = SEED_TOUR_PROPERTY_IDS.harvest;
    const loaded = loadFixtureSearch({
      session: blair,
      searchState: { signals: {} },
      tourCookie: JSON.stringify({
        tours: [
          {
            tourId: "seed-tour:clerk_buyer_b",
            ownerClerkId: "clerk_buyer_b",
            status: "scheduled",
            date: 1,
            originLabel: "office",
            originCoordinates: { lat: 34.73, lng: -86.58 },
            originDepartAt: 1,
            driveTimeSource: "fixture",
            departureNotice: { message: "go", notifyAt: 1, notifiedAt: null },
            stops: [
              {
                stopId: "stop-harvest",
                propertyId: harvest,
                order: 1,
              },
            ],
            feedback: [
              {
                stopId: "stop-harvest",
                propertyId: harvest,
                verdict: "no",
                ratings: {
                  kitchen: 2,
                  location: 2,
                  yard: 2,
                  condition: 2,
                  layout: 2,
                  value: 2,
                },
              },
            ],
          },
        ],
      }),
    });
    if (!loaded.ok) {
      throw new Error("expected feedback rank");
    }
    const harvestRow = loaded.view.results.find((row) => row.id === harvest);
    const jones = loaded.view.results.find(
      (row) => row.id === SEED_SEARCH_PROPERTY_IDS.jonesValley,
    );
    if (harvestRow === undefined || jones === undefined) {
      throw new Error("expected both rows");
    }
    expect(jones.score).toBeGreaterThan(harvestRow.score);
  });

  it("filters Madison and stays empty for a city with no sample homes", () => {
    const madison = loadFixtureSearch({
      session: blair,
      query: "Madison",
      searchState: { signals: {} },
    });
    expect(madison.ok).toBe(true);
    if (!madison.ok) {
      throw new Error("expected madison");
    }
    expect(madison.view.results).toHaveLength(1);
    expect(madison.view.results[0]?.id).toBe(SEED_TOUR_PROPERTY_IDS.madison);
    expect(madison.view.results[0]?.listing.address.city).toBe("Madison");

    const empty = loadFixtureSearch({
      session: blair,
      query: "Birmingham",
      searchState: { signals: {} },
    });
    expect(empty.ok).toBe(true);
    if (!empty.ok) {
      throw new Error("expected empty");
    }
    expect(empty.view.results).toEqual([]);
    expect(empty.view.criteria.location).toBe("birmingham");
  });

  it("clears a dislike so the listing can be restored", () => {
    const disliked = recordFixtureSignal({
      session: blair,
      searchState: { signals: {} },
      propertyId: SEED_SEARCH_PROPERTY_IDS.jonesValley,
      kind: "dislike",
    });
    expect(disliked.ok).toBe(true);
    if (!disliked.ok) {
      throw new Error("expected dislike");
    }
    const cleared = recordFixtureSignal({
      session: blair,
      searchState: disliked.state,
      propertyId: SEED_SEARCH_PROPERTY_IDS.jonesValley,
      kind: "clear",
    });
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) {
      throw new Error("expected clear");
    }
    expect(
      cleared.state.signals[blair.clerkId]?.[SEED_SEARCH_PROPERTY_IDS.jonesValley],
    ).toBeUndefined();
  });

  it("denies a vendor", () => {
    expect(
      loadFixtureSearch({
        session: {
          clerkId: "clerk_lender",
          name: "Jordan Hale",
          role: "vendor",
        },
        searchState: { signals: {} },
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });
});

const jordan = {
  clerkId: "clerk_lender" as const,
  name: "Jordan Hale",
  role: "vendor" as const,
};

describe("fixture listing access", () => {
  it("denies an unauthenticated caller", () => {
    expect(canSearch(null)).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
    expect(
      loadFixtureListing({
        session: null,
        listingId: SEED_TOUR_PROPERTY_IDS.madison,
      }),
    ).toEqual({ ok: false, reason: "UNAUTHENTICATED" });
  });

  it("denies a vendor", () => {
    expect(canSearch(jordan)).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      loadFixtureListing({
        session: jordan,
        listingId: SEED_TOUR_PROPERTY_IDS.madison,
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("lets a buyer open a sample listing", () => {
    const loaded = loadFixtureListing({
      session: blair,
      listingId: SEED_TOUR_PROPERTY_IDS.madison,
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      throw new Error("expected listing");
    }
    expect(loaded.listing.id).toBe(SEED_TOUR_PROPERTY_IDS.madison);
    expect(loaded.listing.address.line1).toBe("88 Legacy Dr");
  });

  it("does not treat a missing sample id as a role allow", () => {
    expect(
      loadFixtureListing({
        session: blair,
        listingId: "not-a-listing",
      }),
    ).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(
      loadFixtureListing({
        session: jordan,
        listingId: "not-a-listing",
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });
});
