import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireIdentity } from "./lib/authz";
import { allocateUniqueInviteCode } from "./lib/inviteCode";
import { bootstrapOrgJourneyStages } from "./lib/orgBootstrap";
import { PATH_B_PREVIEW_ORG_NAME } from "./lib/pathBOrg";
import { DEFAULT_FEATURE_FLAGS } from "./lib/validators";

const staffRoleValidator = v.union(v.literal("agent"), v.literal("broker"));

const STAFF_INVITE_VIEW_ROLES = new Set(["agent", "broker", "admin"]);

type DbCtx = QueryCtx | MutationCtx;

function displayNameFromIdentity(identity: {
  name?: string | null;
  nickname?: string | null;
  givenName?: string | null;
  familyName?: string | null;
}) {
  if (
    identity.name !== undefined &&
    identity.name !== null &&
    identity.name.length > 0
  ) {
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
  return "RealtyRise member";
}

function emailFromIdentity(identity: {
  subject: string;
  email?: string | null;
}) {
  if (
    identity.email !== undefined &&
    identity.email !== null &&
    identity.email.length > 0
  ) {
    return identity.email;
  }
  return `${identity.subject}@users.clerk.local`;
}

async function membershipsForUser(ctx: DbCtx, userId: Id<"users">) {
  return await ctx.db
    .query("memberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
}

async function assertCanOnboard(ctx: DbCtx, userId: Id<"users">) {
  const memberships = await membershipsForUser(ctx, userId);
  if (memberships.length === 0) {
    return;
  }
  if (memberships.length === 1) {
    const lone = memberships[0];
    if (lone === undefined) {
      return;
    }
    const org = await ctx.db.get(lone.orgId);
    if (lone.role === "buyer" && org?.name === PATH_B_PREVIEW_ORG_NAME) {
      return;
    }
  }
  throw new Error("ALREADY_MEMBER");
}

async function ensureUserRow(ctx: MutationCtx) {
  const identity = await requireIdentity(ctx);
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  const email = emailFromIdentity(identity);
  const name = displayNameFromIdentity(identity);
  if (user === null) {
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email,
      name,
    });
    user = await ctx.db.get(userId);
  } else {
    await ctx.db.patch(user._id, { email, name });
  }
  if (user === null) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

async function clearPathBMembershipIfPresent(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const memberships = await membershipsForUser(ctx, userId);
  for (const membership of memberships) {
    const org = await ctx.db.get(membership.orgId);
    if (org?.name === PATH_B_PREVIEW_ORG_NAME && membership.role === "buyer") {
      await ctx.db.delete(membership._id);
    }
  }
}

async function ensureBuyerClientRow(
  ctx: MutationCtx,
  userId: Id<"users">,
  orgId: Id<"orgs">,
) {
  const existingClient = await ctx.db
    .query("clients")
    .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
    .unique();
  if (existingClient !== null) {
    return;
  }
  await ctx.db.insert("clients", {
    userId,
    orgId,
    preferences: {},
    prequalStatus: "none",
    budget: {
      amountCents: 0,
      currency: "USD",
      provenance: "user_entered",
      asOf: Date.now(),
      label: "Not set",
    },
  });
}

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user === null) {
      return {
        status: "needs_onboarding" as const,
        name: displayNameFromIdentity(identity),
        email: emailFromIdentity(identity),
      };
    }

    const memberships = await membershipsForUser(ctx, user._id);

    if (memberships.length === 0) {
      return {
        status: "needs_onboarding" as const,
        name: user.name,
        email: user.email,
      };
    }

    const membership = memberships[0];
    if (membership === undefined) {
      return {
        status: "needs_onboarding" as const,
        name: user.name,
        email: user.email,
      };
    }
    const org = await ctx.db.get(membership.orgId);
    if (org === null) {
      throw new Error("FORBIDDEN");
    }

    return {
      status: "ready" as const,
      userId: user._id,
      name: user.name,
      email: user.email,
      role: membership.role,
      orgId: membership.orgId,
      orgName: org.name,
      orgState: org.state,
      inviteCode: STAFF_INVITE_VIEW_ROLES.has(membership.role)
        ? org.inviteCode ?? null
        : null,
    };
  },
});

export const createBrokerage = mutation({
  args: {
    name: v.string(),
    state: v.string(),
    role: staffRoleValidator,
  },
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim();
    const trimmedState = args.state.trim().toUpperCase();
    if (trimmedName.length < 2) {
      throw new Error("INVALID_NAME");
    }
    if (trimmedState.length !== 2) {
      throw new Error("INVALID_STATE");
    }

    const user = await ensureUserRow(ctx);
    await assertCanOnboard(ctx, user._id);
    await clearPathBMembershipIfPresent(ctx, user._id);

    const inviteCode = await allocateUniqueInviteCode(ctx);
    const orgId = await ctx.db.insert("orgs", {
      name: trimmedName,
      state: trimmedState,
      inviteCode,
      settings: {},
      flags: { ...DEFAULT_FEATURE_FLAGS },
    });
    await bootstrapOrgJourneyStages(ctx, orgId);
    await ctx.db.insert("memberships", {
      userId: user._id,
      orgId,
      role: args.role,
    });

    return {
      orgId,
      orgName: trimmedName,
      orgState: trimmedState,
      role: args.role,
      inviteCode,
    };
  },
});

export const joinWithInviteCode = mutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.inviteCode.trim().toUpperCase();
    if (normalizedCode.length < 4) {
      throw new Error("INVALID_INVITE");
    }

    const org = await ctx.db
      .query("orgs")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", normalizedCode))
      .unique();
    if (org === null) {
      throw new Error("INVITE_NOT_FOUND");
    }

    const user = await ensureUserRow(ctx);
    await assertCanOnboard(ctx, user._id);
    await clearPathBMembershipIfPresent(ctx, user._id);

    const role = "agent" as const;
    await ctx.db.insert("memberships", {
      userId: user._id,
      orgId: org._id,
      role,
    });

    return {
      orgId: org._id,
      orgName: org.name,
      orgState: org.state,
      role,
      inviteCode: org.inviteCode ?? normalizedCode,
    };
  },
});

export const joinAsBuyer = mutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.inviteCode.trim().toUpperCase();
    if (normalizedCode.length < 4) {
      throw new Error("INVALID_INVITE");
    }

    const org = await ctx.db
      .query("orgs")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", normalizedCode))
      .unique();
    if (org === null) {
      throw new Error("INVITE_NOT_FOUND");
    }

    const user = await ensureUserRow(ctx);
    await assertCanOnboard(ctx, user._id);
    await clearPathBMembershipIfPresent(ctx, user._id);

    await ctx.db.insert("memberships", {
      userId: user._id,
      orgId: org._id,
      role: "buyer",
    });
    await ensureBuyerClientRow(ctx, user._id, org._id);

    return {
      orgId: org._id,
      orgName: org.name,
      orgState: org.state,
      role: "buyer" as const,
      inviteCode: org.inviteCode ?? normalizedCode,
    };
  },
});
