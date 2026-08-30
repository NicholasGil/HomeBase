import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import {
  assertRole,
  requireMembership,
  requireTransactionAccess,
} from "./lib/authz";
import { classifyDocumentType } from "./lib/classifyDocument";
import { findActiveGrant } from "./lib/documentAccess";
import {
  findVendorForUser,
  requireAssignmentReader,
  requireLiveAssignment,
  requireVendorMembership,
} from "./lib/vendorAccess";
import {
  assertCompensationModelWrite,
  categoriesForStage,
  isAssignmentLive,
  toListedVendor,
} from "./lib/vendors";
import {
  vendorCategoryValidator,
  vendorWorkProductValidator,
  VENDOR_WRITE_ROLES,
} from "./lib/validators";

type ReadCtx = QueryCtx | MutationCtx;

const ASSIGNMENT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function toListedDocument(document: Doc<"documents">) {
  return {
    _id: document._id,
    type: document.type,
    status: document.status,
    uploadedBy: document.uploadedBy,
    transactionId: document.transactionId,
  };
}

async function orgFlags(ctx: ReadCtx, orgId: Id<"orgs">) {
  const org = await ctx.db.get(orgId);
  if (org === null) {
    throw new Error("FORBIDDEN");
  }
  return org.flags;
}

async function scopedTransaction(
  ctx: ReadCtx,
  transaction: Doc<"transactions">,
) {
  const property =
    transaction.propertyId === undefined
      ? null
      : await ctx.db.get(transaction.propertyId);
  return {
    transactionId: transaction._id,
    stage: transaction.stage,
    status: transaction.status,
    propertyCity: property?.address.city ?? null,
    propertyState: property?.address.state ?? null,
  };
}

async function listedAssignment(
  ctx: ReadCtx,
  assignment: Doc<"vendorAssignments">,
  vendor: Doc<"vendors">,
  transaction: Doc<"transactions">,
  now: number,
) {
  return {
    assignmentId: assignment._id,
    vendorId: vendor._id,
    vendorName: vendor.name,
    category: vendor.category,
    scope: assignment.scope,
    status: isAssignmentLive(assignment, now) ? assignment.status : "expired",
    expiresAt: assignment.expiresAt,
    compensationModel: "none" as const,
    transaction: await scopedTransaction(ctx, transaction),
  };
}

export const listDirectory = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireMembership(ctx);
    assertRole(membership, ["buyer", "agent", "broker", "admin"]);
    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
      .collect();
    return vendors.map(toListedVendor);
  },
});

export const listForStage = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    const wanted = new Set<string>(categoriesForStage(transaction.stage));
    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_org", (q) => q.eq("orgId", transaction.orgId))
      .collect();
    return {
      stage: transaction.stage,
      categories: categoriesForStage(transaction.stage),
      vendors: vendors
        .filter((vendor) => wanted.has(vendor.category))
        .map(toListedVendor),
    };
  },
});

export const compare = query({
  args: {
    transactionId: v.id("transactions"),
    vendorIds: v.array(v.id("vendors")),
  },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    const vendors = [];
    for (const vendorId of args.vendorIds) {
      const vendor = await ctx.db.get(vendorId);
      if (vendor === null || vendor.orgId !== transaction.orgId) {
        throw new Error("FORBIDDEN");
      }
      vendors.push(toListedVendor(vendor));
    }
    return { vendors };
  },
});

export const listAssignmentsForTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    const now = Date.now();
    const assignments = await ctx.db
      .query("vendorAssignments")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .collect();
    const rows = [];
    for (const assignment of assignments) {
      const vendor = await ctx.db.get(assignment.vendorId);
      if (vendor === null || vendor.orgId !== transaction.orgId) {
        continue;
      }
      rows.push(await listedAssignment(ctx, assignment, vendor, transaction, now));
    }
    return rows;
  },
});

export const getPortal = query({
  args: {},
  handler: async (ctx) => {
    const session = await requireVendorMembership(ctx);
    const vendor = await findVendorForUser(
      ctx,
      session.membership.orgId,
      session.user._id,
    );
    if (vendor === null) {
      return { vendor: null, assignments: [] };
    }
    const now = Date.now();
    const assignments = await ctx.db
      .query("vendorAssignments")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();
    const live = [];
    for (const assignment of assignments) {
      if (!isAssignmentLive(assignment, now)) {
        continue;
      }
      const transaction = await ctx.db.get(assignment.transactionId);
      if (transaction === null || transaction.orgId !== session.membership.orgId) {
        continue;
      }
      live.push(await listedAssignment(ctx, assignment, vendor, transaction, now));
    }
    return {
      vendor: toListedVendor(vendor),
      assignments: live,
    };
  },
});

export const getAssignment = query({
  args: { assignmentId: v.id("vendorAssignments") },
  handler: async (ctx, args) => {
    const access = await requireLiveAssignment(ctx, args.assignmentId);
    return await listedAssignment(
      ctx,
      access.assignment,
      access.vendor,
      access.transaction,
      Date.now(),
    );
  },
});

export const listMessages = query({
  args: { assignmentId: v.id("vendorAssignments") },
  handler: async (ctx, args) => {
    await requireAssignmentReader(ctx, args.assignmentId);
    const messages = await ctx.db
      .query("vendorMessages")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();
    const rows = [];
    for (const message of messages) {
      const author = await ctx.db.get(message.authorId);
      rows.push({
        _id: message._id,
        body: message.body,
        at: message.at,
        authorName: author?.name ?? "Unknown",
      });
    }
    return rows;
  },
});

export const listDocumentRequests = query({
  args: { assignmentId: v.id("vendorAssignments") },
  handler: async (ctx, args) => {
    await requireAssignmentReader(ctx, args.assignmentId);
    return await ctx.db
      .query("vendorDocumentRequests")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();
  },
});

export const listGrantedDocuments = query({
  args: { assignmentId: v.id("vendorAssignments") },
  handler: async (ctx, args) => {
    const access = await requireLiveAssignment(ctx, args.assignmentId);
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", access.transaction._id),
      )
      .collect();
    const now = Date.now();
    const granted = [];
    for (const document of documents) {
      const grant = await findActiveGrant(ctx, document._id, access.user._id, now);
      if (grant !== null) {
        granted.push(toListedDocument(document));
      }
    }
    return granted;
  },
});

export const create = mutation({
  args: {
    category: vendorCategoryValidator,
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    credentials: v.optional(v.string()),
    compensationModel: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireMembership(ctx);
    assertRole(membership, VENDOR_WRITE_ROLES);
    const flags = await orgFlags(ctx, membership.orgId);
    assertCompensationModelWrite(flags, args.compensationModel);
    const vendorId = await ctx.db.insert("vendors", {
      orgId: membership.orgId,
      category: args.category,
      name: args.name,
      contact: {
        email: args.email,
        phone: args.phone,
      },
      notes: args.notes,
      credentials: args.credentials,
      compensationModel: "none",
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "vendor.created",
      targetType: "vendor",
      targetId: vendorId,
      meta: { category: args.category, compensationModel: "none" },
    });
    return vendorId;
  },
});

export const updateCompensation = mutation({
  args: {
    vendorId: v.id("vendors"),
    compensationModel: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireMembership(ctx);
    assertRole(membership, VENDOR_WRITE_ROLES);
    const vendor = await ctx.db.get(args.vendorId);
    if (vendor === null || vendor.orgId !== membership.orgId) {
      throw new Error("FORBIDDEN");
    }
    const flags = await orgFlags(ctx, membership.orgId);
    assertCompensationModelWrite(flags, args.compensationModel);
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "vendor.compensation_unchanged",
      targetType: "vendor",
      targetId: args.vendorId,
      meta: { compensationModel: "none" },
    });
    return { compensationModel: "none" as const };
  },
});

export const requestAppointment = mutation({
  args: {
    transactionId: v.id("transactions"),
    vendorId: v.id("vendors"),
    startsAt: v.number(),
    endsAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { user, transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    const vendor = await ctx.db.get(args.vendorId);
    if (vendor === null || vendor.orgId !== transaction.orgId) {
      throw new Error("FORBIDDEN");
    }
    const assignmentId = await ctx.db.insert("vendorAssignments", {
      vendorId: args.vendorId,
      transactionId: args.transactionId,
      scope: vendor.category,
      expiresAt: Date.now() + ASSIGNMENT_TTL_MS,
      status: "active",
    });
    const appointmentId = await ctx.db.insert("appointments", {
      transactionId: args.transactionId,
      type: vendor.category,
      propertyId: transaction.propertyId,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      participants: vendor.userId
        ? [user._id, vendor.userId]
        : [user._id],
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "vendor.appointment_requested",
      targetType: "vendorAssignment",
      targetId: assignmentId,
      meta: { vendorId: args.vendorId, appointmentId },
    });
    return { assignmentId, appointmentId };
  },
});

export const schedule = mutation({
  args: {
    assignmentId: v.id("vendorAssignments"),
    startsAt: v.number(),
    endsAt: v.number(),
  },
  handler: async (ctx, args) => {
    const access = await requireLiveAssignment(ctx, args.assignmentId);
    const appointmentId = await ctx.db.insert("appointments", {
      transactionId: access.transaction._id,
      type: access.vendor.category,
      propertyId: access.transaction.propertyId,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      participants: [access.user._id, access.transaction.agentId],
    });
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "vendor.scheduled",
      targetType: "appointment",
      targetId: appointmentId,
      meta: { assignmentId: args.assignmentId },
    });
    return { appointmentId };
  },
});

export const sendMessage = mutation({
  args: {
    assignmentId: v.id("vendorAssignments"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const access = await requireAssignmentReader(ctx, args.assignmentId);
    if (access.via === "vendor") {
      await requireLiveAssignment(ctx, args.assignmentId);
    }
    const trimmed = args.body.trim();
    if (trimmed.length === 0) {
      throw new Error("FORBIDDEN");
    }
    const messageId = await ctx.db.insert("vendorMessages", {
      assignmentId: args.assignmentId,
      transactionId: access.transaction._id,
      authorId: access.user._id,
      body: trimmed,
      at: Date.now(),
    });
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "vendor.messaged",
      targetType: "vendorMessage",
      targetId: messageId,
      meta: { assignmentId: args.assignmentId },
    });
    return messageId;
  },
});

export const requestDocument = mutation({
  args: {
    assignmentId: v.id("vendorAssignments"),
    documentType: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await requireLiveAssignment(ctx, args.assignmentId);
    const requestId = await ctx.db.insert("vendorDocumentRequests", {
      assignmentId: args.assignmentId,
      transactionId: access.transaction._id,
      requestedBy: access.user._id,
      documentType: args.documentType,
      note: args.note,
      status: "pending",
      at: Date.now(),
    });
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "vendor.document_requested",
      targetType: "vendorDocumentRequest",
      targetId: requestId,
      meta: { documentType: args.documentType },
    });
    return requestId;
  },
});

export const generateUploadUrl = mutation({
  args: { assignmentId: v.id("vendorAssignments") },
  handler: async (ctx, args) => {
    await requireLiveAssignment(ctx, args.assignmentId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const uploadWorkProduct = mutation({
  args: {
    assignmentId: v.id("vendorAssignments"),
    kind: vendorWorkProductValidator,
    fileName: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const access = await requireLiveAssignment(ctx, args.assignmentId);
    const type = classifyDocumentType({
      type: args.kind === "invoice" ? "invoice" : "inspection_report",
      fileName: args.fileName,
    });
    const documentId = await ctx.db.insert("documents", {
      transactionId: access.transaction._id,
      type,
      storageId: args.storageId,
      status: "classified",
      uploadedBy: access.user._id,
    });
    const grantId = await ctx.db.insert("documentGrants", {
      documentId,
      granteeId: access.user._id,
      scope: "view",
      expiresAt: access.assignment.expiresAt,
      grantedBy: access.user._id,
    });
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "vendor.work_product_uploaded",
      targetType: "document",
      targetId: documentId,
      meta: { kind: args.kind, type, grantId },
    });
    return { documentId, type };
  },
});

export const markComplete = mutation({
  args: { assignmentId: v.id("vendorAssignments") },
  handler: async (ctx, args) => {
    const access = await requireLiveAssignment(ctx, args.assignmentId);
    await ctx.db.patch(args.assignmentId, { status: "complete" });
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "vendor.assignment_completed",
      targetType: "vendorAssignment",
      targetId: args.assignmentId,
      meta: {},
    });
    return { ok: true as const };
  },
});
