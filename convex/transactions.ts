import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import {
  assertRole,
  requireTransactionAccess,
  requireTransactionReadRole,
} from "./lib/authz";
import { nextStageAfter, openBlockingTasks } from "./lib/journeyLogic";
import { STAGE_ADVANCE_ROLES } from "./lib/validators";

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

export const advanceStage = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { user, membership, transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    assertRole(membership, STAGE_ADVANCE_ROLES);

    const [stages, tasks] = await Promise.all([
      ctx.db
        .query("journeyStages")
        .withIndex("by_org", (q) => q.eq("orgId", transaction.orgId))
        .collect(),
      ctx.db
        .query("tasks")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", args.transactionId),
        )
        .collect(),
    ]);

    const blockers = openBlockingTasks(tasks, transaction.stage);
    if (blockers.length > 0) {
      throw new Error("STAGE_BLOCKED");
    }

    const next = nextStageAfter(stages, transaction.stage);
    if (next === null) {
      throw new Error("NO_NEXT_STAGE");
    }

    await ctx.db.patch(args.transactionId, { stage: next.key });

    const nextConfig = stages.find((stage) => stage.key === next.key);
    const existingOnNext = tasks.filter((task) => task.stage === next.key);
    if (nextConfig !== undefined && existingOnNext.length === 0) {
      for (const template of nextConfig.defaultTasks) {
        await ctx.db.insert("tasks", {
          transactionId: args.transactionId,
          stage: next.key,
          title: template.title,
          assigneeRole: template.assigneeRole,
          blockedBy: [],
          status: "open",
          blocksStage: template.blocksStage,
        });
      }
    }

    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "transaction.stage_advanced",
      targetType: "transaction",
      targetId: args.transactionId,
      meta: { from: transaction.stage, to: next.key },
    });

    return { from: transaction.stage, to: next.key };
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
