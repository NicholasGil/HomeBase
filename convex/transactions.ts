import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { requireTransactionAccess, requireTransactionReadRole } from "./lib/authz";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireTransactionReadRole(ctx);
    const rows = await listAccessibleTransactions(ctx, user._id, membership);
    return await Promise.all(rows.map((row) => toSummary(ctx, row)));
  },
});

export const get = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    return await toSummary(ctx, transaction);
  },
});

export async function listAccessibleTransactions(
  ctx: QueryCtx,
  userId: Id<"users">,
  membership: Doc<"memberships">,
) {
  if (membership.role === "buyer") {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", userId).eq("orgId", membership.orgId),
      )
      .unique();
    if (client === null) {
      return [];
    }
    return await ctx.db
      .query("transactions")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect();
  }

  if (membership.role === "agent") {
    return await ctx.db
      .query("transactions")
      .withIndex("by_agent", (q) => q.eq("agentId", userId))
      .collect();
  }

  return await ctx.db
    .query("transactions")
    .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
    .collect();
}

async function toSummary(ctx: QueryCtx, transaction: Doc<"transactions">) {
  const client = await ctx.db.get(transaction.clientId);
  const buyer = client === null ? null : await ctx.db.get(client.userId);
  const property =
    transaction.propertyId === undefined
      ? null
      : await ctx.db.get(transaction.propertyId);

  return {
    _id: transaction._id,
    stage: transaction.stage,
    status: transaction.status,
    keyDates: transaction.keyDates,
    owedToday: transaction.owedToday ?? null,
    clientName: buyer?.name ?? null,
    propertyAddress: property?.address ?? null,
  };
}
