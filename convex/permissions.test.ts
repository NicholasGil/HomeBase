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
  "concierge.gatherContext",
  "concierge.listThread",
  "tours.listCandidates",
  "tours.listMine",
  "tours.get",
  "offers.getMine",
  "offers.getCenter",
  "offers.simulate",
  "explainer.listMine",
  "explainer.listSections",
  "commandCenter.getMine",
  "vendors.listDirectory",
  "vendors.listForStage",
  "vendors.compare",
  "vendors.listAssignmentsForTransaction",
  "vendors.getPortal",
  "vendors.getAssignment",
  "vendors.listMessages",
  "vendors.listDocumentRequests",
  "vendors.listGrantedDocuments",
  "esign.listMine",
  "esign.listForTransaction",
  "esign.getPacket",
  "idv.listMine",
  "idv.getGating",
  "search.run",
  "homeownership.getHub",
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
    expect(READ_FUNCTIONS).toHaveLength(42);
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
    ["concierge.gatherContext", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.concierge.gatherContext, { transactionId: id });
    }],
    ["concierge.listThread", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.concierge.listThread, { transactionId: id });
    }],
    ["tours.listCandidates", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.tours.listCandidates, {})],
    ["tours.listMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.tours.listMine, {})],
    ["tours.get", async (t: ReturnType<typeof convexTest>) => {
      const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
      const candidates = await asBlair.query(api.tours.listCandidates, {});
      const built = await asBlair.mutation(api.tours.build, {
        propertyIds: candidates.map((row) => row._id),
      });
      return t.query(api.tours.get, { tourId: built.tourId });
    }],
    ["offers.getMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.offers.getMine, {})],
    ["offers.getCenter", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.offers.getCenter, { transactionId: id });
    }],
    ["offers.simulate", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.offers.simulate, {
        transactionId: id,
        purchasePriceCents: 41000000,
        downPaymentCents: 8200000,
        sellerConcessionsCents: 0,
        rateBps: 675,
        program: "conventional",
      });
    }],
    ["explainer.listMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.explainer.listMine, {})],
    ["explainer.listSections", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.explainer.listSections, { transactionId: id });
    }],
    ["commandCenter.getMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.commandCenter.getMine, {})],
    ["vendors.listDirectory", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.vendors.listDirectory, {})],
    ["vendors.listForStage", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.vendors.listForStage, { transactionId: id });
    }],
    ["vendors.compare", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      const directory = await t
        .withIdentity({ subject: "clerk_buyer_a" })
        .query(api.vendors.listForStage, { transactionId: id });
      const first = directory.vendors[0];
      if (first === undefined) {
        throw new Error("seed vendors missing");
      }
      return t.query(api.vendors.compare, {
        transactionId: id,
        vendorIds: [first._id],
      });
    }],
    ["vendors.listAssignmentsForTransaction", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.vendors.listAssignmentsForTransaction, {
        transactionId: id,
      });
    }],
    ["vendors.getPortal", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.vendors.getPortal, {})],
    ["vendors.getAssignment", async (t: ReturnType<typeof convexTest>) => {
      const portal = await t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.vendors.getPortal, {});
      const first = portal.assignments[0];
      if (first === undefined) {
        throw new Error("seed assignment missing");
      }
      return t.query(api.vendors.getAssignment, {
        assignmentId: first.assignmentId,
      });
    }],
    ["vendors.listMessages", async (t: ReturnType<typeof convexTest>) => {
      const portal = await t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.vendors.getPortal, {});
      const first = portal.assignments[0];
      if (first === undefined) {
        throw new Error("seed assignment missing");
      }
      return t.query(api.vendors.listMessages, {
        assignmentId: first.assignmentId,
      });
    }],
    ["vendors.listDocumentRequests", async (t: ReturnType<typeof convexTest>) => {
      const portal = await t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.vendors.getPortal, {});
      const first = portal.assignments[0];
      if (first === undefined) {
        throw new Error("seed assignment missing");
      }
      return t.query(api.vendors.listDocumentRequests, {
        assignmentId: first.assignmentId,
      });
    }],
    ["vendors.listGrantedDocuments", async (t: ReturnType<typeof convexTest>) => {
      const portal = await t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.vendors.getPortal, {});
      const first = portal.assignments[0];
      if (first === undefined) {
        throw new Error("seed assignment missing");
      }
      return t.query(api.vendors.listGrantedDocuments, {
        assignmentId: first.assignmentId,
      });
    }],
    ["esign.listMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.esign.listMine, {})],
    ["esign.listForTransaction", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.esign.listForTransaction, { transactionId: id });
    }],
    ["esign.getPacket", async (t: ReturnType<typeof convexTest>) => {
      const packets = await t
        .withIdentity({ subject: "clerk_buyer_a" })
        .query(api.esign.listMine, {});
      const first = packets[0];
      if (first === undefined) {
        throw new Error("seed packet missing");
      }
      return t.query(api.esign.getPacket, { packetId: first._id });
    }],
    ["idv.listMine", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.idv.listMine, {})],
    ["idv.getGating", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.idv.getGating, {})],
    ["search.run", async (t: ReturnType<typeof convexTest>) =>
      t.query(api.search.run, {})],
    ["homeownership.getHub", async (t: ReturnType<typeof convexTest>) => {
      const id = await buyerATransactionId(t);
      return t.query(api.homeownership.getHub, { transactionId: id });
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
    ["vendors.getPortal", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.vendors.getPortal, {}), false],
    ["vendors.listDirectory", async (asVendor: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) =>
      asVendor.query(api.vendors.listDirectory, {}), true],
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
    await expect(
      asVendor.query(api.concierge.gatherContext, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.concierge.listThread, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.mutation(api.concierge.appendTurn, {
        transactionId: id,
        question: "what happens next",
        answer: "Next is Schedule inspection.",
        kind: "answer",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.mutation(api.concierge.ask, {
        transactionId: id,
        question: "what did the inspection find",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.mutation(api.concierge.loadInspectionFindings, {
        transactionId: id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asVendor.query(api.tours.listCandidates, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asVendor.query(api.tours.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const candidates = await asBlair.query(api.tours.listCandidates, {});
    const built = await asBlair.mutation(api.tours.build, {
      propertyIds: candidates.map((row) => row._id),
    });
    await expect(
      asVendor.query(api.tours.get, { tourId: built.tourId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asVendor.query(api.offers.getMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asVendor.query(api.offers.getCenter, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.offers.simulate, {
        transactionId: id,
        purchasePriceCents: 41000000,
        downPaymentCents: 8200000,
        sellerConcessionsCents: 0,
        rateBps: 675,
        program: "conventional",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.mutation(api.offers.ensureDraft, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    const alexOffer = await t
      .withIdentity({ subject: "clerk_buyer_a" })
      .query(api.offers.getMine, {});
    const offerId = alexOffer?.offer?._id;
    if (offerId === undefined) {
      throw new Error("seed offer missing");
    }
    await expect(
      asVendor.mutation(api.offers.submit, { offerId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.mutation(api.offers.review, { offerId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asVendor.query(api.explainer.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asVendor.query(api.explainer.listSections, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.mutation(api.explainer.askAboutSection, {
        transactionId: id,
        sectionId: "earnest-money",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asVendor.query(api.commandCenter.getMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asVendor.query(api.vendors.listDirectory, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asVendor.query(api.vendors.listForStage, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.vendors.listAssignmentsForTransaction, {
        transactionId: id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    const alexDirectory = await t
      .withIdentity({ subject: "clerk_buyer_a" })
      .query(api.vendors.listForStage, { transactionId: id });
    const firstVendor = alexDirectory.vendors[0];
    if (firstVendor === undefined) {
      throw new Error("seed vendors missing");
    }
    await expect(
      asVendor.query(api.vendors.compare, {
        transactionId: id,
        vendorIds: [firstVendor._id],
      }),
    ).rejects.toThrow("FORBIDDEN");
    const jordanPortal = await t
      .withIdentity({ subject: "clerk_lender" })
      .query(api.vendors.getPortal, {});
    const jordanAssignment = jordanPortal.assignments[0];
    if (jordanAssignment === undefined) {
      throw new Error("seed assignment missing");
    }
    await expect(
      asVendor.query(api.vendors.getAssignment, {
        assignmentId: jordanAssignment.assignmentId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.vendors.listMessages, {
        assignmentId: jordanAssignment.assignmentId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.vendors.listDocumentRequests, {
        assignmentId: jordanAssignment.assignmentId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asVendor.query(api.vendors.listGrantedDocuments, {
        assignmentId: jordanAssignment.assignmentId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asVendor.query(api.esign.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asVendor.query(api.esign.listForTransaction, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    const vendorPackets = await t
      .withIdentity({ subject: "clerk_buyer_a" })
      .query(api.esign.listMine, {});
    const vendorPacket = vendorPackets[0];
    if (vendorPacket === undefined) {
      throw new Error("seed packet missing");
    }
    await expect(
      asVendor.query(api.esign.getPacket, { packetId: vendorPacket._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asVendor.query(api.idv.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asVendor.query(api.idv.getGating, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asVendor.query(api.search.run, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asVendor.query(api.homeownership.getHub, { transactionId: id }),
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
    const id = await buyerATransactionId(t);
    await expect(
      asStranger.query(api.concierge.gatherContext, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.query(api.concierge.listThread, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.mutation(api.concierge.appendTurn, {
        transactionId: id,
        question: "what happens next",
        answer: "Next is Schedule inspection.",
        kind: "answer",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.mutation(api.concierge.ask, {
        transactionId: id,
        question: "what did the inspection find",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.mutation(api.concierge.loadInspectionFindings, {
        transactionId: id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asStranger.query(api.tours.listCandidates, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.tours.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const candidates = await asBlair.query(api.tours.listCandidates, {});
    const built = await asBlair.mutation(api.tours.build, {
      propertyIds: candidates.map((row) => row._id),
    });
    await expect(
      asStranger.query(api.tours.get, { tourId: built.tourId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asStranger.query(api.offers.getMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asStranger.query(api.offers.getCenter, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.query(api.offers.simulate, {
        transactionId: id,
        purchasePriceCents: 41000000,
        downPaymentCents: 8200000,
        sellerConcessionsCents: 0,
        rateBps: 675,
        program: "conventional",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.mutation(api.offers.ensureDraft, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    const alexOffer = await t
      .withIdentity({ subject: "clerk_buyer_a" })
      .query(api.offers.getMine, {});
    const offerId = alexOffer?.offer?._id;
    if (offerId === undefined) {
      throw new Error("seed offer missing");
    }
    await expect(
      asStranger.mutation(api.offers.submit, { offerId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.mutation(api.offers.review, { offerId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asStranger.query(api.explainer.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asStranger.query(api.explainer.listSections, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.mutation(api.explainer.askAboutSection, {
        transactionId: id,
        sectionId: "earnest-money",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.query(api.commandCenter.getMine, {}),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asStranger.query(api.vendors.listDirectory, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.vendors.getPortal, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asStranger.query(api.vendors.listForStage, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.query(api.vendors.listAssignmentsForTransaction, {
        transactionId: id,
      }),
    ).rejects.toThrow("FORBIDDEN");
    const strangerDirectory = await t
      .withIdentity({ subject: "clerk_buyer_a" })
      .query(api.vendors.listForStage, { transactionId: id });
    const strangerVendor = strangerDirectory.vendors[0];
    if (strangerVendor === undefined) {
      throw new Error("seed vendors missing");
    }
    await expect(
      asStranger.query(api.vendors.compare, {
        transactionId: id,
        vendorIds: [strangerVendor._id],
      }),
    ).rejects.toThrow("FORBIDDEN");
    const strangerPortal = await t
      .withIdentity({ subject: "clerk_lender" })
      .query(api.vendors.getPortal, {});
    const strangerAssignment = strangerPortal.assignments[0];
    if (strangerAssignment === undefined) {
      throw new Error("seed assignment missing");
    }
    await expect(
      asStranger.query(api.vendors.getAssignment, {
        assignmentId: strangerAssignment.assignmentId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.query(api.vendors.listMessages, {
        assignmentId: strangerAssignment.assignmentId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.query(api.vendors.listDocumentRequests, {
        assignmentId: strangerAssignment.assignmentId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asStranger.query(api.vendors.listGrantedDocuments, {
        assignmentId: strangerAssignment.assignmentId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asStranger.query(api.esign.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asStranger.query(api.esign.listForTransaction, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
    const strangerPackets = await t
      .withIdentity({ subject: "clerk_buyer_a" })
      .query(api.esign.listMine, {});
    const strangerPacket = strangerPackets[0];
    if (strangerPacket === undefined) {
      throw new Error("seed packet missing");
    }
    await expect(
      asStranger.query(api.esign.getPacket, { packetId: strangerPacket._id }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(asStranger.query(api.idv.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.idv.getGating, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asStranger.query(api.search.run, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      asStranger.query(api.homeownership.getHub, { transactionId: id }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("denies homeownership.getHub to another buyer, a vendor, and a non-closed transaction", async () => {
    const t = await seeded();
    const asClosed = t.withIdentity({ subject: "clerk_buyer_h" });
    const closed = await asClosed.query(api.transactions.listMine, {});
    const closedId = closed[0]?._id;
    if (closedId === undefined) {
      throw new Error("closed transaction missing");
    }
    const activeId = await buyerATransactionId(t);
    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_a" })
        .query(api.homeownership.getHub, { transactionId: closedId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_vendor" })
        .query(api.homeownership.getHub, { transactionId: closedId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_buyer_a" })
        .query(api.homeownership.getHub, { transactionId: activeId }),
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
