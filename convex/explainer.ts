import { v } from "convex/values";

import { writeConciergeTurn } from "./concierge";
import { mutation, query } from "./_generated/server";
import {
  ASK_MY_AGENT,
  agentQuestionForSection,
  explainAllSections,
  explainSection,
  isContractSectionId,
} from "./lib/explainContract";
import { requireTransactionAccess, requireTransactionReadRole } from "./lib/authz";
import { listAccessibleTransactions } from "./transactions";

export const listSections = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await requireTransactionAccess(ctx, args.transactionId);
    return explainAllSections();
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireTransactionReadRole(ctx);
    const transactions = await listAccessibleTransactions(
      ctx,
      user._id,
      membership,
    );
    const first = transactions[0];
    if (first === undefined) {
      return null;
    }
    return {
      transactionId: first._id,
      sections: explainAllSections(),
    };
  },
});

export const askAboutSection = mutation({
  args: {
    transactionId: v.id("transactions"),
    sectionId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireTransactionAccess(ctx, args.transactionId);
    if (!isContractSectionId(args.sectionId)) {
      throw new Error("UNKNOWN_SECTION");
    }
    const section = explainSection(args.sectionId);
    const question = agentQuestionForSection(section);
    const answer = `${ASK_MY_AGENT}. Section "${section.title}" was sent to your licensee.`;
    await writeConciergeTurn(ctx, {
      transactionId: args.transactionId,
      actorId: user._id,
      question,
      answer,
      kind: "ask_agent",
    });
    return {
      ok: true as const,
      question,
      sectionId: section.id,
      title: section.title,
    };
  },
});
