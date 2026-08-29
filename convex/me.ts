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
