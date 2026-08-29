import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

const READ_FUNCTIONS = [
  "orgs.getMine",
  "orgs.getFlags",
  "journey.listStages",
  "transactions.listMine",
  "transactions.get",
  "tasks.listMine",
  "tasks.listForTransaction",
] as const;

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  await t.run(async (ctx) => {
    const org = await ctx.db.query("orgs").first();
    if (org === null) {
      throw new Error("seed missing org");
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
  const asBuyerA = t.withIdentity({ subject: "clerk_buyer_a" });
  const mine = await asBuyerA.query(api.transactions.listMine, {});
  const first = mine[0];
  if (first === undefined) {
    throw new Error("buyer A has no transaction");
  }
  return first._id;
}

describe("permission tests for data-reading functions", () => {
  it("lists every public read function so coverage cannot drift silently", () => {
    expect(READ_FUNCTIONS).toHaveLength(7);
  });

  it.each([
    ["orgs.getMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.orgs.getMine, {})],
    ["orgs.getFlags", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.orgs.getFlags, {})],
    ["journey.listStages", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.journey.listStages, {})],
    ["transactions.listMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.transactions.listMine, {})],
    ["transactions.get", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.transactions.get, { transactionId: id });
    }],
    ["tasks.listMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.tasks.listMine, {})],
    ["tasks.listForTransaction", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.tasks.listForTransaction, { transactionId: id });
    }],
  ] as const)("%s denies an unauthenticated caller", async (_name, call) => {
    const t = await seeded();
    await expect(call(t)).rejects.toThrow("UNAUTHENTICATED");
  });

  it.each([
    ["orgs.getMine", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.orgs.getMine, {}), false],
    ["orgs.getFlags", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.orgs.getFlags, {}), false],
    ["journey.listStages", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.journey.listStages, {}), true],
    ["transactions.listMine", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.transactions.listMine, {}), true],
    ["tasks.listMine", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.tasks.listMine, {}), true],
  ] as const)(
    "%s denies vendor when the function is transaction-scoped",
    async (_name, call, vendorDenied) => {
      const t = await seeded();
      const asVendor = t.withIdentity({ subject: "clerk_vendor" });
      if (vendorDenied) {
        await expect(call(asVendor)).rejects.toThrow("FORBIDDEN");
      } else {
        await expect(call(asVendor)).resolves.toBeTruthy();
      }
    },
  );

  it("denies vendor on transactions.get and tasks.listForTransaction", async () => {
    const t = await seeded();
    const id = await buyerATransactionId(t);
    const asVendor = t.withIdentity({ subject: "clerk_vendor" });
    await expect(
      asVendor.query(api.transactions.get, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.tasks.listForTransaction, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("denies a signed-in user with no membership", async () => {
    const t = await seeded();
    const asStranger = t.withIdentity({ subject: "clerk_stranger" });
    await expect(asStranger.query(api.orgs.getMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.orgs.getFlags, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.journey.listStages, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.transactions.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.tasks.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
  });
});
