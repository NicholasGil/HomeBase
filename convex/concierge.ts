import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import { requireTransactionAccess } from "./lib/authz";
import {
  gatherConciergeFacts,
  wantsInspectionFindings,
} from "./lib/conciergeFacts";
import { requireDocumentAccess } from "./lib/documentAccess";

async function readInspectionFindings(
  ctx: MutationCtx,
  transactionId: Id<"transactions">,
) {
  const documents = await ctx.db
    .query("documents")
    .withIndex("by_transaction", (q) => q.eq("transactionId", transactionId))
    .collect();
  const inspection = documents.find(
    (document) => document.type === "inspection_report",
  );
  if (inspection === undefined) {
    return { found: false as const };
  }
  const access = await requireDocumentAccess(ctx, inspection._id);
  await appendAuditLog(ctx, {
    actorId: access.user._id,
    action: "document.viewed",
    targetType: "document",
    targetId: inspection._id,
    meta: {
      via: access.via,
      type: access.document.type,
      transactionId: access.document.transactionId,
    },
  });
  return {
    found: true as const,
    text: access.document.extractedSummary ?? null,
    documentId: inspection._id,
    via: access.via,
  };
}

export const gatherContext = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    return await gatherConciergeFacts(ctx, transaction);
  },
});

export const listThread = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireTransactionAccess(ctx, args.transactionId);
    const thread = await ctx.db
      .query("conciergeThreads")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .unique();
    return thread?.messages ?? [];
  },
});

export const loadInspectionFindings = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireTransactionAccess(ctx, args.transactionId);
    return await readInspectionFindings(ctx, args.transactionId);
  },
});

export const ask = mutation({
  args: {
    transactionId: v.id("transactions"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const { transaction } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    const facts = await gatherConciergeFacts(ctx, transaction);
    if (!wantsInspectionFindings(args.question)) {
      return { facts };
    }
    const loaded = await readInspectionFindings(ctx, args.transactionId);
    if (!loaded.found || loaded.text === null) {
      return { facts };
    }
    return {
      facts: [
        ...facts.filter((fact) => fact.key !== "inspection_findings"),
        {
          key: "inspection_findings",
          text: loaded.text,
          source: "documents.inspection_report",
        },
      ],
    };
  },
});

export const appendTurn = mutation({
  args: {
    transactionId: v.id("transactions"),
    question: v.string(),
    answer: v.string(),
    kind: v.union(
      v.literal("answer"),
      v.literal("refuse"),
      v.literal("ask_agent"),
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireTransactionAccess(ctx, args.transactionId);
    const now = Date.now();
    const existing = await ctx.db
      .query("conciergeThreads")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .unique();
    const messages = [
      ...(existing?.messages ?? []),
      { role: "user" as const, content: args.question, at: now },
      { role: "assistant" as const, content: args.answer, at: now },
    ];
    if (existing === null) {
      await ctx.db.insert("conciergeThreads", {
        transactionId: args.transactionId,
        messages,
      });
    } else {
      await ctx.db.patch(existing._id, { messages });
    }
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "concierge.asked",
      targetType: "transaction",
      targetId: args.transactionId,
      meta: { kind: args.kind },
    });
    return { ok: true };
  },
});
