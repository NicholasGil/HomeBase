import {
  LICENSEE_REVIEW_REQUIRED,
  SAMPLE_DATA_LABEL,
  assertCanSubmit,
  daysOnMarket,
  estimatedPosition,
  modelAllStrategies,
  offerGate,
  type ModeledScenario,
  type MoneyFigure,
  type OfferTerms,
} from "../../convex/lib/offerModel";
import { SEED_CLERK_IDS, SEED_OFFER_AS_OF } from "../../convex/seedPlan";
import {
  alexSeedOffer,
  competingInventoryCount,
  marketForBuyer,
  propertyForBuyer,
} from "@/lib/seed-offers";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";
import type { TestSession } from "@/lib/test-session";

export const FIXTURE_OFFER_COOKIE = "hb_fixture_offers";

export type FixtureOfferRecord = {
  _id: string;
  transactionId: string;
  ownerClerkId: string;
  status: "draft" | "ready" | "submitted";
  reviewedByLicenseeId: string | null;
  submittedAt: number | null;
  terms: OfferTerms;
};

export type FixtureOfferState = {
  drafts: FixtureOfferRecord[];
};

export type OfferCenterView = {
  transactionId: string;
  propertyAddress: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  market: {
    sampleData: string;
    daysOnMarket: number;
    listPrice: MoneyFigure;
    priceReductions: {
      reducedAt: number;
      previousPrice: MoneyFigure;
      newPrice: MoneyFigure;
    }[];
    competingInventory: { count: number; label: string };
    estimatedPosition: {
      label: string;
      vsCompsCents: number;
      averageComp: MoneyFigure | null;
    };
    comps: {
      address: {
        line1: string;
        city: string;
        state: string;
        postalCode: string;
      };
      soldPrice: MoneyFigure;
      soldDate: number;
      specs: { beds?: number; baths?: number; sqft?: number };
      source: string;
    }[];
  };
  offer: {
    _id: string;
    status: string;
    terms: OfferTerms;
    reviewedByLicenseeId: string | null;
    submittedAt: number | null;
    gate: ReturnType<typeof offerGate>;
  } | null;
  scenarios: ModeledScenario[];
};

export type FixtureViewer = {
  clerkId: string;
  role: "buyer" | "vendor" | "agent" | "broker" | "admin";
  transactionId?: string;
};

export function parseFixtureOffers(value: string | undefined): FixtureOfferState {
  if (value === undefined || value.length === 0) {
    return { drafts: [] };
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || !("drafts" in parsed)) {
      return { drafts: [] };
    }
    const drafts = (parsed as { drafts: unknown }).drafts;
    if (!Array.isArray(drafts)) {
      return { drafts: [] };
    }
    return { drafts: drafts as FixtureOfferRecord[] };
  } catch {
    return { drafts: [] };
  }
}

export function sessionAsOfferViewer(
  session: TestSession | null,
): FixtureViewer | null {
  if (session === null) {
    return null;
  }
  if (session.role === "vendor") {
    return { clerkId: session.clerkId, role: "vendor" };
  }
  return {
    clerkId: session.clerkId,
    role: session.role,
    transactionId: session.transactionId,
  };
}

function offerForViewer(input: {
  viewer: FixtureViewer;
  state: FixtureOfferState;
}) {
  if (input.viewer.clerkId === SEED_CLERK_IDS.buyerA) {
    return alexSeedOffer();
  }
  return (
    input.state.drafts.find(
      (row) => row.ownerClerkId === input.viewer.clerkId,
    ) ?? null
  );
}

export function buildOfferCenter(input: {
  viewer: FixtureViewer;
  state: FixtureOfferState;
  asOf?: number;
}): OfferCenterView {
  const asOf = input.asOf ?? SEED_OFFER_AS_OF;
  const market = marketForBuyer(input.viewer.clerkId);
  const listPrice = market.listPrice;
  const position = estimatedPosition({
    listPriceCents: listPrice.amountCents,
    compSoldCents: market.comps.map((comp) => comp.soldPrice.amountCents),
  });
  const offer = offerForViewer(input);
  return {
    transactionId:
      input.viewer.transactionId ??
      SEED_TRANSACTION_IDS[
        input.viewer.clerkId === SEED_CLERK_IDS.buyerA
          ? SEED_CLERK_IDS.buyerA
          : SEED_CLERK_IDS.buyerB
      ],
    propertyAddress: propertyForBuyer(input.viewer.clerkId),
    market: {
      sampleData: SAMPLE_DATA_LABEL,
      daysOnMarket: daysOnMarket(market.listedAt, asOf),
      listPrice: { ...listPrice },
      priceReductions: market.priceReductions.map((row) => ({
        reducedAt: row.reducedAt,
        previousPrice: { ...row.previousPrice },
        newPrice: { ...row.newPrice },
      })),
      competingInventory: {
        count: competingInventoryCount(),
        label: SAMPLE_DATA_LABEL,
      },
      estimatedPosition: {
        label: position.label,
        vsCompsCents: position.vsCompsCents,
        averageComp:
          position.averageCompCents === null
            ? null
            : {
                amountCents: position.averageCompCents,
                currency: "USD",
                provenance: "user_entered",
                asOf,
                label: "Average sample comp",
              },
      },
      comps: market.comps.map((comp) => ({
        address: { ...comp.address },
        soldPrice: { ...comp.soldPrice },
        soldDate: comp.soldDate,
        specs: { ...comp.specs },
        source: comp.source,
      })),
    },
    offer:
      offer === null
        ? null
        : {
            _id: offer._id,
            status: offer.status,
            terms: offer.terms,
            reviewedByLicenseeId: offer.reviewedByLicenseeId,
            submittedAt: offer.submittedAt,
            gate: offerGate(offer),
          },
    scenarios: modelAllStrategies({
      listPriceCents: listPrice.amountCents,
      asOf,
    }),
  };
}

export function loadFixtureOfferCenter(input: {
  viewer: FixtureViewer | null;
  state: FixtureOfferState;
}):
  | { ok: true; center: OfferCenterView }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  if (input.viewer === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (input.viewer.role === "vendor") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (input.viewer.role !== "buyer" || input.viewer.transactionId === undefined) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return {
    ok: true,
    center: buildOfferCenter({ viewer: input.viewer, state: input.state }),
  };
}

export function ensureFixtureDraft(input: {
  viewer: FixtureViewer | null;
  state: FixtureOfferState;
}):
  | { ok: true; center: OfferCenterView; state: FixtureOfferState }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" } {
  const loaded = loadFixtureOfferCenter(input);
  if (!loaded.ok) {
    return loaded;
  }
  if (input.viewer === null) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (loaded.center.offer !== null) {
    return { ok: true, center: loaded.center, state: input.state };
  }
  const market = marketForBuyer(input.viewer.clerkId);
  const draft: FixtureOfferRecord = {
    _id: `fixture-offer-${input.viewer.clerkId}`,
    transactionId: loaded.center.transactionId,
    ownerClerkId: input.viewer.clerkId,
    status: "draft",
    reviewedByLicenseeId: null,
    submittedAt: null,
    terms: {
      price: {
        ...market.listPrice,
        label: "Draft at list",
      },
    },
  };
  const state = { drafts: [...input.state.drafts, draft] };
  return {
    ok: true,
    state,
    center: buildOfferCenter({ viewer: input.viewer, state }),
  };
}

export function submitFixtureOffer(input: {
  viewer: FixtureViewer | null;
  state: FixtureOfferState;
}):
  | { ok: true; center: OfferCenterView; state: FixtureOfferState }
  | {
      ok: false;
      reason: "UNAUTHENTICATED" | "FORBIDDEN" | typeof LICENSEE_REVIEW_REQUIRED;
    } {
  const ensured = ensureFixtureDraft(input);
  if (!ensured.ok) {
    return ensured;
  }
  const offer = ensured.center.offer;
  if (offer === null) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  try {
    assertCanSubmit(offer);
  } catch (error) {
    if (error instanceof Error && error.message === LICENSEE_REVIEW_REQUIRED) {
      return { ok: false, reason: LICENSEE_REVIEW_REQUIRED };
    }
    throw error;
  }
  return { ok: false, reason: "FORBIDDEN" };
}
