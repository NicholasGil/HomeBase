import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

import { requireMembership } from "./authz";

type DbCtx = QueryCtx | MutationCtx;

export function isGrantActive(
  grant: Pick<Doc<"documentGrants">, "expiresAt" | "revokedAt">,
  now: number,
) {
  return grant.revokedAt === undefined && grant.expiresAt > now;
}

export async function isTransactionDocumentPrincipal(
  ctx: DbCtx,
  transaction: Doc<"transactions">,
  userId: Id<"users">,
  role: Doc<"memberships">["role"],
) {
  if (role === "broker" || role === "admin") {
    return true;
  }
  if (role === "agent") {
    return transaction.agentId === userId;
  }
  if (role === "buyer") {
    const client = await ctx.db.get(transaction.clientId);
    return client !== null && client.userId === userId;
  }
  return false;
}

export async function findActiveGrant(
  ctx: DbCtx,
  documentId: Id<"documents">,
  granteeId: Id<"users">,
  now: number = Date.now(),
) {
  const grants = await ctx.db
    .query("documentGrants")
    .withIndex("by_document", (q) => q.eq("documentId", documentId))
    .collect();
  return (
    grants.find(
      (grant) => grant.granteeId === granteeId && isGrantActive(grant, now),
    ) ?? null
  );
}

export async function requireDocumentAccess(
  ctx: DbCtx,
  documentId: Id<"documents">,
) {
  const session = await requireMembership(ctx);
  const document = await ctx.db.get(documentId);
  if (document === null) {
    throw new Error("FORBIDDEN");
  }
  const transaction = await ctx.db.get(document.transactionId);
  if (transaction === null || transaction.orgId !== session.membership.orgId) {
    throw new Error("FORBIDDEN");
  }

  const principal = await isTransactionDocumentPrincipal(
    ctx,
    transaction,
    session.user._id,
    session.membership.role,
  );
  if (principal) {
    return { ...session, document, transaction, via: "principal" as const };
  }

  const grant = await findActiveGrant(ctx, documentId, session.user._id);
  if (grant === null) {
    throw new Error("FORBIDDEN");
  }
  return { ...session, document, transaction, via: "grant" as const, grant };
}

export async function listAccessibleDocuments(
  ctx: DbCtx,
  transactionId: Id<"transactions">,
) {
  const session = await requireMembership(ctx);
  const transaction = await ctx.db.get(transactionId);
  if (transaction === null || transaction.orgId !== session.membership.orgId) {
    throw new Error("FORBIDDEN");
  }

  const all = await ctx.db
    .query("documents")
    .withIndex("by_transaction", (q) => q.eq("transactionId", transactionId))
    .collect();

  const principal = await isTransactionDocumentPrincipal(
    ctx,
    transaction,
    session.user._id,
    session.membership.role,
  );
  if (principal) {
    return { ...session, transaction, documents: all };
  }

  const accessible = [];
  for (const document of all) {
    const grant = await findActiveGrant(ctx, document._id, session.user._id);
    if (grant !== null) {
      accessible.push(document);
    }
  }
  return { ...session, transaction, documents: accessible };
}
