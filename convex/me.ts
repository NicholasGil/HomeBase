import { query } from "./_generated/server";
import { requireMembership } from "./lib/authz";

export const getSession = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireMembership(ctx);
    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: membership.role,
      orgId: membership.orgId,
    };
  },
});

export const listOrgDirectory = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);
    if (membership.role === "vendor") {
      throw new Error("FORBIDDEN");
    }
    const rows = await ctx.db
      .query("memberships")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();
    const directory = [];
    for (const row of rows) {
      const user = await ctx.db.get(row.userId);
      if (user !== null) {
        directory.push({
          userId: user._id,
          name: user.name,
          role: row.role,
          clerkId: user.clerkId,
        });
      }
    }
    return directory;
  },
});

