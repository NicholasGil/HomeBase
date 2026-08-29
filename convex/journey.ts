import { query } from "./_generated/server";
import { assertRole, requireMembership } from "./lib/authz";
import { TRANSACTION_READ_ROLES } from "./lib/validators";

export const listStages = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);
    assertRole(membership, TRANSACTION_READ_ROLES);
    return await ctx.db
      .query("journeyStages")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();
  },
});
