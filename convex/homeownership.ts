import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import { requireTransactionAccess } from "./lib/authz";
import { listAccessibleDocuments } from "./lib/documentAccess";
import {
  assertClosedHub,
  hubValueSlots,
  toListedHubDocument,
  type HomeownershipHubView,
} from "./lib/homeownership";
import type { MoneyFigure } from "./lib/offerModel";
import { postCloseVendorCategories, toListedVendor } from "./lib/vendors";

const ASSIGNMENT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

type ReadCtx = QueryCtx | MutationCtx;

async function requireClosedTransactionAccess(
  ctx: ReadCtx,
  transactionId: Id<"transactions">,
) {
  const session = await requireTransactionAccess(ctx, transactionId);
  assertClosedHub(session.transaction.status);
  return session;
}

function asMoneyFigure(
  figure: Doc<"propertyValueSnapshots">["figure"],
): MoneyFigure {
  return {
    amountCents: figure.amountCents,
    currency: figure.currency,
    provenance: figure.provenance,
    asOf: figure.asOf,
    ...(figure.label === undefined ? {} : { label: figure.label }),
  };
}

export const getHub = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args): Promise<HomeownershipHubView> => {
    const { transaction } = await requireClosedTransactionAccess(
      ctx,
      args.transactionId,
    );
    const [
      property,
      maintenanceRows,
      warrantyRows,
      valueRows,
      assignments,
      accessible,
    ] = await Promise.all([
      transaction.propertyId === undefined
        ? Promise.resolve(null)
        : ctx.db.get(transaction.propertyId),
      ctx.db
        .query("maintenanceItems")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", args.transactionId),
        )
        .collect(),
      ctx.db
        .query("warranties")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", args.transactionId),
        )
        .collect(),
      ctx.db
        .query("propertyValueSnapshots")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", args.transactionId),
        )
        .collect(),
      ctx.db
        .query("vendorAssignments")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", args.transactionId),
        )
        .collect(),
      listAccessibleDocuments(ctx, args.transactionId),
    ]);

    const issued =
      valueRows.find((row) => row.figure.provenance === "title_issued") ??
      valueRows.find((row) => row.figure.provenance === "lender_issued") ??
      null;
    const estimated =
      valueRows.find((row) => row.figure.provenance === "ai_estimate") ??
      valueRows.find((row) => row.figure.provenance === "user_entered") ??
      null;
    const taxAssessed = null;

    const wanted = new Set<string>(postCloseVendorCategories());
    const directory = await ctx.db
      .query("vendors")
      .withIndex("by_org", (q) => q.eq("orgId", transaction.orgId))
      .collect();

    const assignedByVendor = new Map<string, Doc<"vendorAssignments">>();
    for (const assignment of assignments) {
      const current = assignedByVendor.get(assignment.vendorId);
      if (current === undefined || assignment.status === "active") {
        assignedByVendor.set(assignment.vendorId, assignment);
      }
    }

    const vendors = [];
    for (const vendor of directory) {
      if (!wanted.has(vendor.category) && !assignedByVendor.has(vendor._id)) {
        continue;
      }
      const assignment = assignedByVendor.get(vendor._id) ?? null;
      const listed = toListedVendor(vendor);
      vendors.push({
        vendorId: listed._id,
        assignmentId: assignment?._id ?? null,
        name: listed.name,
        category: listed.category,
        compensationModel: "none" as const,
        assignmentStatus: assignment?.status ?? null,
        reengaged: assignment?.status === "active",
      });
    }

    return {
      transactionId: transaction._id,
      status: "closed",
      stage: transaction.stage,
      propertyAddress: property?.address ?? null,
      maintenance: maintenanceRows
        .slice()
        .sort((a, b) => a.nextDueAt - b.nextDueAt)
        .map((row) => ({
          id: row._id,
          title: row.title,
          category: row.category,
          cadenceDays: row.cadenceDays ?? null,
          nextDueAt: row.nextDueAt,
          status: row.status,
          notes: row.notes ?? null,
        })),
      warranties: warrantyRows.map((row) => ({
        id: row._id,
        title: row.title,
        provider: row.provider,
        coverage: row.coverage ?? null,
        expiresAt: row.expiresAt ?? null,
        documentId: row.documentId ?? null,
      })),
      documents: accessible.documents.map((document) =>
        toListedHubDocument(document),
      ),
      values: hubValueSlots({
        issued: issued === null ? null : asMoneyFigure(issued.figure),
        estimated: estimated === null ? null : asMoneyFigure(estimated.figure),
        taxAssessed,
      }),
      vendors,
    };
  },
});

export const reengageVendor = mutation({
  args: {
    transactionId: v.id("transactions"),
    vendorId: v.id("vendors"),
  },
  handler: async (ctx, args) => {
    const { user, transaction } = await requireClosedTransactionAccess(
      ctx,
      args.transactionId,
    );
    const vendor = await ctx.db.get(args.vendorId);
    if (vendor === null || vendor.orgId !== transaction.orgId) {
      throw new Error("FORBIDDEN");
    }
    if (vendor.compensationModel !== "none") {
      throw new Error("FORBIDDEN");
    }
    const assignmentId = await ctx.db.insert("vendorAssignments", {
      vendorId: args.vendorId,
      transactionId: args.transactionId,
      scope: `reengage:${vendor.category}`,
      expiresAt: Date.now() + ASSIGNMENT_TTL_MS,
      status: "active",
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "homeownership.vendor_reengaged",
      targetType: "vendorAssignment",
      targetId: assignmentId,
      meta: {
        vendorId: args.vendorId,
        compensationModel: "none",
      },
    });
    return {
      assignmentId,
      compensationModel: "none" as const,
    };
  },
});
