import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

async function buyerATransactionId(t: ReturnType<typeof convexTest>) {
  const mine = await t
    .withIdentity({ subject: "clerk_buyer_a" })
    .query(api.transactions.listMine, {});
  const first = mine[0];
  if (first === undefined) {
    throw new Error("buyer A has no transaction");
  }
  return first._id;
}

describe("stage advance", () => {
  it("blocks while a blocking task is open, then writes audit on advance", async () => {
    const t = await seeded();
    const transactionId = await buyerATransactionId(t);
    const asAgent = t.withIdentity({ subject: "clerk_agent" });
    const asBuyer = t.withIdentity({ subject: "clerk_buyer_a" });

    await expect(
      asAgent.mutation(api.transactions.advanceStage, { transactionId }),
    ).rejects.toThrow("STAGE_BLOCKED");
    await expect(
      asBuyer.mutation(api.transactions.advanceStage, { transactionId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.mutation(api.transactions.advanceStage, { transactionId }),
    ).rejects.toThrow("UNAUTHENTICATED");

    const tasks = await asAgent.query(api.tasks.listForTransaction, {
      transactionId,
    });
    const schedule = tasks.find((task) => task.title === "Schedule inspection");
    const review = tasks.find((task) => task.title === "Review inspection report");
    if (schedule === undefined || review === undefined) {
      throw new Error("seed tasks missing");
    }

    await asAgent.mutation(api.tasks.complete, { taskId: schedule._id });
    await expect(
      asAgent.mutation(api.transactions.advanceStage, { transactionId }),
    ).rejects.toThrow("STAGE_BLOCKED");

    const afterSchedule = await asAgent.query(api.tasks.listForTransaction, {
      transactionId,
    });
    expect(
      afterSchedule.find((task) => task._id === review._id)?.status,
    ).toBe("open");

    await asAgent.mutation(api.tasks.complete, { taskId: review._id });
    const advanced = await asAgent.mutation(api.transactions.advanceStage, {
      transactionId,
    });
    expect(advanced).toEqual({ from: "inspection", to: "appraisal" });

    const view = await asBuyer.query(api.dashboard.getBuyerDashboard, {});
    expect(view?.where.key).toBe("appraisal");
    expect(view?.currentStageTasks.some((task) => task.title === "Order appraisal")).toBe(
      true,
    );

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .collect()
        .then((rows) =>
          rows.filter((entry) => entry.targetId === transactionId),
        ),
    );
    const transition = audit.find(
      (entry) => entry.action === "transaction.stage_advanced",
    );
    expect(transition?.meta.from).toBe("inspection");
    expect(transition?.meta.to).toBe("appraisal");
  });

  it("denies vendor task writes and stage advance", async () => {
    const t = await seeded();
    const transactionId = await buyerATransactionId(t);
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
    const asVendor = t.withIdentity({ subject: "clerk_vendor" });
    await expect(
      asVendor.mutation(api.tasks.create, {
        transactionId,
        stage: "inspection",
        title: "Sneak a task",
        assigneeRole: "vendor",
        blocksStage: false,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.mutation(api.transactions.advanceStage, { transactionId }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
