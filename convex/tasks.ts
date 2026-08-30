import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import {
  assertRole,
  requireTransactionAccess,
  requireTransactionReadRole,
} from "./lib/authz";
import { TASK_WRITE_ROLES, roleValidator } from "./lib/validators";
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

export const create = mutation({
  args: {
    transactionId: v.id("transactions"),
    stage: v.string(),
    title: v.string(),
    assigneeRole: roleValidator,
    dueDate: v.optional(v.number()),
    blockedBy: v.optional(v.array(v.id("tasks"))),
    blocksStage: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    assertRole(membership, TASK_WRITE_ROLES);
    if (args.title.length === 0) {
      throw new Error("INVALID_TASK");
    }

    const blockedBy = args.blockedBy ?? [];
    const status = blockedBy.length > 0 ? "blocked" : "open";
    const taskId = await ctx.db.insert("tasks", {
      transactionId: args.transactionId,
      stage: args.stage,
      title: args.title,
      assigneeRole: args.assigneeRole,
      dueDate: args.dueDate,
      blockedBy,
      status,
      blocksStage: args.blocksStage,
    });

    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "task.created",
      targetType: "task",
      targetId: taskId,
      meta: {
        transactionId: args.transactionId,
        stage: args.stage,
        blocksStage: String(args.blocksStage),
      },
    });

    return taskId;
  },
});

export const complete = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (task === null) {
      throw new Error("FORBIDDEN");
    }
    const { user } = await requireTransactionAccess(ctx, task.transactionId);
    if (task.status === "done" || task.status === "canceled") {
      return task._id;
    }

    await ctx.db.patch(args.taskId, { status: "done" });

    const siblings = await ctx.db
      .query("tasks")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", task.transactionId),
      )
      .collect();
    for (const sibling of siblings) {
      if (
        sibling.status !== "blocked" ||
        !sibling.blockedBy.includes(args.taskId)
      ) {
        continue;
      }
      const remaining = sibling.blockedBy.filter(
        (blockerId) => blockerId !== args.taskId,
      );
      const stillBlocked = remaining.some((blockerId) => {
        const blocker = siblings.find((row) => row._id === blockerId);
        return blocker !== undefined && blocker.status !== "done";
      });
      if (!stillBlocked) {
        await ctx.db.patch(sibling._id, { status: "open" });
      }
    }

    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "task.completed",
      targetType: "task",
      targetId: args.taskId,
      meta: { transactionId: task.transactionId, stage: task.stage },
    });

    return args.taskId;
  },
});
