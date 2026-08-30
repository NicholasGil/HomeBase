import { v } from "convex/values";

export const roleValidator = v.union(
  v.literal("buyer"),
  v.literal("agent"),
  v.literal("broker"),
  v.literal("admin"),
  v.literal("vendor"),
);

export const moneyProvenanceValidator = v.union(
  v.literal("ai_estimate"),
  v.literal("lender_issued"),
  v.literal("title_issued"),
  v.literal("user_entered"),
);

export const moneyFigureValidator = v.object({
  amountCents: v.number(),
  currency: v.literal("USD"),
  provenance: moneyProvenanceValidator,
  asOf: v.number(),
  label: v.optional(v.string()),
});

export const featureFlagsValidator = v.object({
  FLAG_MLS: v.boolean(),
  FLAG_VENDOR_COMP: v.boolean(),
  FLAG_ESIGN: v.boolean(),
  FLAG_IDV: v.boolean(),
});

export const DEFAULT_FEATURE_FLAGS = {
  FLAG_MLS: false,
  FLAG_VENDOR_COMP: false,
  FLAG_ESIGN: false,
  FLAG_IDV: false,
} as const;

export const transactionStatusValidator = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("closed"),
  v.literal("canceled"),
);

export const taskStatusValidator = v.union(
  v.literal("open"),
  v.literal("blocked"),
  v.literal("done"),
  v.literal("canceled"),
);

export const propertySourceValidator = v.union(
  v.literal("manual"),
  v.literal("csv"),
  v.literal("mls"),
);

export const prequalStatusValidator = v.union(
  v.literal("none"),
  v.literal("in_progress"),
  v.literal("preapproved"),
  v.literal("expired"),
);

export const offerStatusValidator = v.union(
  v.literal("draft"),
  v.literal("ready"),
  v.literal("submitted"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("withdrawn"),
);

export const offerStrategyValidator = v.union(
  v.literal("stronger"),
  v.literal("balanced"),
  v.literal("value"),
);

export const financingProgramValidator = v.union(
  v.literal("conventional"),
  v.literal("fha"),
  v.literal("va"),
  v.literal("cash"),
);

export const inspectionRepairsValidator = v.union(
  v.literal("as_is"),
  v.literal("request_repairs"),
  v.literal("credit"),
);

export const offerFinancingValidator = v.object({
  program: financingProgramValidator,
  downPayment: v.optional(moneyFigureValidator),
  rateBps: v.optional(v.number()),
});

export const offerContingenciesValidator = v.object({
  inspection: v.boolean(),
  financing: v.boolean(),
  appraisal: v.boolean(),
});

export const offerInspectionTermsValidator = v.object({
  periodDays: v.number(),
  repairs: inspectionRepairsValidator,
});

export const offerTermsValidator = v.object({
  price: moneyFigureValidator,
  earnestMoney: v.optional(moneyFigureValidator),
  sellerConcessions: v.optional(moneyFigureValidator),
  closingDate: v.optional(v.number()),
  financing: v.optional(offerFinancingValidator),
  contingencies: v.optional(offerContingenciesValidator),
  inspectionTerms: v.optional(offerInspectionTermsValidator),
});

export const priceReductionValidator = v.object({
  reducedAt: v.number(),
  previousPrice: moneyFigureValidator,
  newPrice: moneyFigureValidator,
});

export const OFFER_REVIEW_ROLES = ["agent", "broker", "admin"] as const;

export const showingVerdictValidator = v.union(
  v.literal("love"),
  v.literal("maybe"),
  v.literal("no"),
);

export const coordinatesValidator = v.object({
  lat: v.number(),
  lng: v.number(),
});

export const availabilityWindowValidator = v.object({
  startsAt: v.number(),
  endsAt: v.number(),
});

export const driveTimeSourceValidator = v.union(
  v.literal("fixture"),
  v.literal("routes_api"),
);

export const showingRatingsValidator = v.object({
  kitchen: v.number(),
  location: v.number(),
  yard: v.number(),
  condition: v.number(),
  layout: v.number(),
  value: v.number(),
});

export const documentGrantScopeValidator = v.union(
  v.literal("view"),
  v.literal("download"),
);

export const TRANSACTION_READ_ROLES = [
  "buyer",
  "agent",
  "broker",
  "admin",
] as const;

export const GRANTABLE_DIRECTORY_ROLES = ["vendor"] as const;

export const JOURNEY_WRITE_ROLES = ["broker", "admin"] as const;

export const STAGE_ADVANCE_ROLES = ["agent", "broker", "admin"] as const;

export const TASK_WRITE_ROLES = ["agent", "broker", "admin"] as const;

export const defaultTaskValidator = v.object({
  title: v.string(),
  assigneeRole: roleValidator,
  blocksStage: v.boolean(),
});
