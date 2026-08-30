import {
  SEED_CLERK_IDS,
  SEED_CONCIERGE,
  SEED_OFFER_AS_OF,
  SEED_OFFER_MARKET,
  SEED_PLAN,
} from "../../convex/seedPlan";
import { SEED_TRANSACTION_IDS } from "@/lib/test-session";

export const SEED_OFFER_IDS = {
  alexDraft: "seed-offer-alex",
} as const;

export function marketForBuyer(clerkId: string) {
  return clerkId === SEED_CLERK_IDS.buyerA
    ? SEED_OFFER_MARKET.maple
    : SEED_OFFER_MARKET.cedar;
}

export function propertyForBuyer(clerkId: string) {
  const buyer = SEED_PLAN.buyers.find((row) => row.clerkId === clerkId);
  if (buyer === undefined) {
    throw new Error("UNKNOWN_BUYER");
  }
  return buyer.property;
}

export function competingInventoryCount() {
  return 1 + Object.keys(SEED_OFFER_MARKET.tourListPrices).length;
}

export function alexSeedOffer() {
  return {
    _id: SEED_OFFER_IDS.alexDraft,
    transactionId: SEED_TRANSACTION_IDS[SEED_CLERK_IDS.buyerA],
    ownerClerkId: SEED_CLERK_IDS.buyerA,
    status: "draft" as const,
    reviewedByLicenseeId: null,
    submittedAt: null,
    terms: {
      price: {
        amountCents: SEED_CONCIERGE.counterOfferCents,
        currency: "USD" as const,
        provenance: "user_entered" as const,
        asOf: SEED_OFFER_AS_OF,
        label: "Seller counter, up from $420,000",
      },
    },
  };
}
