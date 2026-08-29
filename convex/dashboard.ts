import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import {
  assertRole,
  requireMembership,
  requireTransactionAccess,
} from "./lib/authz";
import {
  summarizeBuyerDashboard,
  type BuyerDashboardView,
} from "./lib/dashboardView";

export const getBuyerDashboard = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireMembership(ctx);
    assertRole(membership, ["buyer"]);

    const client = await ctx.db
      .query("clients")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", user._id).eq("orgId", membership.orgId),
      )
      .unique();
    if (client === null) {
      return null;
    }

    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .first();
    if (transaction === null) {
      return null;
    }

    return await loadDashboard(ctx, transaction);
  },
});

export const getById = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    return await loadDashboard(ctx, transaction);
  },
});

async function loadDashboard(
  ctx: QueryCtx,
  transaction: Doc<"transactions">,
): Promise<BuyerDashboardView> {
  const [stages, tasks, property] = await Promise.all([
    ctx.db
      .query("journeyStages")
      .withIndex("by_org_key", (q) =>
        q.eq("orgId", transaction.orgId).eq("key", transaction.stage),
      )
      .unique(),
    ctx.db
      .query("tasks")
      .withIndex("by_transaction", (q) => q.eq("transactionId", transaction._id))
      .collect(),
    transaction.propertyId
      ? ctx.db.get(transaction.propertyId)
      : Promise.resolve(null),
  ]);

  return summarizeBuyerDashboard({
    transactionId: transaction._id as Id<"transactions">,
    stage: transaction.stage,
    stageLabel: stages?.label ?? transaction.stage,
    status: transaction.status,
    owedToday: transaction.owedToday ?? null,
    propertyAddress: property?.address ?? null,
    tasks,
  });
}
