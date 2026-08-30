import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

import { requireMembership } from "./authz";
import { isAssignmentLive } from "./vendors";

type DbCtx = QueryCtx | MutationCtx;

export async function findVendorForUser(
  ctx: DbCtx,
  orgId: Id<"orgs">,
  userId: Id<"users">,
) {
  const vendor = await ctx.db
    .query("vendors")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (vendor === null || vendor.orgId !== orgId) {
    return null;
  }
  return vendor;
}

export async function requireVendorMembership(ctx: DbCtx) {
  const session = await requireMembership(ctx);
  if (session.membership.role !== "vendor") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireLiveAssignment(
  ctx: DbCtx,
  assignmentId: Id<"vendorAssignments">,
  now: number = Date.now(),
) {
  const session = await requireVendorMembership(ctx);
  const assignment = await ctx.db.get(assignmentId);
  if (assignment === null) {
    throw new Error("FORBIDDEN");
  }
  const vendor = await findVendorForUser(
    ctx,
    session.membership.orgId,
    session.user._id,
  );
  if (vendor === null || assignment.vendorId !== vendor._id) {
    throw new Error("FORBIDDEN");
  }
  if (!isAssignmentLive(assignment, now)) {
    throw new Error("FORBIDDEN");
  }
  const transaction = await ctx.db.get(assignment.transactionId);
  if (transaction === null || transaction.orgId !== session.membership.orgId) {
    throw new Error("FORBIDDEN");
  }
  return { ...session, assignment, vendor, transaction };
}

export async function requireAssignmentReader(
  ctx: DbCtx,
  assignmentId: Id<"vendorAssignments">,
  now: number = Date.now(),
): Promise<{
  user: Doc<"users">;
  membership: Doc<"memberships">;
  assignment: Doc<"vendorAssignments">;
  transaction: Doc<"transactions">;
  via: "vendor" | "principal";
}> {
  const session = await requireMembership(ctx);
  const assignment = await ctx.db.get(assignmentId);
  if (assignment === null) {
    throw new Error("FORBIDDEN");
  }
  const transaction = await ctx.db.get(assignment.transactionId);
  if (transaction === null || transaction.orgId !== session.membership.orgId) {
    throw new Error("FORBIDDEN");
  }

  if (session.membership.role === "vendor") {
    const live = await requireLiveAssignment(ctx, assignmentId, now);
    return {
      user: live.user,
      membership: live.membership,
      assignment: live.assignment,
      transaction: live.transaction,
      via: "vendor",
    };
  }

  if (
    session.membership.role === "broker" ||
    session.membership.role === "admin"
  ) {
    return { ...session, assignment, transaction, via: "principal" };
  }

  if (session.membership.role === "agent") {
    if (transaction.agentId !== session.user._id) {
      throw new Error("FORBIDDEN");
    }
    return { ...session, assignment, transaction, via: "principal" };
  }

  if (session.membership.role === "buyer") {
    const client = await ctx.db.get(transaction.clientId);
    if (client === null || client.userId !== session.user._id) {
      throw new Error("FORBIDDEN");
    }
    return { ...session, assignment, transaction, via: "principal" };
  }

  throw new Error("FORBIDDEN");
}
