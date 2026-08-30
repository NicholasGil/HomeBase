import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function seedWithBroker() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  await t.run(async (ctx) => {
    const org = await ctx.db.query("orgs").first();
    if (org === null) {
      throw new Error("missing org");
    }
    const brokerId = await ctx.db.insert("users", {
      clerkId: "clerk_broker",
      email: "riley.brooks@example.com",
      name: "Riley Brooks",
    });
    await ctx.db.insert("memberships", {
      userId: brokerId,
      orgId: org._id,
      role: "broker",
    });
  });
  return t;
}

describe("org-configurable journey stages", () => {
  it("lists seeded stages in order", async () => {
    const t = await seedWithBroker();
    const stages = await t
      .withIdentity({ subject: "clerk_buyer_a" })
      .query(api.journey.listStages, {});
    expect(stages.map((stage) => stage.key)).toEqual([
      "discovery",
      "financing",
      "favorites",
      "showings",
      "offer",
      "negotiation",
      "under_contract",
      "inspection",
      "appraisal",
      "title",
      "final_walkthrough",
      "closing",
      "move_in",
    ]);
    const inspection = stages.find((stage) => stage.key === "inspection");
    expect(inspection?.defaultTasks.some((task) => task.blocksStage)).toBe(true);
  });

  it("denies vendor and unauthenticated callers on listStages", async () => {
    const t = await seedWithBroker();
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first();
      if (org === null) {
        throw new Error("missing org");
      }
      const vendorId = await ctx.db.insert("users", {
        clerkId: "clerk_vendor",
        email: "devon.nguyen@example.com",
        name: "Devon Nguyen",
      });
      await ctx.db.insert("memberships", {
        userId: vendorId,
        orgId: org._id,
        role: "vendor",
      });
    });

    await expect(
      t
        .withIdentity({ subject: "clerk_vendor" })
        .query(api.journey.listStages, {}),
    ).rejects.toThrow("FORBIDDEN");
    await expect(t.query(api.journey.listStages, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
  });

  it("lets a broker replace stages and denies buyer and vendor", async () => {
    const t = await seedWithBroker();
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first();
      if (org === null) {
        throw new Error("missing org");
      }
      const vendorId = await ctx.db.insert("users", {
        clerkId: "clerk_vendor",
        email: "devon.nguyen@example.com",
        name: "Devon Nguyen",
      });
      await ctx.db.insert("memberships", {
        userId: vendorId,
        orgId: org._id,
        role: "vendor",
      });
    });

    const replacement = [
      {
        key: "intake",
        label: "Intake",
        order: 1,
        defaultTasks: [
          {
            title: "Collect intake packet",
            assigneeRole: "buyer" as const,
            blocksStage: true,
          },
        ],
      },
      {
        key: "underway",
        label: "Underway",
        order: 2,
        defaultTasks: [],
      },
    ];

    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_a" })
        .mutation(api.journey.replaceStages, { stages: replacement }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_vendor" })
        .mutation(api.journey.replaceStages, { stages: replacement }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.mutation(api.journey.replaceStages, { stages: replacement }),
    ).rejects.toThrow("UNAUTHENTICATED");

    const result = await t
      .withIdentity({ subject: "clerk_broker" })
      .mutation(api.journey.replaceStages, { stages: replacement });
    expect(result.count).toBe(2);

    const stages = await t
      .withIdentity({ subject: "clerk_broker" })
      .query(api.journey.listStages, {});
    expect(stages.map((stage) => stage.key)).toEqual(["intake", "underway"]);

    const audit = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(
      audit.some((entry) => entry.action === "journey.stages_replaced"),
    ).toBe(true);
  });
});
