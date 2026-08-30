import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import { requireTransactionReadRole } from "./lib/authz";
import {
  CANONICAL_SEARCH_QUERY,
  MLS_FEED_NOT_ENABLED,
  parseSearchQuery,
  rankSearchListings,
  type SearchFeedbackEvent,
  type SearchListing,
} from "./lib/propertySearch";
import { propertySignalKindValidator } from "./lib/validators";
import { SEED_SEARCH } from "./seedPlan";

type ReadCtx = QueryCtx | MutationCtx;

async function orgAllowsMls(ctx: ReadCtx, orgId: Id<"orgs">) {
  const org = await ctx.db.get(orgId);
  return org?.flags.FLAG_MLS === true;
}

async function clientForViewer(
  ctx: ReadCtx,
  session: { user: Doc<"users">; membership: Doc<"memberships"> },
) {
  if (session.membership.role !== "buyer") {
    return null;
  }
  return await ctx.db
    .query("clients")
    .withIndex("by_user_org", (q) =>
      q.eq("userId", session.user._id).eq("orgId", session.membership.orgId),
    )
    .unique();
}

function toSearchListing(property: Doc<"properties">): SearchListing {
  return {
    id: property._id,
    address: property.address,
    specs: property.specs,
    source: property.source,
    coordinates: property.coordinates,
    brief: property.brief,
    listPrice: property.listPrice,
  };
}

async function feedbackForClient(
  ctx: ReadCtx,
  clientId: Id<"clients">,
): Promise<SearchFeedbackEvent[]> {
  const events: SearchFeedbackEvent[] = [];
  const signals = await ctx.db
    .query("propertySignals")
    .withIndex("by_client", (q) => q.eq("clientId", clientId))
    .collect();
  for (const signal of signals) {
    events.push({ kind: signal.kind, propertyId: signal.propertyId });
  }

  const tours = await ctx.db
    .query("tours")
    .withIndex("by_client", (q) => q.eq("clientId", clientId))
    .collect();
  for (const tour of tours) {
    if (tour.status === "canceled") {
      continue;
    }
    const stops = await ctx.db
      .query("tourStops")
      .withIndex("by_tour", (q) => q.eq("tourId", tour._id))
      .collect();
    for (const stop of stops) {
      events.push({ kind: "tour", propertyId: stop.propertyId });
      const showing = await ctx.db
        .query("showingFeedback")
        .withIndex("by_tourStop", (q) => q.eq("tourStopId", stop._id))
        .unique();
      if (showing !== null) {
        events.push({
          kind: "showing",
          propertyId: stop.propertyId,
          verdict: showing.verdict,
        });
      }
    }
  }
  return events;
}

export const run = query({
  args: {
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireTransactionReadRole(ctx);
    const mlsEnabled = await orgAllowsMls(ctx, session.membership.orgId);
    const queryText = args.query ?? CANONICAL_SEARCH_QUERY;
    const criteria = parseSearchQuery(queryText);
    const properties = await ctx.db.query("properties").collect();
    const client = await clientForViewer(ctx, session);
    const feedback =
      client === null ? [] : await feedbackForClient(ctx, client._id);
    const ranked = rankSearchListings({
      listings: properties.map(toSearchListing),
      criteria,
      feedback,
      town: SEED_SEARCH.town.coordinates,
      mlsEnabled,
    });
    return {
      query: queryText,
      criteria,
      inventory: ranked.inventory,
      mlsEnabled,
      closedFeedReason:
        ranked.inventory.kind === "licensed_feed" ? MLS_FEED_NOT_ENABLED : null,
      results: ranked.results,
    };
  },
});

export const recordSignal = mutation({
  args: {
    propertyId: v.id("properties"),
    kind: propertySignalKindValidator,
  },
  handler: async (ctx, args) => {
    const session = await requireTransactionReadRole(ctx);
    if (session.membership.role !== "buyer") {
      throw new Error("FORBIDDEN");
    }
    const client = await clientForViewer(ctx, session);
    if (client === null) {
      throw new Error("FORBIDDEN");
    }
    const property = await ctx.db.get(args.propertyId);
    if (property === null) {
      throw new Error("FORBIDDEN");
    }
    const mlsEnabled = await orgAllowsMls(ctx, session.membership.orgId);
    if (property.source === "mls" && !mlsEnabled) {
      throw new Error("FORBIDDEN");
    }
    const existing = await ctx.db
      .query("propertySignals")
      .withIndex("by_client_property", (q) =>
        q.eq("clientId", client._id).eq("propertyId", args.propertyId),
      )
      .unique();
    const now = Date.now();
    if (existing === null) {
      await ctx.db.insert("propertySignals", {
        clientId: client._id,
        propertyId: args.propertyId,
        kind: args.kind,
        at: now,
      });
    } else if (existing.kind !== args.kind) {
      await ctx.db.patch(existing._id, { kind: args.kind, at: now });
    }
    await appendAuditLog(ctx, {
      actorId: session.user._id,
      action: `propertySignal.${args.kind}`,
      targetType: "property",
      targetId: args.propertyId,
      meta: { clientId: client._id, kind: args.kind },
    });
    return { ok: true as const, kind: args.kind, propertyId: args.propertyId };
  },
});
