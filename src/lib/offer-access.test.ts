import { describe, expect, it } from "vitest";

import { ESIGN_NOT_ENABLED } from "../../convex/lib/esign";
import { LICENSEE_REVIEW_REQUIRED } from "../../convex/lib/offerModel";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import { collectScenarioFigures, everyFigureHasProvenance } from "../../convex/lib/offerModel";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";
import {
  ensureFixtureDraft,
  loadFixtureOfferCenter,
  submitFixtureOffer,
} from "@/lib/offer-access";

const blair: {
  clerkId: string;
  role: "buyer";
  transactionId: string;
} = {
  clerkId: SEED_CLERK_IDS.buyerB,
  role: "buyer",
  transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerB],
};

const alex: {
  clerkId: string;
  role: "buyer";
  transactionId: string;
} = {
  clerkId: SEED_CLERK_IDS.buyerA,
  role: "buyer",
  transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerA],
};

describe("fixture offer access", () => {
  it("shows three sourced scenarios and blocks submit without a licensee", () => {
    const loaded = loadFixtureOfferCenter({
      viewer: blair,
      state: { drafts: [] },
    });
    if (!loaded.ok) {
      throw new Error(loaded.reason);
    }
    expect(loaded.center.scenarios).toHaveLength(3);
    expect(loaded.center.offer).toBeNull();
    for (const scenario of loaded.center.scenarios) {
      expect(scenario.tradeoffs.length).toBeGreaterThan(0);
      expect(
        everyFigureHasProvenance(collectScenarioFigures(scenario)),
      ).toBe(true);
    }
    const drafted = ensureFixtureDraft({
      viewer: blair,
      state: { drafts: [] },
    });
    if (!drafted.ok) {
      throw new Error(drafted.reason);
    }
    expect(drafted.center.offer?.reviewedByLicenseeId).toBeNull();
    const submitted = submitFixtureOffer({
      viewer: blair,
      state: drafted.state,
    });
    expect(submitted.ok).toBe(false);
    if (submitted.ok) {
      throw new Error("gate should hold");
    }
    expect(submitted.reason).toBe(ESIGN_NOT_ENABLED);
    expect(drafted.center.offer?.gate.reason).toBe(LICENSEE_REVIEW_REQUIRED);
  });

  it("keeps the seeded Alex offer unsigned and denies vendor and the other buyer", () => {
    const alexLoaded = loadFixtureOfferCenter({
      viewer: alex,
      state: { drafts: [] },
    });
    if (!alexLoaded.ok) {
      throw new Error(alexLoaded.reason);
    }
    expect(alexLoaded.center.offer?.reviewedByLicenseeId).toBeNull();
    expect(alexLoaded.center.offer?.status).toBe("draft");
    expect(alexLoaded.center.offer?.gate.reason).toBe(LICENSEE_REVIEW_REQUIRED);
    expect(
      submitFixtureOffer({ viewer: alex, state: { drafts: [] } }).ok,
    ).toBe(false);

    expect(
      loadFixtureOfferCenter({
        viewer: { clerkId: SEED_CLERK_IDS.lender, role: "vendor" },
        state: { drafts: [] },
      }).ok,
    ).toBe(false);
    expect(
      loadFixtureOfferCenter({
        viewer: null,
        state: { drafts: [] },
      }),
    ).toEqual({ ok: false, reason: "UNAUTHENTICATED" });
  });
});
