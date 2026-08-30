import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { TRANSACTION_READ_ROLES } from "./validators";

type DbCtx = QueryCtx | MutationCtx;

export async function requireIdentity(ctx: DbCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("UNAUTHENTICATED");
  }
  return identity;
}

export async function requireUser(ctx: DbCtx) {
  const identity = await requireIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (user === null) {
    throw new Error("FORBIDDEN");
  }
  return { identity, user };
}

export async function requireMembership(ctx: DbCtx) {
  const { identity, user } = await requireUser(ctx);
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .first();
  if (membership === null) {
    throw new Error("FORBIDDEN");
  }
  return { identity, user, membership };
}

export function assertRole(
  membership: Doc<"memberships">,
  allowed: readonly Doc<"memberships">["role"][],
) {
  if (!allowed.includes(membership.role)) {
    throw new Error("FORBIDDEN");
  }
}

export async function requireTransactionReadRole(ctx: DbCtx) {
  const session = await requireMembership(ctx);
  assertRole(session.membership, TRANSACTION_READ_ROLES);
  return session;
}

export async function requireTransactionAccess(
  ctx: DbCtx,
  transactionId: Id<"transactions">,
) {
  const session = await requireTransactionReadRole(ctx);
  const transaction = await ctx.db.get(transactionId);
  if (transaction === null || transaction.orgId !== session.membership.orgId) {
    throw new Error("FORBIDDEN");
  }

  if (
    session.membership.role === "broker" ||
    session.membership.role === "admin"
  ) {
    return { ...session, transaction };
  }

  if (session.membership.role === "agent") {
    if (transaction.agentId !== session.user._id) {
      throw new Error("FORBIDDEN");
    }
    return { ...session, transaction };
  }

  const client = await ctx.db.get(transaction.clientId);
  if (client === null || client.userId !== session.user._id) {
    throw new Error("FORBIDDEN");
  }
  return { ...session, transaction };
}

export async function requireTourAccess(ctx: DbCtx, tourId: Id<"tours">) {
  const session = await requireTransactionReadRole(ctx);
  const tour = await ctx.db.get(tourId);
  if (tour === null) {
    throw new Error("FORBIDDEN");
  }
  const client = await ctx.db.get(tour.clientId);
  if (client === null || client.orgId !== session.membership.orgId) {
    throw new Error("FORBIDDEN");
  }
  if (session.membership.role === "broker" || session.membership.role === "admin") {
    return { ...session, tour, client };
  }
  if (session.membership.role === "agent") {
    if (tour.agentId !== session.user._id) {
      throw new Error("FORBIDDEN");
    }
    return { ...session, tour, client };
  }
  if (client.userId !== session.user._id) {
    throw new Error("FORBIDDEN");
  }
  return { ...session, tour, client };
}
