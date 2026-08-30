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

async function alexTransactionId(t: ReturnType<typeof convexTest>) {
  const mine = await t
    .withIdentity({ subject: "clerk_buyer_a" })
    .query(api.transactions.listMine, {});
  const first = mine[0];
  if (first === undefined) {
    throw new Error("alex transaction missing");
  }
  return first._id;
}

async function blairTransactionId(t: ReturnType<typeof convexTest>) {
  const mine = await t
    .withIdentity({ subject: "clerk_buyer_b" })
    .query(api.transactions.listMine, {});
  const first = mine[0];
  if (first === undefined) {
    throw new Error("blair transaction missing");
  }
  return first._id;
}

async function jordanAssignmentId(t: ReturnType<typeof convexTest>) {
  const portal = await t
    .withIdentity({ subject: "clerk_lender" })
    .query(api.vendors.getPortal, {});
  const first = portal.assignments[0];
  if (first === undefined) {
    throw new Error("jordan assignment missing");
  }
  return first.assignmentId;
}

describe("vendor directory", () => {
  it("surfaces inspectors for an inspection-stage buyer and hides them on showings", async () => {
    const t = await seeded();
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const alexId = await alexTransactionId(t);
    const blairId = await blairTransactionId(t);

    const inspection = await asAlex.query(api.vendors.listForStage, {
      transactionId: alexId,
    });
    expect(inspection.stage).toBe("inspection");
    expect(inspection.categories).toContain("inspectors");
    expect(inspection.vendors.map((row) => row.name)).toEqual(
      expect.arrayContaining(["Riley Brooks", "Sam Okonkwo"]),
    );
    expect(
      inspection.vendors.every((row) => row.compensationModel === "none"),
    ).toBe(true);

    const showings = await asBlair.query(api.vendors.listForStage, {
      transactionId: blairId,
    });
    expect(showings.stage).toBe("showings");
    expect(showings.vendors).toEqual([]);
  });

  it("compares two inspectors on the assigned file", async () => {
    const t = await seeded();
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const alexId = await alexTransactionId(t);
    const directory = await asAlex.query(api.vendors.listForStage, {
      transactionId: alexId,
    });
    const inspectors = directory.vendors.filter(
      (row) => row.category === "inspectors",
    );
    const first = inspectors[0];
    const second = inspectors[1];
    if (first === undefined || second === undefined) {
      throw new Error("need two inspectors");
    }
    const compared = await asAlex.query(api.vendors.compare, {
      transactionId: alexId,
      vendorIds: [first._id, second._id],
    });
    expect(compared.vendors.map((row) => row.name).sort()).toEqual(
      ["Riley Brooks", "Sam Okonkwo"].sort(),
    );
  });

  it("lets a buyer request an inspector appointment", async () => {
    const t = await seeded();
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const alexId = await alexTransactionId(t);
    const directory = await asAlex.query(api.vendors.listForStage, {
      transactionId: alexId,
    });
    const riley = directory.vendors.find((row) => row.name === "Riley Brooks");
    if (riley === undefined) {
      throw new Error("riley missing");
    }
    const requested = await asAlex.mutation(api.vendors.requestAppointment, {
      transactionId: alexId,
      vendorId: riley._id,
      startsAt: Date.now() + 86_400_000,
      endsAt: Date.now() + 86_400_000 + 7_200_000,
    });
    const assignments = await asAlex.query(
      api.vendors.listAssignmentsForTransaction,
      { transactionId: alexId },
    );
    expect(
      assignments.some((row) => row.assignmentId === requested.assignmentId),
    ).toBe(true);
  });
});

describe("vendor portal scope", () => {
  it("shows Jordan only the Rivera assignment and granted documents", async () => {
    const t = await seeded();
    const asJordan = t.withIdentity({ subject: "clerk_lender" });
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const portal = await asJordan.query(api.vendors.getPortal, {});
    expect(portal.assignments).toHaveLength(1);
    expect(portal.assignments[0]?.transaction.stage).toBe("inspection");
    expect(portal.assignments[0]?.transaction.propertyCity).toBe("Huntsville");
    expect(portal.vendor?.compensationModel).toBe("none");

    const assignmentId = await jordanAssignmentId(t);
    const granted = await asJordan.query(api.vendors.listGrantedDocuments, {
      assignmentId,
    });
    expect(granted).toEqual([]);

    const docs = await asAlex.query(api.documents.listMine, {});
    const preapproval = docs.find((row) => row.type === "preapproval");
    const inspection = docs.find((row) => row.type === "inspection_report");
    if (preapproval === undefined || inspection === undefined) {
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
    await asAlex.mutation(api.documents.grant, {
      documentId: preapproval._id,
      granteeId: lenderId,
      scope: "view",
      expiresAt: Date.now() + 60_000,
    });

    const afterGrant = await asJordan.query(api.vendors.listGrantedDocuments, {
      assignmentId,
    });
    expect(afterGrant.map((row) => row.type)).toEqual(["preapproval"]);
    expect(afterGrant.every((row) => !("extractedSummary" in row))).toBe(true);

    await expect(
      asJordan.mutation(api.documents.open, { documentId: inspection._id }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("lets the assigned vendor message, schedule, request a document, upload, and complete", async () => {
    const t = await seeded();
    const asJordan = t.withIdentity({ subject: "clerk_lender" });
    const assignmentId = await jordanAssignmentId(t);

    await asJordan.mutation(api.vendors.sendMessage, {
      assignmentId,
      body: "I can review the preapproval tomorrow.",
    });
    const messages = await asJordan.query(api.vendors.listMessages, {
      assignmentId,
    });
    expect(messages[0]?.body).toContain("preapproval");

    await asJordan.mutation(api.vendors.schedule, {
      assignmentId,
      startsAt: Date.now() + 3_600_000,
      endsAt: Date.now() + 7_200_000,
    });
    await asJordan.mutation(api.vendors.requestDocument, {
      assignmentId,
      documentType: "preapproval",
    });
    const uploaded = await asJordan.mutation(api.vendors.uploadWorkProduct, {
      assignmentId,
      kind: "invoice",
      fileName: "inspection-invoice.pdf",
    });
    expect(uploaded.type).toBe("invoice");
    const granted = await asJordan.query(api.vendors.listGrantedDocuments, {
      assignmentId,
    });
    expect(granted.map((row) => row.type)).toContain("invoice");
    expect(granted.every((row) => !("extractedSummary" in row))).toBe(true);

    await asJordan.mutation(api.vendors.markComplete, { assignmentId });
    await expect(
      asJordan.query(api.vendors.getAssignment, { assignmentId }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("denies the next query after assignment expiry", async () => {
    const t = await seeded();
    const assignmentId = await jordanAssignmentId(t);
    await t.run(async (ctx) => {
      await ctx.db.patch(assignmentId, { expiresAt: Date.now() - 1 });
    });
    const asJordan = t.withIdentity({ subject: "clerk_lender" });
    await expect(
      asJordan.query(api.vendors.getAssignment, { assignmentId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asJordan.query(api.vendors.listGrantedDocuments, { assignmentId }),
    ).rejects.toThrow("FORBIDDEN");
    const portal = await asJordan.query(api.vendors.getPortal, {});
    expect(portal.assignments).toEqual([]);
  });
});

describe("vendor isolation", () => {
  it("blocks cross-client directory and portal reads", async () => {
    const t = await seeded();
    const alexId = await alexTransactionId(t);
    const blairId = await blairTransactionId(t);
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const asJordan = t.withIdentity({ subject: "clerk_lender" });

    await expect(
      asAlex.query(api.vendors.listForStage, { transactionId: blairId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asBlair.query(api.vendors.listForStage, { transactionId: alexId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asJordan.query(api.vendors.listForStage, { transactionId: alexId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asJordan.query(api.vendors.listAssignmentsForTransaction, {
        transactionId: alexId,
      }),
    ).rejects.toThrow("FORBIDDEN");

    const assignmentId = await jordanAssignmentId(t);
    await expect(
      asBlair.query(api.vendors.listMessages, { assignmentId }),
    ).rejects.toThrow("FORBIDDEN");

    const portal = await asJordan.query(api.vendors.getPortal, {});
    expect(
      portal.assignments.every(
        (row) => row.transaction.transactionId !== blairId,
      ),
    ).toBe(true);
  });

  it("denies an unassigned same-org vendor", async () => {
    const t = await seeded();
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first();
      if (org === null) {
        throw new Error("org missing");
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
    const asDevon = t.withIdentity({ subject: "clerk_vendor" });
    const portal = await asDevon.query(api.vendors.getPortal, {});
    expect(portal.assignments).toEqual([]);
    const assignmentId = await jordanAssignmentId(t);
    await expect(
      asDevon.query(api.vendors.getAssignment, { assignmentId }),
    ).rejects.toThrow("FORBIDDEN");
  });
});

describe("compensation pin", () => {
  it("rejects a non-none compensation write while FLAG_VENDOR_COMP is off", async () => {
    const t = await seeded();
    const asAgent = t.withIdentity({ subject: "clerk_agent" });
    await expect(
      asAgent.mutation(api.vendors.create, {
        category: "inspectors",
        name: "Paid Inspector",
        compensationModel: "referral",
      }),
    ).rejects.toThrow("FORBIDDEN");

    const created = await asAgent.mutation(api.vendors.create, {
      category: "inspectors",
      name: "Unpaid Inspector",
      compensationModel: "none",
    });
    await expect(
      asAgent.mutation(api.vendors.updateCompensation, {
        vendorId: created,
        compensationModel: "flat_fee",
      }),
    ).rejects.toThrow("FORBIDDEN");

    const flags = await asAgent.query(api.orgs.getFlags, {});
    expect(flags.FLAG_VENDOR_COMP).toBe(false);
    const stored = await t.run(async (ctx) => ctx.db.get(created));
    expect(stored?.compensationModel).toBe("none");
  });

  it("denies buyer and vendor compensation writes", async () => {
    const t = await seeded();
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const asJordan = t.withIdentity({ subject: "clerk_lender" });
    await expect(
      asAlex.mutation(api.vendors.create, {
        category: "inspectors",
        name: "Buyer Vendor",
        compensationModel: "none",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asJordan.mutation(api.vendors.create, {
        category: "inspectors",
        name: "Self Vendor",
        compensationModel: "none",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
