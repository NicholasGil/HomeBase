import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireTransactionAccess, requireTransactionReadRole } from "./lib/authz";
import { listAccessibleTransactions } from "./transactions";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireTransactionReadRole(ctx);
    const transactions = await listAccessibleTransactions(
      ctx,
      user._id,
      membership,
    );
    const tasks = [];
    for (const transaction of transactions) {
      const rows = await ctx.db
        .query("tasks")
        .withIndex("by_transaction", (q) => q.eq("transactionId", transaction._id))
        .collect();
      tasks.push(...rows);
    }
    return tasks;
  },
});

export const listForTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireTransactionAccess(ctx, args.transactionId);
    return await ctx.db
      .query("tasks")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();
  },
});
