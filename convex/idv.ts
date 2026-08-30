import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import { requireMembership, requireTransactionAccess } from "./lib/authz";
import { requireDocumentAccess } from "./lib/documentAccess";
import {
  assertIdvAllowed,
  idvGating,
  isFinancialDocumentType,
  sandboxIdvProvider,
} from "./lib/idv";
import {
  assertSandboxIdvProvider,
  sandboxCompleteIdv,
  sandboxStartIdv,
} from "./lib/idvSandbox";
import { idvPurposeValidator } from "./lib/validators";

async function requireOrg(ctx: Parameters<typeof requireMembership>[0]) {
  const session = await requireMembership(ctx);
  const org = await ctx.db.get(session.membership.orgId);
  if (org === null) {
    throw new Error("FORBIDDEN");
  }
  return { ...session, org };
}

function toListed(
  session: {
    _id: string;
    purpose: "financial_document" | "designated_document" | "account_recovery";
    status: "pending" | "verified" | "failed" | "denied";
    provider: "sandbox";
    providerRef?: string;
    completedAt?: number;
  },
) {
  return {
    _id: session._id,
    purpose: session.purpose,
    status: session.status,
    provider: session.provider,
    providerRef: session.providerRef ?? null,
    completedAt: session.completedAt ?? null,
  };
}

export const getGating = query({
  args: {},
  handler: async (ctx) => {
    const { org, membership } = await requireOrg(ctx);
    if (membership.role === "vendor") {
      throw new Error("FORBIDDEN");
    }
    return idvGating({ flags: org.flags, orgState: org.state });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireOrg(ctx);
    if (membership.role === "vendor") {
      throw new Error("FORBIDDEN");
    }
    const rows = await ctx.db
      .query("idvSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows.map(toListed);
  },
});

export const startSession = mutation({
  args: { purpose: idvPurposeValidator },
  handler: async (ctx, args) => {
    const { user, membership, org } = await requireOrg(ctx);
    if (membership.role === "vendor") {
      throw new Error("FORBIDDEN");
    }
    assertIdvAllowed({ flags: org.flags, orgState: org.state });
    const sessionId = await ctx.db.insert("idvSessions", {
      orgId: org._id,
      userId: user._id,
      purpose: args.purpose,
      status: "pending",
      provider: sandboxIdvProvider(),
    });
    const started = sandboxStartIdv(sessionId);
    assertSandboxIdvProvider("sandbox");
    await ctx.db.patch(sessionId, { providerRef: started.providerRef });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "idv.started",
      targetType: "idvSession",
      targetId: sessionId,
      meta: { purpose: args.purpose, providerRef: started.providerRef },
    });
    return {
      sessionId,
      status: "pending" as const,
      providerRef: started.providerRef,
    };
  },
});

export const completeSession = mutation({
  args: { sessionId: v.id("idvSessions") },
  handler: async (ctx, args) => {
    const { user, org } = await requireOrg(ctx);
    assertIdvAllowed({ flags: org.flags, orgState: org.state });
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== user._id) {
      throw new Error("FORBIDDEN");
    }
    assertSandboxIdvProvider(session.provider);
    const providerRef = session.providerRef;
    if (providerRef === undefined) {
      throw new Error("FORBIDDEN");
    }
    const completed = sandboxCompleteIdv(providerRef);
    const completedAt = Date.now();
    await ctx.db.patch(args.sessionId, {
      status: "verified",
      completedAt,
    });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "idv.verified",
      targetType: "idvSession",
      targetId: args.sessionId,
      meta: {
        purpose: session.purpose,
        providerRef: completed.providerRef,
      },
    });
    return { status: "verified" as const, completedAt };
  },
});

export const accessFinancialDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const { org } = await requireOrg(ctx);
    assertIdvAllowed({ flags: org.flags, orgState: org.state });
    const access = await requireDocumentAccess(ctx, args.documentId);
    if (!isFinancialDocumentType(access.document.type)) {
      throw new Error("FORBIDDEN");
    }
    await appendAuditLog(ctx, {
      actorId: access.user._id,
      action: "idv.financial_document",
      targetType: "document",
      targetId: args.documentId,
      meta: { type: access.document.type, via: access.via },
    });
    return {
      _id: access.document._id,
      type: access.document.type,
      via: access.via,
    };
  },
});

export const executeDesignatedDocument = mutation({
  args: { packetId: v.id("signaturePackets") },
  handler: async (ctx, args) => {
    const { user, org } = await requireOrg(ctx);
    assertIdvAllowed({ flags: org.flags, orgState: org.state });
    const packet = await ctx.db.get(args.packetId);
    if (packet === null || !packet.designated) {
      throw new Error("FORBIDDEN");
    }
    await requireTransactionAccess(ctx, packet.transactionId);
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "idv.designated_document",
      targetType: "signaturePacket",
      targetId: args.packetId,
      meta: { purpose: "designated_document" },
    });
    return { ok: true as const, packetId: args.packetId };
  },
});

export const changeAccountRecovery = mutation({
  args: {},
  handler: async (ctx) => {
    const { user, membership, org } = await requireOrg(ctx);
    if (membership.role === "vendor") {
      throw new Error("FORBIDDEN");
    }
    assertIdvAllowed({ flags: org.flags, orgState: org.state });
    await appendAuditLog(ctx, {
      actorId: user._id,
      action: "idv.account_recovery",
      targetType: "user",
      targetId: user._id,
      meta: { changed: "false" },
    });
    return { ok: true as const, changed: false };
  },
});
