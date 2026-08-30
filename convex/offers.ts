import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import {
  assertRole,
  requireTransactionAccess,
  requireTransactionReadRole,
} from "./lib/authz";
import {
  SAMPLE_DATA_LABEL,
  assertCanSubmit,
  daysOnMarket,
  estimatedPosition,
  modelAllStrategies,
  offerGate,
  simulateOfferCost,
  type MoneyFigure,
} from "./lib/offerModel";
import {
  financingProgramValidator,
  OFFER_REVIEW_ROLES,
} from "./lib/validators";
import { listAccessibleTransactions } from "./transactions";

type ReadCtx = QueryCtx | MutationCtx;

function asOfNow() {
  return Date.now();
}

async function compsForProperty(ctx: ReadCtx, propertyId: Id<"properties">) {
  return await ctx.db
    .query("comps")
    .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
    .collect();
}

async function competingInventoryCount(
  ctx: ReadCtx,
  subjectId: Id<"properties">,
  mlsEnabled: boolean,
) {
  const properties = await ctx.db.query("properties").collect();
  return properties.filter((property) => {
    if (property._id === subjectId) {
      return false;
    }
    if (property.listPrice === undefined) {
      return false;
    }
    if (property.source === "mls" && !mlsEnabled) {
      return false;
    }
    return property.source === "manual" || property.source === "csv";
  }).length;
}

function listPriceCents(property: Doc<"properties">) {
  return property.listPrice?.amountCents ?? 0;
}

function toMarketContext(input: {
  property: Doc<"properties">;
  comps: Doc<"comps">[];
  competingInventory: number;
  asOf: number;
}) {
  const listPrice = input.property.listPrice;
  if (listPrice === undefined) {
    throw new Error("LISTING_PRICE_MISSING");
  }
  const listedAt = input.property.listedAt ?? input.asOf;
  const position = estimatedPosition({
    listPriceCents: listPrice.amountCents,
    compSoldCents: input.comps.map((comp) => comp.soldPrice.amountCents),
  });
  return {
    sampleData: SAMPLE_DATA_LABEL,
    daysOnMarket: daysOnMarket(listedAt, input.asOf),
    listPrice,
    priceReductions: input.property.priceReductions ?? [],
    competingInventory: {
      count: input.competingInventory,
      label: SAMPLE_DATA_LABEL,
    },
    estimatedPosition: {
      label: position.label,
      vsCompsCents: position.vsCompsCents,
      averageComp:
        position.averageCompCents === null
          ? null
          : ({
              amountCents: position.averageCompCents,
              currency: "USD" as const,
              provenance: "user_entered" as const,
              asOf: input.asOf,
              label: "Average sample comp",
            } satisfies MoneyFigure),
    },
    comps: input.comps.map((comp) => ({
      address: comp.address,
      soldPrice: comp.soldPrice,
      soldDate: comp.soldDate,
      specs: comp.specs,
      source: comp.source,
    })),
  };
}

async function loadCenter(
  ctx: ReadCtx,
  transaction: Doc<"transactions">,
  asOf: number,
) {
  if (transaction.propertyId === undefined) {
    throw new Error("FORBIDDEN");
  }
  const property = await ctx.db.get(transaction.propertyId);
  if (property === null) {
    throw new Error("FORBIDDEN");
  }
  const org = await ctx.db.get(transaction.orgId);
  const mlsEnabled = org?.flags.FLAG_MLS === true;
  const [comps, competingInventory, offers] = await Promise.all([
    compsForProperty(ctx, property._id),
    competingInventoryCount(ctx, property._id, mlsEnabled),
    ctx.db
      .query("offers")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", transaction._id),
      )
      .collect(),
  ]);
  const offer = offers[0];
  const scenarios =
    offer === undefined
      ? modelAllStrategies({
          listPriceCents: listPriceCents(property),
          asOf,
        })
      : await loadOrModelScenarios(ctx, offer, listPriceCents(property), asOf);
  return {
    transactionId: transaction._id,
    propertyAddress: property.address,
    market: toMarketContext({
      property,
      comps,
      competingInventory,
      asOf,
    }),
    offer:
      offer === undefined
        ? null
        : {
            _id: offer._id,
            status: offer.status,
            terms: offer.terms,
            reviewedByLicenseeId: offer.reviewedByLicenseeId ?? null,
            submittedAt: offer.submittedAt ?? null,
            gate: offerGate(offer),
          },
    scenarios,
  };
}

async function loadOrModelScenarios(
  ctx: ReadCtx,
  offer: Doc<"offers">,
  listPriceCentsValue: number,
  asOf: number,
) {
  const stored = await ctx.db
    .query("offerScenarios")
    .withIndex("by_offer", (q) => q.eq("offerId", offer._id))
    .collect();
  if (stored.length === 3) {
    return stored.map((row) => ({
      strategy: row.strategy,
      terms: row.terms,
      modeledOutcome: row.modeledOutcome,
      tradeoffs: row.tradeoffs,
    }));
  }
  return modelAllStrategies({
    listPriceCents: listPriceCentsValue,
    asOf,
  });
}

async function requireOfferAccess(ctx: ReadCtx, offerId: Id<"offers">) {
  const offer = await ctx.db.get(offerId);
  if (offer === null) {
    throw new Error("FORBIDDEN");
  }
  const session = await requireTransactionAccess(ctx, offer.transactionId);
  return { ...session, offer };
}

async function writeScenarios(
  ctx: MutationCtx,
  offerId: Id<"offers">,
  listPriceCentsValue: number,
  asOf: number,
) {
  const existing = await ctx.db
    .query("offerScenarios")
    .withIndex("by_offer", (q) => q.eq("offerId", offerId))
    .collect();
  for (const row of existing) {
    await ctx.db.delete(row._id);
  }
  const modeled = modelAllStrategies({
    listPriceCents: listPriceCentsValue,
    asOf,
  });
  for (const scenario of modeled) {
    await ctx.db.insert("offerScenarios", {
      offerId,
      strategy: scenario.strategy,
      terms: scenario.terms,
      modeledOutcome: scenario.modeledOutcome,
      tradeoffs: scenario.tradeoffs,
    });
  }
  return modeled;
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireTransactionReadRole(ctx);
    const transactions = await listAccessibleTransactions(
      ctx,
      user._id,
      membership,
    );
    const first = transactions[0];
    if (first === undefined) {
      return null;
    }
    return await loadCenter(ctx, first, asOfNow());
  },
});

export const simulate = query({
  args: {
    transactionId: v.id("transactions"),
    purchasePriceCents: v.number(),
    downPaymentCents: v.number(),
    sellerConcessionsCents: v.number(),
    rateBps: v.number(),
    program: financingProgramValidator,
  },
  handler: async (ctx, args) => {
    await requireTransactionAccess(ctx, args.transactionId);
    return simulateOfferCost({
      purchasePriceCents: args.purchasePriceCents,
      downPaymentCents: args.downPaymentCents,
      sellerConcessionsCents: args.sellerConcessionsCents,
      rateBps: args.rateBps,
      program: args.program,
      asOf: asOfNow(),
    });
  },
});

export const getCenter = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    return await loadCenter(ctx, transaction, asOfNow());
  },
});

export const ensureDraft = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { user, transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    const asOf = asOfNow();
    const existing = await ctx.db
      .query("offers")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .first();
    if (existing !== null) {
      return await loadCenter(ctx, transaction, asOf);
    }
    if (transaction.propertyId === undefined) {
      throw new Error("FORBIDDEN");
    }
    const property = await ctx.db.get(transaction.propertyId);
    if (property === null || property.listPrice === undefined) {
      throw new Error("LISTING_PRICE_MISSING");
    }
    const offerId = await ctx.db.insert("offers", {
      transactionId: args.transactionId,
      terms: {
        price: {
          ...property.listPrice,
          label: "Draft at list",
        },
      },
      status: "draft",
    });
    await writeScenarios(ctx, offerId, property.listPrice.amountCents, asOf);
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "offer.drafted",
      targetType: "offer",
      targetId: offerId,
      meta: { transactionId: args.transactionId },
    });
    return await loadCenter(ctx, transaction, asOf);
  },
});

export const review = mutation({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const session = await requireOfferAccess(ctx, args.offerId);
    assertRole(session.membership, OFFER_REVIEW_ROLES);
    const nextStatus =
      session.offer.status === "draft" ? "ready" : session.offer.status;
    await ctx.db.patch(args.offerId, {
      reviewedByLicenseeId: session.user._id,
      status: nextStatus,
    });
    await appendAuditLog(ctx, {
      actorId: session.user._id,
      action: "offer.reviewed",
      targetType: "offer",
      targetId: args.offerId,
      meta: { transactionId: session.offer.transactionId },
    });
    return await loadCenter(ctx, session.transaction, asOfNow());
  },
});

export const submit = mutation({
  args: { offerId: v.id("offers") },
  handler: async (ctx, args) => {
    const session = await requireOfferAccess(ctx, args.offerId);
    assertCanSubmit(session.offer);
    if (session.offer.submittedAt !== undefined) {
      return await loadCenter(ctx, session.transaction, asOfNow());
    }
    await ctx.db.patch(args.offerId, {
      status: "submitted",
      submittedAt: asOfNow(),
    });
    await appendAuditLog(ctx, {
      actorId: session.user._id,
      action: "offer.submitted",
      targetType: "offer",
      targetId: args.offerId,
      meta: { transactionId: session.offer.transactionId },
    });
    return await loadCenter(ctx, session.transaction, asOfNow());
  },
});
