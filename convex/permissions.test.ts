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
  "me.getSession",
  "me.listOrgDirectory",
  "dashboard.getBuyerDashboard",
  "dashboard.getById",
  "documents.listMine",
  "documents.listForTransaction",
  "documents.missingForStage",
  "documents.listGrants",
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
    expect(READ_FUNCTIONS).toHaveLength(15);
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
    ["me.getSession", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.me.getSession, {})],
    ["dashboard.getBuyerDashboard", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.dashboard.getBuyerDashboard, {})],
    ["dashboard.getById", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.dashboard.getById, { transactionId: id });
    }],
    ["me.listOrgDirectory", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.me.listOrgDirectory, {})],
    ["documents.listMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.documents.listMine, {})],
    ["documents.listForTransaction", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.documents.listForTransaction, { transactionId: id });
    }],
    ["documents.missingForStage", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.documents.missingForStage, { transactionId: id });
    }],
    ["documents.listGrants", async (t: ReturnType<typeof convexTest>) => {
      const docs = await t
        .withIdentity({ subject: "clerk_buyer_a" })
        .query(api.documents.listMine, {});
      const first = docs[0];
      if (first === undefined) {
        throw new Error("seed documents missing");
      }
      return t.query(api.documents.listGrants, { documentId: first._id });
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
    ["me.getSession", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.me.getSession, {}), false],
    ["dashboard.getBuyerDashboard", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.dashboard.getBuyerDashboard, {}), true],
    ["me.listOrgDirectory", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.me.listOrgDirectory, {}), true],
    ["documents.listMine", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.documents.listMine, {}), false],
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
    await expect(
      asVendor.query(api.dashboard.getById, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.documents.listForTransaction, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.documents.missingForStage, { transactionId: id }),
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
    await expect(asStranger.query(api.me.getSession, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asStranger.query(api.dashboard.getBuyerDashboard, {}),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asStranger.query(api.documents.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.me.listOrgDirectory, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    const docs = await t
      .withIdentity({ subject: "clerk_buyer_a" })
      .query(api.documents.listMine, {});
    const first = docs[0];
    if (first === undefined) {
      throw new Error("seed documents missing");
    }
    await expect(
      asStranger.query(api.documents.listGrants, { documentId: first._id }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("refuses listGrants for a vendor who holds an active grant", async () => {
    const t = await seeded();
    const asBuyer = t.withIdentity({ subject: "clerk_buyer_a" });
    const docs = await asBuyer.query(api.documents.listMine, {});
    const preapproval = docs.find((row) => row.type === "preapproval");
    if (preapproval === undefined) {
      throw new Error("seed documents missing");
    }
    const lenderId = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_lender"))
        .unique();
      if (user === null) {
        throw new Error("lender missing");
      }
      return user._id;
    });
    await asBuyer.mutation(api.documents.grant, {
      documentId: preapproval._id,
      granteeId: lenderId,
      scope: "view",
      expiresAt: Date.now() + 60_000,
    });
    const asLender = t.withIdentity({ subject: "clerk_lender" });
    await expect(
      asLender.query(api.documents.listGrants, {
        documentId: preapproval._id,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
