import { mutation } from "./_generated/server";
import { requireIdentity } from "./lib/authz";
import { findOrCreatePathBPreviewOrg } from "./lib/pathBOrg";

const NON_BUYER_MEMBERSHIP_ROLES = new Set([
  "agent",
  "broker",
  "admin",
  "vendor",
]);

function displayNameFromIdentity(identity: {
  name?: string | null;
  nickname?: string | null;
  givenName?: string | null;
  familyName?: string | null;
}) {
  if (identity.name !== undefined && identity.name !== null && identity.name.length > 0) {
    return identity.name;
  }
  const parts = [identity.givenName, identity.familyName].filter(
    (part) => part !== undefined && part !== null && part.length > 0,
  );
  if (parts.length > 0) {
    return parts.join(" ");
  }
  if (
    identity.nickname !== undefined &&
    identity.nickname !== null &&
    identity.nickname.length > 0
  ) {
    return identity.nickname;
  }
  return "RealtyRise buyer";
}

function emailFromIdentity(identity: {
  subject: string;
  email?: string | null;
}) {
  if (identity.email !== undefined && identity.email !== null && identity.email.length > 0) {
    return identity.email;
  }
  return `${identity.subject}@users.clerk.local`;
}

export const ensureBuyer = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const clerkId = identity.subject;

    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    const existingUserId = user?._id;
    const memberships =
      existingUserId === undefined
        ? []
        : await ctx.db
            .query("memberships")
            .withIndex("by_user", (q) => q.eq("userId", existingUserId))
            .collect();

    for (const membership of memberships) {
      if (NON_BUYER_MEMBERSHIP_ROLES.has(membership.role)) {
        throw new Error("FORBIDDEN");
      }
    }

    const existingBuyerMembership = memberships.find(
      (membership) => membership.role === "buyer",
    );
    if (existingBuyerMembership !== undefined && user !== null) {
      return {
        userId: user._id,
        orgId: existingBuyerMembership.orgId,
        created: false,
      };
    }

    const email = emailFromIdentity(identity);
    const name = displayNameFromIdentity(identity);

    if (user === null) {
      const userId = await ctx.db.insert("users", {
        clerkId,
        email,
        name,
      });
      user = await ctx.db.get(userId);
      if (user === null) {
        throw new Error("FORBIDDEN");
      }
    } else {
      await ctx.db.patch(user._id, { email, name });
    }

    const orgId = await findOrCreatePathBPreviewOrg(ctx);
    await ctx.db.insert("memberships", {
      userId: user._id,
      orgId,
      role: "buyer",
    });

    return { userId: user._id, orgId, created: true };
  },
});
