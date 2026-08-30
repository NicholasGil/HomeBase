import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { REQUIRED_P0_TABLES, SEED_PLAN } from "./seedPlan";
import { modules } from "./test.setup";

describe("seed", () => {
  it("creates one org, eight buyers with distinct transactions, and one agent", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const counts = await t.run(async (ctx) => {
      const orgs = await ctx.db.query("orgs").collect();
      const users = await ctx.db.query("users").collect();
      const memberships = await ctx.db.query("memberships").collect();
      const clients = await ctx.db.query("clients").collect();
      const transactions = await ctx.db.query("transactions").collect();
      const stages = await ctx.db.query("journeyStages").collect();
      const tasks = await ctx.db.query("tasks").collect();
      const audit = await ctx.db.query("auditLog").collect();
      return {
        orgs,
        users,
        memberships,
        clients,
        transactions,
        stages,
        tasks,
        audit,
      };
    });

    expect(counts.orgs).toHaveLength(1);
    expect(counts.orgs[0]?.name).toBe(SEED_PLAN.org.name);
    expect(counts.orgs[0]?.flags).toEqual({
      FLAG_MLS: false,
      FLAG_VENDOR_COMP: false,
      FLAG_ESIGN: false,
      FLAG_IDV: false,
    });

    expect(counts.users).toHaveLength(10);
    expect(counts.memberships.filter((row) => row.role === "buyer")).toHaveLength(8);
    expect(counts.memberships.filter((row) => row.role === "agent")).toHaveLength(1);
    expect(counts.clients).toHaveLength(8);
    expect(counts.transactions).toHaveLength(8);
    expect(counts.transactions[0]?._id).not.toBe(counts.transactions[1]?._id);
    expect(counts.stages).toHaveLength(13);
    expect(counts.tasks.length).toBeGreaterThan(0);
    expect(counts.audit.length).toBeGreaterThan(0);

    for (const table of REQUIRED_P0_TABLES) {
      expect(table in schema.tables).toBe(true);
    }

    const vendors = await t.run(async (ctx) => ctx.db.query("vendors").collect());
    expect(vendors.length).toBeGreaterThanOrEqual(14);
    expect(vendors.every((row) => row.compensationModel === "none")).toBe(true);
    expect(vendors.some((row) => row.category === "inspectors")).toBe(true);
    expect(vendors.some((row) => row.category === "lenders")).toBe(true);

    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const alex = await asAlex.query(api.transactions.listMine, {});
    const blair = await asBlair.query(api.transactions.listMine, {});
    expect(alex).toHaveLength(1);
    expect(blair).toHaveLength(1);
    expect(alex[0]?._id).not.toBe(blair[0]?._id);
    expect(alex[0]?.stage).toBe("inspection");
    expect(blair[0]?.stage).toBe("showings");
    expect(alex[0]?.owedToday?.provenance).toBe("title_issued");

    const offers = await t.run(async (ctx) => ctx.db.query("offers").collect());
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) {
      expect(offer.status).toBe("draft");
      expect(offer.reviewedByLicenseeId).toBeUndefined();
    }
  });
});
