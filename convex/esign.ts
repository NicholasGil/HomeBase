import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import {
  assertRole,
  requireMembership,
  requireTransactionAccess,
} from "./lib/authz";
import { requireDocumentAccess } from "./lib/documentAccess";
import {
  assertEsignEnabled,
  assertExpectedStatus,
  explainedSectionIdsFromM7,
  isDesignatedDocumentType,
  retentionUntil,
  sandboxProvider,
  SIGNATURE_FLOW,
  type SignatureFlowStatus,
} from "./lib/esign";
import {
  assertSandboxEsignProvider,
  sandboxCompleteSign,
  sandboxSendPacket,
} from "./lib/esignSandbox";
import { explainAllSections } from "./lib/explainContract";
import { assertIdvAllowed } from "./lib/idv";
import { nextStageAfter, openBlockingTasks } from "./lib/journeyLogic";
import { listAccessibleTransactions } from "./transactions";
import {
  ESIGN_AGENT_REVIEW_ROLES,
  STAGE_ADVANCE_ROLES,
} from "./lib/validators";

function asFlowStatus(
  status: Doc<"signaturePackets">["status"],
): SignatureFlowStatus {
  const match = SIGNATURE_FLOW.find((step) => step === status);
  if (match === undefined) {
    throw new Error("FORBIDDEN");
  }
  return match;
}

function toListed(packet: Doc<"signaturePackets">) {
  return {
    _id: packet._id,
    transactionId: packet.transactionId,
    documentId: packet.documentId,
    status: packet.status,
    provider: packet.provider,
    providerRef: packet.providerRef ?? null,
    designated: packet.designated,
    retentionUntil: packet.retentionUntil ?? null,
    explainedSectionIds: packet.explainedSectionIds,
    agentReviewedById: packet.agentReviewedById ?? null,
    buyerReviewedById: packet.buyerReviewedById ?? null,
    verifiedAt: packet.verifiedAt ?? null,
    signedAt: packet.signedAt ?? null,
    storedDocumentId: packet.storedDocumentId ?? null,
    flow: [...SIGNATURE_FLOW],
  };
}

async function requirePacketAccess(
  ctx: Parameters<typeof requireTransactionAccess>[0],
  packetId: Id<"signaturePackets">,
) {
  const packet = await ctx.db.get(packetId);
  if (packet === null) {
    throw new Error("FORBIDDEN");
  }
  const session = await requireTransactionAccess(ctx, packet.transactionId);
  return { ...session, packet };
}

async function orgFlagsFor(
  ctx: Parameters<typeof requireTransactionAccess>[0],
  orgId: Id<"orgs">,
) {
  const org = await ctx.db.get(orgId);
  if (org === null) {
    throw new Error("FORBIDDEN");
  }
  return org;
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireMembership(ctx);
    if (membership.role === "vendor") {
      throw new Error("FORBIDDEN");
    }
    const transactions = await listAccessibleTransactions(
      ctx,
      user._id,
      membership,
    );
    const packets = [];
    for (const transaction of transactions) {
      const rows = await ctx.db
        .query("signaturePackets")
        .withIndex("by_transaction", (q) =>
          q.eq("transactionId", transaction._id),
        )
        .collect();
      packets.push(...rows.map(toListed));
    }
    return packets;
  },
});

export const listForTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireTransactionAccess(ctx, args.transactionId);
    const rows = await ctx.db
      .query("signaturePackets")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .collect();
    return rows.map(toListed);
  },
});

export const getPacket = query({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { packet } = await requirePacketAccess(ctx, args.packetId);
    return {
      ...toListed(packet),
      sections: explainAllSections(),
    };
  },
});

export const prepare = mutation({
  args: {
    transactionId: v.id("transactions"),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireTransactionAccess(
      ctx,
      args.transactionId,
    );
    const access = await requireDocumentAccess(ctx, args.documentId);
    if (access.document.transactionId !== args.transactionId) {
      throw new Error("FORBIDDEN");
    }
    const designated = isDesignatedDocumentType(access.document.type);
    const packetId = await ctx.db.insert("signaturePackets", {
      transactionId: args.transactionId,
      documentId: args.documentId,
      status: "prepare",
      provider: sandboxProvider(),
      designated,
      explainedSectionIds: [],
      createdBy: user._id,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.prepared",
      targetType: "signaturePacket",
      targetId: packetId,
      meta: {
        transactionId: args.transactionId,
        documentId: args.documentId,
        designated: designated ? "true" : "false",
      },
    });
    return { packetId, status: "prepare" as const, designated };
  },
});

export const attachExplain = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, packet } = await requirePacketAccess(ctx, args.packetId);
    assertExpectedStatus(asFlowStatus(packet.status), "prepare");
    const sectionIds = explainedSectionIdsFromM7();
    await ctx.db.patch(args.packetId, {
      status: "explain",
      explainedSectionIds: sectionIds,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.explained",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: { sections: sectionIds.join(",") },
    });
    return { status: "explain" as const, sections: explainAllSections() };
  },
});

export const submitAgentReview = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, membership, packet } = await requirePacketAccess(
      ctx,
      args.packetId,
    );
    assertExpectedStatus(asFlowStatus(packet.status), "explain");
    assertRole(membership, ESIGN_AGENT_REVIEW_ROLES);
    await ctx.db.patch(args.packetId, {
      status: "agent_review",
      agentReviewedById: user._id,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.agent_reviewed",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: { reviewedBy: user._id },
    });
    return { status: "agent_review" as const };
  },
});

export const submitBuyerReview = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, membership, packet } = await requirePacketAccess(
      ctx,
      args.packetId,
    );
    assertExpectedStatus(asFlowStatus(packet.status), "agent_review");
    if (membership.role !== "buyer") {
      throw new Error("FORBIDDEN");
    }
    await ctx.db.patch(args.packetId, {
      status: "buyer_review",
      buyerReviewedById: user._id,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.buyer_reviewed",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: { reviewedBy: user._id },
    });
    return { status: "buyer_review" as const };
  },
});

export const verifyPacket = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, membership, packet } = await requirePacketAccess(
      ctx,
      args.packetId,
    );
    assertExpectedStatus(asFlowStatus(packet.status), "buyer_review");
    if (membership.role !== "buyer") {
      throw new Error("FORBIDDEN");
    }
    const verifiedAt = Date.now();
    await ctx.db.patch(args.packetId, {
      status: "verify",
      verifiedAt,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.verified",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: {
        designated: packet.designated ? "true" : "false",
        verifiedAt: String(verifiedAt),
      },
    });
    return { status: "verify" as const, verifiedAt };
  },
});

export const sendToProvider = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, packet, transaction } = await requirePacketAccess(
      ctx,
      args.packetId,
    );
    assertExpectedStatus(asFlowStatus(packet.status), "verify");
    const org = await orgFlagsFor(ctx, transaction.orgId);
    assertEsignEnabled(org.flags);
    assertSandboxEsignProvider(packet.provider);
    const sent = sandboxSendPacket(args.packetId);
    await ctx.db.patch(args.packetId, {
      status: "sign",
      providerRef: sent.providerRef,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.sent",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: { providerRef: sent.providerRef, provider: packet.provider },
    });
    return { status: "sign" as const, providerRef: sent.providerRef };
  },
});

export const signWithProvider = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, membership, packet, transaction } = await requirePacketAccess(
      ctx,
      args.packetId,
    );
    assertExpectedStatus(asFlowStatus(packet.status), "sign");
    if (membership.role !== "buyer") {
      throw new Error("FORBIDDEN");
    }
    const org = await orgFlagsFor(ctx, transaction.orgId);
    assertEsignEnabled(org.flags);
    if (packet.designated) {
      assertIdvAllowed({ flags: org.flags, orgState: org.state });
    }
    assertSandboxEsignProvider(packet.provider);
    const providerRef = packet.providerRef;
    if (providerRef === undefined) {
      throw new Error("FORBIDDEN");
    }
    const signed = sandboxCompleteSign(providerRef);
    const signedAt = Date.now();
    await ctx.db.patch(args.packetId, {
      status: "audit_trail",
      signedAt,
      retentionUntil: retentionUntil(signedAt),
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.signed",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: {
        providerRef: signed.providerRef,
        signedAt: String(signedAt),
      },
    });
    return { status: "audit_trail" as const, signedAt };
  },
});

export const storeSigned = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, packet } = await requirePacketAccess(ctx, args.packetId);
    assertExpectedStatus(asFlowStatus(packet.status), "audit_trail");
    const source = await requireDocumentAccess(ctx, packet.documentId);
    const storedDocumentId = await ctx.db.insert("documents", {
      transactionId: packet.transactionId,
      type: source.document.type,
      extractedSummary: "Signed copy stored after sandbox sign.",
      status: "summarized",
      uploadedBy: user._id,
    });
    await ctx.db.patch(args.packetId, {
      status: "storage",
      storedDocumentId,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.stored",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: { storedDocumentId },
    });
    return { status: "storage" as const, storedDocumentId };
  },
});

export const completeAndAdvance = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, membership, packet, transaction } = await requirePacketAccess(
      ctx,
      args.packetId,
    );
    assertExpectedStatus(asFlowStatus(packet.status), "storage");
    let stageAdvance = "skipped";
    let toStage: string | null = null;
    if ((STAGE_ADVANCE_ROLES as readonly string[]).includes(membership.role)) {
      const [stages, tasks] = await Promise.all([
        ctx.db
          .query("journeyStages")
          .withIndex("by_org", (q) => q.eq("orgId", transaction.orgId))
          .collect(),
        ctx.db
          .query("tasks")
          .withIndex("by_transaction", (q) =>
            q.eq("transactionId", transaction._id),
          )
          .collect(),
      ]);
      const blockers = openBlockingTasks(tasks, transaction.stage);
      const next = nextStageAfter(stages, transaction.stage);
      if (blockers.length === 0 && next !== null) {
        await ctx.db.patch(transaction._id, { stage: next.key });
        stageAdvance = "advanced";
        toStage = next.key;
        await appendAuditLog(ctx, {
          actorId: user._id,
          action: "transaction.stage_advanced",
          targetType: "transaction",
          targetId: transaction._id,
          meta: {
            from: transaction.stage,
            to: next.key,
            via: "esign",
            packetId: args.packetId,
          },
        });
      } else {
        stageAdvance = "blocked";
      }
    }
    await ctx.db.patch(args.packetId, { status: "complete" });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "esign.completed",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: { stageAdvance },
    });
    return { status: "complete" as const, stageAdvance, toStage };
  },
});
