import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import { requireMembership, requireTransactionAccess } from "./lib/authz";
import { classifyDocumentType } from "./lib/classifyDocument";
import { isGrantActive, requireDocumentAccess } from "./lib/documentAccess";
import {
  documentGrantScopeValidator,
  GRANTABLE_DIRECTORY_ROLES,
} from "./lib/validators";
import { listAccessibleTransactions } from "./transactions";

function toListed(document: Doc<"documents">) {
  return {
    _id: document._id,
    type: document.type,
    status: document.status,
    uploadedBy: document.uploadedBy,
    transactionId: document.transactionId,
  };
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireMembership(ctx);
    if (membership.role === "vendor") {
      const grants = await ctx.db
        .query("documentGrants")
        .withIndex("by_grantee", (q) => q.eq("granteeId", user._id))
        .collect();
      const now = Date.now();
      const documents = [];
      for (const grant of grants) {
        if (!isGrantActive(grant, now)) {
          continue;
        }
        const document = await ctx.db.get(grant.documentId);
        if (document === null) {
          continue;
        }
        const transaction = await ctx.db.get(document.transactionId);
        if (
          transaction === null ||
          transaction.orgId !== membership.orgId
        ) {
          continue;
        }
        documents.push(toListed(document));
      }
      return documents;
    }

    const transactions = await listAccessibleTransactions(
      ctx,
      user._id,
      membership,
    );
    const documents = [];
    for (const transaction of transactions) {
      const rows = await ctx.db
        .query("documents")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", transaction._id),
        )
        .collect();
      documents.push(...rows.map(toListed));
    }
    return documents;
  },
});

export const listForTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireTransactionAccess(ctx, args.transactionId);
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .collect();
    return documents.map(toListed);
  },
});

export const missingForStage = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .collect();
    const stage = await ctx.db
      .query("journeyStages")
      .withIndex("by_org_key", (q) =>
        q.eq("orgId", transaction.orgId).eq("key", transaction.stage),
      )
      .unique();
    const required = stage?.requiredDocuments ?? [];
    const present = new Set(documents.map((document) => document.type));
    return required.filter((type) => !present.has(type));
  },
});

export const generateUploadUrl = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { membership } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    if (membership.role === "vendor") {
      throw new Error("FORBIDDEN");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    transactionId: v.id("transactions"),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    type: v.optional(v.string()),
    extractedSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    if (membership.role === "vendor") {
      throw new Error("FORBIDDEN");
    }
    const type = classifyDocumentType({
      type: args.type,
      fileName: args.fileName,
    });
    const documentId = await ctx.db.insert("documents", {
      transactionId: args.transactionId,
      type,
      storageId: args.storageId,
      extractedSummary: args.extractedSummary,
      status: args.extractedSummary === undefined ? "classified" : "summarized",
      uploadedBy: user._id,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "document.uploaded",
      targetType: "document",
      targetId: documentId,
      meta: { transactionId: args.transactionId, type },
    });
    return { documentId, type };
  },
});

export const open = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const access = await requireDocumentAccess(ctx, args.documentId);
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "document.viewed",
      targetType: "document",
      targetId: args.documentId,
      meta: {
        via: access.via,
        type: access.document.type,
        transactionId: access.document.transactionId,
      },
    });
    return {
      _id: access.document._id,
      type: access.document.type,
      status: access.document.status,
      extractedSummary: access.document.extractedSummary ?? null,
      transactionId: access.document.transactionId,
      via: access.via,
    };
  },
});

export const grant = mutation({
  args: {
    documentId: v.id("documents"),
    granteeId: v.id("users"),
    scope: documentGrantScopeValidator,
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const access = await requireDocumentAccess(ctx, args.documentId);
    if (access.via !== "principal") {
      throw new Error("FORBIDDEN");
    }
    const grantee = await ctx.db.get(args.granteeId);
    if (grantee === null) {
      throw new Error("FORBIDDEN");
    }
    const granteeMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.granteeId).eq("orgId", access.transaction.orgId),
      )
      .unique();
    if (
      granteeMembership === null ||
      !(GRANTABLE_DIRECTORY_ROLES as readonly string[]).includes(
        granteeMembership.role,
      )
    ) {
      throw new Error("FORBIDDEN");
    }
    const grantId = await ctx.db.insert("documentGrants", {
      documentId: args.documentId,
      granteeId: args.granteeId,
      scope: args.scope,
      expiresAt: args.expiresAt,
      grantedBy: access.user._id,
    });
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "document.granted",
      targetType: "documentGrant",
      targetId: grantId,
      meta: {
        documentId: args.documentId,
        granteeId: args.granteeId,
        scope: args.scope,
      },
    });
    return grantId;
  },
});

export const revoke = mutation({
  args: { grantId: v.id("documentGrants") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.grantId);
    if (existing === null) {
      throw new Error("FORBIDDEN");
    }
    const access = await requireDocumentAccess(ctx, existing.documentId);
    if (access.via !== "principal") {
      throw new Error("FORBIDDEN");
    }
    await ctx.db.patch(args.grantId, { revokedAt: Date.now() });
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "document.revoked",
      targetType: "documentGrant",
      targetId: args.grantId,
      meta: { documentId: existing.documentId },
    });
    return { ok: true };
  },
});

export const listGrants = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const access = await requireDocumentAccess(ctx, args.documentId);
    if (access.via !== "principal") {
      throw new Error("FORBIDDEN");
    }
    return await ctx.db
      .query("documentGrants")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
  },
});
