import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import { assertRole, requireMembership } from "./lib/authz";
import { assertReplaceableStages, sortStages } from "./lib/journeyLogic";
import {
  JOURNEY_WRITE_ROLES,
  TRANSACTION_READ_ROLES,
  defaultTaskValidator,
} from "./lib/validators";

export const listStages = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);
    assertRole(membership, TRANSACTION_READ_ROLES);
    const stages = await ctx.db
      .query("journeyStages")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();
    return sortStages(stages);
  },
});

export const replaceStages = mutation({
  args: {
    stages: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        order: v.number(),
        defaultTasks: v.array(defaultTaskValidator),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireMembership(ctx);
    assertRole(membership, JOURNEY_WRITE_ROLES);
    assertReplaceableStages(args.stages);

    const existing = await ctx.db
      .query("journeyStages")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();
    for (const stage of existing) {
      await ctx.db.delete(stage._id);
    }

    const ids = [];
    for (const stage of sortStages(args.stages)) {
      const id = await ctx.db.insert("journeyStages", {
        orgId: membership.orgId,
        key: stage.key,
        label: stage.label,
        order: stage.order,
        defaultTasks: stage.defaultTasks,
      });
      ids.push(id);
    }

    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "journey.stages_replaced",
      targetType: "org",
      targetId: membership.orgId,
      meta: { count: String(ids.length) },
    });

    return { count: ids.length };
  },
});
