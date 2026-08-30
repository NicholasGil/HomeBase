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

async function buyerADocs(t: ReturnType<typeof convexTest>) {
  const asBuyer = t.withIdentity({ subject: "clerk_buyer_a" });
  const docs = await asBuyer.query(api.documents.listMine, {});
  const preapproval = docs.find((row) => row.type === "preapproval");
  const inspection = docs.find((row) => row.type === "inspection_report");
  if (preapproval === undefined || inspection === undefined) {
    throw new Error("seed documents missing");
  }
  return { asBuyer, preapproval, inspection };
}

async function lenderUserId(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find((row) => row.clerkId === "clerk_lender");
    if (user === undefined) {
      throw new Error("lender missing");
    }
    return user._id;
  });
}

describe("document grants", () => {
  it("lets a lender open a granted preapproval and denies the inspection report by id", async () => {
    const t = await seeded();
    const { asBuyer, preapproval, inspection } = await buyerADocs(t);
    const lenderId = await lenderUserId(t);
    const asLender = t.withIdentity({ subject: "clerk_lender" });

    await expect(
      asLender.mutation(api.documents.open, { documentId: inspection._id }),
    ).rejects.toThrow("FORBIDDEN");

    const grantId = await asBuyer.mutation(api.documents.grant, {
      documentId: preapproval._id,
      granteeId: lenderId,
      scope: "view",
      expiresAt: Date.now() + 60_000,
    });

    const opened = await asLender.mutation(api.documents.open, {
      documentId: preapproval._id,
    });
    expect(opened.type).toBe("preapproval");
    expect(opened.via).toBe("grant");

    await expect(
      asLender.mutation(api.documents.open, { documentId: inspection._id }),
    ).rejects.toThrow("FORBIDDEN");

    const listed = await asLender.query(api.documents.listMine, {});
    expect(listed.map((row) => row.type)).toEqual(["preapproval"]);

    await asBuyer.mutation(api.documents.revoke, { grantId });
    await expect(
      asLender.mutation(api.documents.open, { documentId: preapproval._id }),
    ).rejects.toThrow("FORBIDDEN");

    const audit = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(audit.some((entry) => entry.action === "document.viewed")).toBe(true);
    expect(audit.some((entry) => entry.action === "document.granted")).toBe(true);
    expect(audit.some((entry) => entry.action === "document.revoked")).toBe(true);
    expect(
      audit.filter((entry) => entry.action === "document.viewed").length,
    ).toBeGreaterThan(0);
  });

  it("denies unauthorized roles on document reads and writes", async () => {
    const t = await seeded();
    const { preapproval } = await buyerADocs(t);
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const asLender = t.withIdentity({ subject: "clerk_lender" });

    await expect(
      asBlair.mutation(api.documents.open, { documentId: preapproval._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asLender.query(api.documents.listForTransaction, {
        transactionId: preapproval.transactionId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.mutation(api.documents.open, { documentId: preapproval._id }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      asLender.mutation(api.documents.grant, {
        documentId: preapproval._id,
        granteeId: preapproval.uploadedBy,
        scope: "view",
        expiresAt: Date.now() + 1000,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("classifies an upload and reports missing stage documents", async () => {
    const t = await seeded();
    const { asBuyer, preapproval } = await buyerADocs(t);
    const created = await asBuyer.mutation(api.documents.create, {
      transactionId: preapproval.transactionId,
      fileName: "earnest-money-receipt.pdf",
    });
    expect(created.type).toBe("earnest_money");
    const missing = await asBuyer.query(api.documents.missingForStage, {
      transactionId: preapproval.transactionId,
    });
    expect(missing).toContain("repair_request");
    expect(missing).not.toContain("inspection_report");
  });
});
