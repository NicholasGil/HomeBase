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

  it("omits extractedSummary from list payloads and returns it only from open", async () => {
    const t = await seeded();
    const { asBuyer, preapproval } = await buyerADocs(t);
    const mine = await asBuyer.query(api.documents.listMine, {});
    const byTransaction = await asBuyer.query(api.documents.listForTransaction, {
      transactionId: preapproval.transactionId,
    });
    for (const row of [...mine, ...byTransaction]) {
      expect(row).not.toHaveProperty("extractedSummary");
    }

    const opened = await asBuyer.mutation(api.documents.open, {
      documentId: preapproval._id,
    });
    expect(opened.extractedSummary).toContain("450,000");
    const audit = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(
      audit.some(
        (entry) =>
          entry.action === "document.viewed" &&
          entry.targetId === preapproval._id,
      ),
    ).toBe(true);
  });

  it("refuses a grant to a user who is not a member of the document org", async () => {
    const t = await seeded();
    const { asBuyer, preapproval } = await buyerADocs(t);
    const outsiderId = await t.run(async (ctx) => {
      const otherOrg = await ctx.db.insert("orgs", {
        name: "Other Brokerage",
        state: "MN",
        settings: { timezone: "America/Chicago" },
        flags: {
          FLAG_MLS: false,
          FLAG_VENDOR_COMP: false,
          FLAG_ESIGN: false,
          FLAG_IDV: false,
        },
      });
      const userId = await ctx.db.insert("users", {
        clerkId: "clerk_other_org_vendor",
        email: "other.vendor@example.com",
        name: "Other Vendor",
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId: otherOrg,
        role: "vendor",
      });
      return userId;
    });

    await expect(
      asBuyer.mutation(api.documents.grant, {
        documentId: preapproval._id,
        granteeId: outsiderId,
        scope: "view",
        expiresAt: Date.now() + 60_000,
      }),
    ).rejects.toThrow("FORBIDDEN");

    await t.run(async (ctx) => {
      const buyer = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_buyer_a"))
        .unique();
      if (buyer === null) {
        throw new Error("buyer missing");
      }
      await ctx.db.insert("documentGrants", {
        documentId: preapproval._id,
        granteeId: outsiderId,
        scope: "view",
        expiresAt: Date.now() + 60_000,
        grantedBy: buyer._id,
      });
    });

    const asOutsider = t.withIdentity({ subject: "clerk_other_org_vendor" });
    await expect(
      asOutsider.mutation(api.documents.open, { documentId: preapproval._id }),
    ).rejects.toThrow("FORBIDDEN");
    const listed = await asOutsider.query(api.documents.listMine, {});
    expect(listed.map((row) => row.type)).not.toContain("preapproval");
    expect(listed.every((row) => !("extractedSummary" in row))).toBe(true);
  });

  it("refuses a grant to a same-org buyer", async () => {
    const t = await seeded();
    const { asBuyer, preapproval } = await buyerADocs(t);
    const blairId = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_buyer_b"))
        .unique();
      if (user === null) {
        throw new Error("blair missing");
      }
      return user._id;
    });
    await expect(
      asBuyer.mutation(api.documents.grant, {
        documentId: preapproval._id,
        granteeId: blairId,
        scope: "view",
        expiresAt: Date.now() + 60_000,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("treats an expired grant as no access for open and listMine", async () => {
    const t = await seeded();
    const { preapproval } = await buyerADocs(t);
    const lenderId = await lenderUserId(t);
    await t.run(async (ctx) => {
      const buyer = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_buyer_a"))
        .unique();
      if (buyer === null) {
        throw new Error("buyer missing");
      }
      await ctx.db.insert("documentGrants", {
        documentId: preapproval._id,
        granteeId: lenderId,
        scope: "view",
        expiresAt: Date.now() - 1_000,
        grantedBy: buyer._id,
      });
    });

    const asLender = t.withIdentity({ subject: "clerk_lender" });
    await expect(
      asLender.mutation(api.documents.open, { documentId: preapproval._id }),
    ).rejects.toThrow("FORBIDDEN");
    const listed = await asLender.query(api.documents.listMine, {});
    expect(listed.some((row) => row._id === preapproval._id)).toBe(false);
  });

  it("refuses listGrants for a vendor who already holds an active grant", async () => {
    const t = await seeded();
    const { asBuyer, preapproval } = await buyerADocs(t);
    const lenderId = await lenderUserId(t);
    await asBuyer.mutation(api.documents.grant, {
      documentId: preapproval._id,
      granteeId: lenderId,
      scope: "view",
      expiresAt: Date.now() + 60_000,
    });

    const asLender = t.withIdentity({ subject: "clerk_lender" });
    await expect(
      asLender.query(api.documents.listGrants, { documentId: preapproval._id }),
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
