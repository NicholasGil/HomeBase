import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function seededWithVendor() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
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

async function agentTaskId(t: ReturnType<typeof convexTest>) {
  const transactionId = await buyerATransactionId(t);
  const tasks = await t
    .withIdentity({ subject: "clerk_agent" })
    .query(api.tasks.listForTransaction, { transactionId });
  const schedule = tasks.find((task) => task.title === "Schedule inspection");
  if (schedule === undefined) {
    throw new Error("seed agent task missing");
  }
  return { transactionId, taskId: schedule._id };
}

describe("task write permissions", () => {
  it("denies buyer, vendor, and unauthenticated callers on create", async () => {
    const t = await seededWithVendor();
    const transactionId = await buyerATransactionId(t);
    const payload = {
      transactionId,
      stage: "inspection",
      title: "Sneak a task",
      assigneeRole: "buyer" as const,
      blocksStage: false,
    };

    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_a" })
        .mutation(api.tasks.create, payload),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_vendor" })
        .mutation(api.tasks.create, payload),
    ).rejects.toThrow("FORBIDDEN");
    await expect(t.mutation(api.tasks.create, payload)).rejects.toThrow(
      "UNAUTHENTICATED",
    );
  });

  it("denies buyer, vendor, and unauthenticated callers on complete", async () => {
    const t = await seededWithVendor();
    const { taskId } = await agentTaskId(t);

    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_a" })
        .mutation(api.tasks.complete, { taskId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_vendor" })
        .mutation(api.tasks.complete, { taskId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(t.mutation(api.tasks.complete, { taskId })).rejects.toThrow(
      "UNAUTHENTICATED",
    );

    const after = await t
      .withIdentity({ subject: "clerk_agent" })
      .query(api.tasks.listForTransaction, {
        transactionId: await buyerATransactionId(t),
      });
    expect(after.find((task) => task._id === taskId)?.status).toBe("open");
  });
});
