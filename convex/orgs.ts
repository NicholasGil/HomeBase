import { query } from "./_generated/server";
import { requireMembership } from "./lib/authz";

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);
    const org = await ctx.db.get(membership.orgId);
    if (org === null) {
      throw new Error("FORBIDDEN");
    }
    return {
      _id: org._id,
      name: org.name,
      state: org.state,
    };
  },
});

export const getFlags = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);
    const org = await ctx.db.get(membership.orgId);
    if (org === null) {
      throw new Error("FORBIDDEN");
    }
    return org.flags;
  },
});
