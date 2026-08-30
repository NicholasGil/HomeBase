import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import {
  COMMAND_CENTER_CLIENT_COUNT,
  COMMAND_CENTER_EXCEPTION_NAMES,
  SEED_PLAN,
} from "./seedPlan";
import schema from "./schema";
import { modules } from "./test.setup";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

describe("agent command center", () => {
  it("renders eight assigned clients and puts the two exceptions first", async () => {
    const t = await seeded();
    const asAgent = t.withIdentity({ subject: "clerk_agent" });
    const view = await asAgent.query(api.commandCenter.getMine, {});
    expect(view.roster).toHaveLength(COMMAND_CENTER_CLIENT_COUNT);
    expect(view.priority).toHaveLength(COMMAND_CENTER_CLIENT_COUNT);
    expect(view.roster.map((row) => row.name).sort()).toEqual(
      [...SEED_PLAN.buyers.map((buyer) => buyer.name)].sort(),
    );
    for (const buyer of SEED_PLAN.buyers) {
      const row = view.roster.find((client) => client.name === buyer.name);
      expect(row?.stage).toBe(buyer.stage);
    }
    expect(view.priority[0]?.name).toBe(COMMAND_CENTER_EXCEPTION_NAMES[0]);
    expect(view.priority[1]?.name).toBe(COMMAND_CENTER_EXCEPTION_NAMES[1]);
    expect(view.priority[0]?.exceptions[0]?.kind).toBe(
      "missing_financing_document",
    );
    expect(view.priority[1]?.exceptions[0]?.kind).toBe(
      "inspection_due_tomorrow",
    );
    expect(
      JSON.stringify(view).includes("extractedSummary"),
    ).toBe(false);
    expect(JSON.stringify(view)).not.toMatch(/Roof and HVAC/);
  });

  it("denies buyer, vendor, and unauthenticated callers", async () => {
    const t = await seeded();
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first();
      if (org === null) {
        throw new Error("missing org");
      }
      const userId = await ctx.db.insert("users", {
        clerkId: "clerk_vendor",
        email: "devon.nguyen@example.com",
        name: "Devon Nguyen",
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId: org._id,
        role: "vendor",
      });
    });
    await expect(t.query(api.commandCenter.getMine, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_a" })
        .query(api.commandCenter.getMine, {}),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_vendor" })
        .query(api.commandCenter.getMine, {}),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.commandCenter.getMine, {}),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("keeps another agent off Casey's book", async () => {
    const t = await seeded();
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first();
      const casey = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_agent"))
        .unique();
      if (org === null || casey === null) {
        throw new Error("seed missing agent");
      }
      const otherAgentId = await ctx.db.insert("users", {
        clerkId: "clerk_agent_other",
        email: "morgan.vale@example.com",
        name: "Morgan Vale",
      });
      await ctx.db.insert("memberships", {
        userId: otherAgentId,
        orgId: org._id,
        role: "agent",
      });
      const otherBuyerId = await ctx.db.insert("users", {
        clerkId: "clerk_buyer_other",
        email: "other.buyer@example.com",
        name: "Other Buyer",
      });
      await ctx.db.insert("memberships", {
        userId: otherBuyerId,
        orgId: org._id,
        role: "buyer",
      });
      const clientId = await ctx.db.insert("clients", {
        userId: otherBuyerId,
        orgId: org._id,
        preferences: {},
        prequalStatus: "none",
        budget: {
          amountCents: 10000000,
          currency: "USD",
          provenance: "user_entered",
          asOf: Date.now(),
          label: "Budget target",
        },
      });
      await ctx.db.insert("transactions", {
        orgId: org._id,
        clientId,
        agentId: otherAgentId,
        stage: "discovery",
        status: "active",
        keyDates: {},
      });
      expect(casey._id).not.toBe(otherAgentId);
    });

    const caseyView = await t
      .withIdentity({ subject: "clerk_agent" })
      .query(api.commandCenter.getMine, {});
    expect(caseyView.roster).toHaveLength(COMMAND_CENTER_CLIENT_COUNT);
    expect(caseyView.roster.some((row) => row.name === "Other Buyer")).toBe(
      false,
    );

    const otherView = await t
      .withIdentity({ subject: "clerk_agent_other" })
      .query(api.commandCenter.getMine, {});
    expect(otherView.roster).toHaveLength(1);
    expect(otherView.roster[0]?.name).toBe("Other Buyer");
    expect(
      otherView.roster.some((row) => row.name === "Alex Rivera"),
    ).toBe(false);
  });
});
