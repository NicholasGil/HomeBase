import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  availabilityWindowValidator,
  coordinatesValidator,
  documentGrantScopeValidator,
  driveTimeSourceValidator,
  featureFlagsValidator,
  moneyFigureValidator,
  offerStatusValidator,
  offerStrategyValidator,
  offerTermsValidator,
  prequalStatusValidator,
  priceReductionValidator,
  propertySourceValidator,
  roleValidator,
  showingVerdictValidator,
  signaturePacketStatusValidator,
  esignProviderValidator,
  idvPurposeValidator,
  idvSessionStatusValidator,
  idvProviderValidator,
  taskStatusValidator,
  transactionStatusValidator,
} from "./lib/validators";

const addressValidator = v.object({
  line1: v.string(),
  city: v.string(),
  state: v.string(),
  postalCode: v.string(),
});

const propertySpecsValidator = v.object({
  beds: v.optional(v.number()),
  baths: v.optional(v.number()),
  sqft: v.optional(v.number()),
  lotAcres: v.optional(v.number()),
  garageSpaces: v.optional(v.number()),
  yearBuilt: v.optional(v.number()),
});

export default defineSchema({
  orgs: defineTable({
    name: v.string(),
    state: v.string(),
    settings: v.object({
      timezone: v.optional(v.string()),
    }),
    flags: featureFlagsValidator,
  }).index("by_name", ["name"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    // Proposed DESIGN.md addition: agent/buyer availability for M4.
    availabilityWindows: v.optional(v.array(availabilityWindowValidator)),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  memberships: defineTable({
    userId: v.id("users"),
    orgId: v.id("orgs"),
    role: roleValidator,
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_org", ["userId", "orgId"]),

  clients: defineTable({
    userId: v.id("users"),
    orgId: v.id("orgs"),
    preferences: v.object({
      beds: v.optional(v.number()),
      notes: v.optional(v.string()),
    }),
    prequalStatus: prequalStatusValidator,
    budget: moneyFigureValidator,
    // Proposed DESIGN.md addition: buyer availability for M4.
    availabilityWindows: v.optional(v.array(availabilityWindowValidator)),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_org", ["userId", "orgId"]),

  properties: defineTable({
    address: addressValidator,
    specs: propertySpecsValidator,
    media: v.array(v.string()),
    source: propertySourceValidator,
    mlsId: v.optional(v.string()),
    // Proposed DESIGN.md addition: geography, brief, and showing windows for M4.
    coordinates: v.optional(coordinatesValidator),
    brief: v.optional(v.string()),
    showingDurationMinutes: v.optional(v.number()),
    availabilityWindows: v.optional(v.array(availabilityWindowValidator)),
    // Proposed DESIGN.md addition: listing history for M5 market context.
    listPrice: v.optional(moneyFigureValidator),
    listedAt: v.optional(v.number()),
    priceReductions: v.optional(v.array(priceReductionValidator)),
  }),

  transactions: defineTable({
    orgId: v.id("orgs"),
    clientId: v.id("clients"),
    agentId: v.id("users"),
    propertyId: v.optional(v.id("properties")),
    stage: v.string(),
    status: transactionStatusValidator,
    keyDates: v.object({
      underContractAt: v.optional(v.number()),
      inspectionDueAt: v.optional(v.number()),
      closingAt: v.optional(v.number()),
    }),
    // Proposed DESIGN.md addition: owedToday so the ten-second test has a sourced figure.
    owedToday: v.optional(moneyFigureValidator),
  })
    .index("by_org", ["orgId"])
    .index("by_client", ["clientId"])
    .index("by_agent", ["agentId"]),

  journeyStages: defineTable({
    orgId: v.id("orgs"),
    key: v.string(),
    label: v.string(),
    order: v.number(),
    defaultTasks: v.array(
      v.object({
        title: v.string(),
        assigneeRole: roleValidator,
        blocksStage: v.boolean(),
      }),
    ),
    requiredDocuments: v.array(v.string()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_key", ["orgId", "key"]),

  tasks: defineTable({
    transactionId: v.id("transactions"),
    stage: v.string(),
    title: v.string(),
    assigneeRole: roleValidator,
    dueDate: v.optional(v.number()),
    blockedBy: v.array(v.id("tasks")),
    status: taskStatusValidator,
    blocksStage: v.boolean(),
  }).index("by_transaction", ["transactionId"]),

  documents: defineTable({
    transactionId: v.id("transactions"),
    type: v.string(),
    storageId: v.optional(v.id("_storage")),
    extractedSummary: v.optional(v.string()),
    status: v.union(
      v.literal("uploaded"),
      v.literal("classified"),
      v.literal("summarized"),
      v.literal("missing"),
    ),
    uploadedBy: v.id("users"),
  }).index("by_transaction", ["transactionId"]),

  documentGrants: defineTable({
    documentId: v.id("documents"),
    granteeId: v.id("users"),
    scope: documentGrantScopeValidator,
    expiresAt: v.number(),
    grantedBy: v.id("users"),
    revokedAt: v.optional(v.number()),
  })
    .index("by_document", ["documentId"])
    .index("by_grantee", ["granteeId"]),

  appointments: defineTable({
    transactionId: v.id("transactions"),
    type: v.string(),
    propertyId: v.optional(v.id("properties")),
    startsAt: v.number(),
    endsAt: v.number(),
    participants: v.array(v.id("users")),
  }).index("by_transaction", ["transactionId"]),

  tours: defineTable({
    clientId: v.id("clients"),
    agentId: v.id("users"),
    date: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("canceled"),
    ),
    originLabel: v.optional(v.string()),
    originCoordinates: v.optional(coordinatesValidator),
    bufferMinutes: v.optional(v.number()),
    appointmentLengthMinutes: v.optional(v.number()),
    departureNotifiedAt: v.optional(v.number()),
    driveTimeSource: v.optional(driveTimeSourceValidator),
  })
    .index("by_client", ["clientId"])
    .index("by_agent", ["agentId"]),

  tourStops: defineTable({
    tourId: v.id("tours"),
    propertyId: v.id("properties"),
    order: v.number(),
    arriveAt: v.number(),
    departAt: v.number(),
    driveMinutes: v.number(),
    directionsSummary: v.optional(v.string()),
    windowStartsAt: v.optional(v.number()),
    windowEndsAt: v.optional(v.number()),
  }).index("by_tour", ["tourId"]),

  showingFeedback: defineTable({
    tourStopId: v.id("tourStops"),
    verdict: showingVerdictValidator,
    ratings: v.object({
      kitchen: v.number(),
      location: v.number(),
      yard: v.number(),
      condition: v.number(),
      layout: v.number(),
      value: v.number(),
    }),
    notes: v.optional(v.string()),
  }).index("by_tourStop", ["tourStopId"]),

  // M9. Saves and dislikes for ranking. Tours and showingFeedback
  // already exist; this is the missing pair from DESIGN.md M9.
  propertySignals: defineTable({
    clientId: v.id("clients"),
    propertyId: v.id("properties"),
    kind: v.union(v.literal("save"), v.literal("dislike")),
    at: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_property", ["clientId", "propertyId"]),

  comps: defineTable({
    propertyId: v.id("properties"),
    address: addressValidator,
    soldPrice: moneyFigureValidator,
    soldDate: v.number(),
    specs: propertySpecsValidator,
    source: v.string(),
  }).index("by_property", ["propertyId"]),

  offers: defineTable({
    transactionId: v.id("transactions"),
    terms: offerTermsValidator,
    status: offerStatusValidator,
    reviewedByLicenseeId: v.optional(v.id("users")),
    submittedAt: v.optional(v.number()),
  }).index("by_transaction", ["transactionId"]),

  offerScenarios: defineTable({
    offerId: v.id("offers"),
    strategy: offerStrategyValidator,
    terms: offerTermsValidator,
    modeledOutcome: v.object({
      cashToClose: moneyFigureValidator,
      monthlyPayment: moneyFigureValidator,
    }),
    tradeoffs: v.array(v.string()),
  }).index("by_offer", ["offerId"]),

  vendors: defineTable({
    orgId: v.id("orgs"),
    category: v.string(),
    name: v.string(),
    contact: v.object({
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
    }),
    notes: v.optional(v.string()),
    credentials: v.optional(v.string()),
    // Portal identity. Directory-only vendors omit this.
    userId: v.optional(v.id("users")),
    // Stored value is pinned to none. Writes of any other model are
    // rejected in vendors.ts while FLAG_VENDOR_COMP is off (DESIGN.md M10).
    compensationModel: v.literal("none"),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_category", ["orgId", "category"]),

  vendorAssignments: defineTable({
    vendorId: v.id("vendors"),
    transactionId: v.id("transactions"),
    scope: v.string(),
    expiresAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("complete"),
      v.literal("revoked"),
    ),
  })
    .index("by_vendor", ["vendorId"])
    .index("by_transaction", ["transactionId"]),

  vendorMessages: defineTable({
    assignmentId: v.id("vendorAssignments"),
    transactionId: v.id("transactions"),
    authorId: v.id("users"),
    body: v.string(),
    at: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_transaction", ["transactionId"]),

  vendorDocumentRequests: defineTable({
    assignmentId: v.id("vendorAssignments"),
    transactionId: v.id("transactions"),
    requestedBy: v.id("users"),
    documentType: v.string(),
    note: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("fulfilled"),
      v.literal("canceled"),
    ),
    at: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_transaction", ["transactionId"]),

  conciergeThreads: defineTable({
    transactionId: v.id("transactions"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
        at: v.number(),
      }),
    ),
    embeddings: v.optional(v.array(v.number())),
  }).index("by_transaction", ["transactionId"]),

  auditLog: defineTable({
    actorId: v.union(v.id("users"), v.literal("system")),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    at: v.number(),
    meta: v.record(v.string(), v.string()),
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_actor", ["actorId"]),

  // M11. App owns workflow, audit, and retention. Provider owns crypto.
  // status + providerRef only. No signature image or private key.
  signaturePackets: defineTable({
    transactionId: v.id("transactions"),
    documentId: v.id("documents"),
    status: signaturePacketStatusValidator,
    provider: esignProviderValidator,
    providerRef: v.optional(v.string()),
    designated: v.boolean(),
    retentionUntil: v.optional(v.number()),
    explainedSectionIds: v.array(v.string()),
    agentReviewedById: v.optional(v.id("users")),
    buyerReviewedById: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    signedAt: v.optional(v.number()),
    storedDocumentId: v.optional(v.id("documents")),
    createdBy: v.id("users"),
  })
    .index("by_transaction", ["transactionId"])
    .index("by_document", ["documentId"]),

  // M12 tier 2. Status + provider ref only. No selfie, ID bytes, or template.
  idvSessions: defineTable({
    orgId: v.id("orgs"),
    userId: v.id("users"),
    purpose: idvPurposeValidator,
    status: idvSessionStatusValidator,
    provider: idvProviderValidator,
    providerRef: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_org_user", ["orgId", "userId"]),
});
