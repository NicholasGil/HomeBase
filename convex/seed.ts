import { internalMutation } from "./_generated/server";
import { appendAuditLog } from "./lib/audit";
import { DEFAULT_FEATURE_FLAGS } from "./lib/validators";
import { SEED_PLAN } from "./seedPlan";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("orgs").first();
    if (existing !== null) {
      return { orgId: existing._id, seeded: false };
    }

    const now = Date.now();
    const orgId = await ctx.db.insert("orgs", {
      name: SEED_PLAN.org.name,
      state: SEED_PLAN.org.state,
      settings: { timezone: "America/Chicago" },
      flags: { ...DEFAULT_FEATURE_FLAGS },
    });

    const agentId = await ctx.db.insert("users", {
      clerkId: SEED_PLAN.agent.clerkId,
      email: SEED_PLAN.agent.email,
      name: SEED_PLAN.agent.name,
      phone: SEED_PLAN.agent.phone,
    });
    await ctx.db.insert("memberships", {
      userId: agentId,
      orgId,
      role: "agent",
    });

    for (const stage of SEED_PLAN.stages) {
      await ctx.db.insert("journeyStages", {
        orgId,
        key: stage.key,
        label: stage.label,
        order: stage.order,
        defaultTasks: stage.defaultTasks.map((task) => ({
          title: task.title,
          assigneeRole: task.assigneeRole,
          blocksStage: task.blocksStage,
        })),
        requiredDocuments: [...stage.requiredDocuments],
      });
    }

    const lenderId = await ctx.db.insert("users", {
      clerkId: SEED_PLAN.lender.clerkId,
      email: SEED_PLAN.lender.email,
      name: SEED_PLAN.lender.name,
      phone: SEED_PLAN.lender.phone,
    });
    await ctx.db.insert("memberships", {
      userId: lenderId,
      orgId,
      role: "vendor",
    });

    const transactionIds: string[] = [];

    for (const buyer of SEED_PLAN.buyers) {
      const userId = await ctx.db.insert("users", {
        clerkId: buyer.clerkId,
        email: buyer.email,
        name: buyer.name,
        phone: buyer.phone,
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId,
        role: "buyer",
      });

      const clientId = await ctx.db.insert("clients", {
        userId,
        orgId,
        preferences: { beds: 3 },
        prequalStatus: "preapproved",
        budget: {
          amountCents: 45000000,
          currency: "USD",
          provenance: "lender_issued",
          asOf: now,
          label: "Preapproval ceiling",
        },
      });

      const propertyId = await ctx.db.insert("properties", {
        address: buyer.property,
        specs: { beds: 3, baths: 2, sqft: 1800 },
        media: [],
        source: "manual",
      });

      const transactionId = await ctx.db.insert("transactions", {
        orgId,
        clientId,
        agentId,
        propertyId,
        stage: buyer.stage,
        status: "active",
        keyDates: {
          underContractAt: buyer.stage === "inspection" ? now - 86400000 * 5 : undefined,
          inspectionDueAt: buyer.stage === "inspection" ? now + 86400000 * 2 : undefined,
        },
        owedToday: {
          amountCents: buyer.owedToday.amountCents,
          currency: buyer.owedToday.currency,
          provenance: buyer.owedToday.provenance,
          asOf: now,
          label: buyer.owedToday.label,
        },
      });
      transactionIds.push(transactionId);

      if (buyer.clerkId === "clerk_buyer_a") {
        await ctx.db.insert("tasks", {
          transactionId,
          stage: "under_contract",
          title: "Sign purchase agreement",
          assigneeRole: "agent",
          status: "done",
          blockedBy: [],
          blocksStage: true,
        });
        await ctx.db.insert("tasks", {
          transactionId,
          stage: "under_contract",
          title: "Submit earnest money",
          assigneeRole: "buyer",
          status: "done",
          blockedBy: [],
          blocksStage: true,
        });
        const scheduleId = await ctx.db.insert("tasks", {
          transactionId,
          stage: "inspection",
          title: "Schedule inspection",
          assigneeRole: "agent",
          status: "open",
          blockedBy: [],
          blocksStage: true,
        });
        await ctx.db.insert("tasks", {
          transactionId,
          stage: "inspection",
          title: "Review inspection report",
          assigneeRole: "buyer",
          status: "blocked",
          blockedBy: [scheduleId],
          blocksStage: true,
        });
        await ctx.db.insert("documents", {
          transactionId,
          type: "preapproval",
          extractedSummary:
            "Lender issued a $450,000 preapproval ceiling on this buyer.",
          status: "summarized",
          uploadedBy: userId,
        });
        await ctx.db.insert("documents", {
          transactionId,
          type: "inspection_report",
          extractedSummary:
            "Roof and HVAC need service. No structural defects noted.",
          status: "summarized",
          uploadedBy: agentId,
        });
      } else {
        await ctx.db.insert("tasks", {
          transactionId,
          stage: "financing",
          title: "Send lender documents",
          assigneeRole: "buyer",
          status: "done",
          blockedBy: [],
          blocksStage: true,
        });
        await ctx.db.insert("tasks", {
          transactionId,
          stage: "showings",
          title: "Tour Saturday listings",
          assigneeRole: "buyer",
          status: "open",
          blockedBy: [],
          blocksStage: false,
        });
      }

      await appendAuditLog(ctx, {
        actorId: "system",
        action: "transaction.seeded",
        targetType: "transaction",
        targetId: transactionId,
        meta: { stage: buyer.stage, buyer: buyer.clerkId },
      });
    }

    await appendAuditLog(ctx, {
      actorId: "system",
      action: "org.seeded",
      targetType: "org",
      targetId: orgId,
      meta: { name: SEED_PLAN.org.name },
    });

    return { orgId, seeded: true, transactionIds };
  },
});
