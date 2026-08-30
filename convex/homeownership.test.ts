import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { SEED_HOMEOWNERSHIP } from "./seedPlan";
import { modules } from "./test.setup";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

async function transactionIdFor(t: ReturnType<typeof convexTest>, clerkId: string) {
  const mine = await t
    .withIdentity({ subject: clerkId })
    .query(api.transactions.listMine, {});
  const first = mine[0];
  if (first === undefined) {
    throw new Error(`${clerkId} transaction missing`);
  }
  return first;
}

describe("homeownership hub", () => {
  it("shows the four post-close surfaces to the closed buyer", async () => {
    const t = await seeded();
    const asIndira = t.withIdentity({ subject: "clerk_buyer_h" });
    const closed = await transactionIdFor(t, "clerk_buyer_h");
    expect(closed.status).toBe("closed");
    expect(closed.stage).toBe("move_in");

    const hub = await asIndira.query(api.homeownership.getHub, {
      transactionId: closed._id,
    });
    expect(hub.status).toBe("closed");
    expect(hub.maintenance.map((row) => row.title)).toEqual(
      expect.arrayContaining(["Replace HVAC filter", "Service HVAC"]),
    );
    expect(hub.warranties.map((row) => row.title)).toEqual(
      expect.arrayContaining(["HVAC manufacturer warranty"]),
    );
    expect(hub.documents.map((row) => row.type)).toEqual(
      expect.arrayContaining(["closing_disclosure", "hvac_warranty"]),
    );
    expect(JSON.stringify(hub).includes("extractedSummary")).toBe(false);
    expect(JSON.stringify(hub)).not.toMatch(/Title issued a \$405,000/);
    const issued = hub.values.find((row) => row.key === "issuedClose");
    const estimated = hub.values.find((row) => row.key === "estimatedMarket");
    const tax = hub.values.find((row) => row.key === "taxAssessed");
    expect(issued?.figure?.provenance).toBe("title_issued");
    expect(issued?.figure?.amountCents).toBe(
      SEED_HOMEOWNERSHIP.values.issued.amountCents,
    );
    expect(estimated?.figure?.provenance).toBe("ai_estimate");
    expect(tax?.figure).toBeNull();
    expect(hub.vendors.every((row) => row.compensationModel === "none")).toBe(
      true,
    );
    expect(hub.vendors.map((row) => row.name)).toContain("Bluff City Air");
  });

  it("denies another buyer, a vendor, and an unauthenticated caller", async () => {
    const t = await seeded();
    const closed = await transactionIdFor(t, "clerk_buyer_h");
    await expect(
      t.query(api.homeownership.getHub, { transactionId: closed._id }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_a" })
        .query(api.homeownership.getHub, { transactionId: closed._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_b" })
        .query(api.homeownership.getHub, { transactionId: closed._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.homeownership.getHub, { transactionId: closed._id }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("does not expose the hub on a non-closed transaction", async () => {
    const t = await seeded();
    const alex = await transactionIdFor(t, "clerk_buyer_a");
    expect(alex.status).toBe("active");
    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_a" })
        .query(api.homeownership.getHub, { transactionId: alex._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_h" })
        .query(api.homeownership.getHub, { transactionId: alex._id }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("keeps retained document open grant-gated", async () => {
    const t = await seeded();
    const asIndira = t.withIdentity({ subject: "clerk_buyer_h" });
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const asJordan = t.withIdentity({ subject: "clerk_lender" });
    const docs = await asIndira.query(api.documents.listMine, {});
    const closing = docs.find((row) => row.type === "closing_disclosure");
    if (closing === undefined) {
      throw new Error("closing disclosure missing");
    }
    const opened = await asIndira.mutation(api.documents.open, {
      documentId: closing._id,
    });
    expect(opened.via).toBe("principal");
    expect(opened.type).toBe("closing_disclosure");
    await expect(
      asAlex.mutation(api.documents.open, { documentId: closing._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asJordan.mutation(api.documents.open, { documentId: closing._id }),
    ).rejects.toThrow("FORBIDDEN");
    const audit = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(audit.some((entry) => entry.action === "document.viewed")).toBe(true);
  });

  it("re-engages a vendor without writing non-none compensation", async () => {
    const t = await seeded();
    const asIndira = t.withIdentity({ subject: "clerk_buyer_h" });
    const asAgent = t.withIdentity({ subject: "clerk_agent" });
    const closed = await transactionIdFor(t, "clerk_buyer_h");
    const hub = await asIndira.query(api.homeownership.getHub, {
      transactionId: closed._id,
    });
    const hvac = hub.vendors.find((row) => row.category === "hvac");
    if (hvac === undefined) {
      throw new Error("hvac vendor missing");
    }
    const vendorId = hvac.vendorId as Id<"vendors">;
    const reengaged = await asIndira.mutation(api.homeownership.reengageVendor, {
      transactionId: closed._id,
      vendorId,
    });
    expect(reengaged.compensationModel).toBe("none");
    await expect(
      asAgent.mutation(api.vendors.updateCompensation, {
        vendorId,
        compensationModel: "referral",
      }),
    ).rejects.toThrow("FORBIDDEN");
    const stored = await t.run(async (ctx) => ctx.db.get(vendorId));
    expect(stored?.compensationModel).toBe("none");
    const flags = await asAgent.query(api.orgs.getFlags, {});
    expect(flags.FLAG_MLS).toBe(false);
    expect(flags.FLAG_VENDOR_COMP).toBe(false);
    expect(flags.FLAG_ESIGN).toBe(false);
    expect(flags.FLAG_IDV).toBe(false);
    const audit = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(
      audit.some((entry) => entry.action === "homeownership.vendor_reengaged"),
    ).toBe(true);
  });
});
