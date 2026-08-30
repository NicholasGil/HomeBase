import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import { requireTransactionAccess } from "./lib/authz";
import { gatherConciergeFacts } from "./lib/conciergeFacts";

export const gatherContext = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    return await gatherConciergeFacts(ctx, transaction);
  },
});

export const listThread = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireTransactionAccess(ctx, args.transactionId);
    const thread = await ctx.db
      .query("conciergeThreads")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .unique();
    return thread?.messages ?? [];
  },
});

export const appendTurn = mutation({
  args: {
    transactionId: v.id("transactions"),
    question: v.string(),
    answer: v.string(),
    kind: v.union(
      v.literal("answer"),
      v.literal("refuse"),
      v.literal("ask_agent"),
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireTransactionAccess(ctx, args.transactionId);
    const now = Date.now();
    const existing = await ctx.db
      .query("conciergeThreads")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .unique();
    const messages = [
      ...(existing?.messages ?? []),
      { role: "user" as const, content: args.question, at: now },
      { role: "assistant" as const, content: args.answer, at: now },
    ];
    if (existing === null) {
      await ctx.db.insert("conciergeThreads", {
        transactionId: args.transactionId,
        messages,
      });
    } else {
      await ctx.db.patch(existing._id, { messages });
    }
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "concierge.asked",
      targetType: "transaction",
      targetId: args.transactionId,
      meta: { kind: args.kind },
    });
    return { ok: true };
  },
});
