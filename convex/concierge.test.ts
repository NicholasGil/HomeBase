import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

const INSPECTION_FINDINGS = "Roof and HVAC need service";

async function seeded() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
}

async function alexAndBlairIds(t: ReturnType<typeof convexTest>) {
  const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
  const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
  const alex = await asAlex.query(api.transactions.listMine, {});
  const blair = await asBlair.query(api.transactions.listMine, {});
  const alexId = alex[0]?._id;
  const blairId = blair[0]?._id;
  if (alexId === undefined || blairId === undefined) {
    throw new Error("seed transactions missing");
  }
  return { asAlex, asBlair, alexId, blairId };
}

function expectNoFindingsText(value: unknown) {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain(INSPECTION_FINDINGS);
  expect(serialized).not.toContain("extractedSummary");
  expect(serialized).not.toContain("structural defects");
}

async function expectNoFindingsViaConcierge(
  identity: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
  transactionId: Awaited<ReturnType<typeof alexAndBlairIds>>["alexId"],
) {
  await expect(
    identity.query(api.concierge.gatherContext, { transactionId }),
  ).rejects.toThrow("FORBIDDEN");
  await expect(
    identity.query(api.concierge.listThread, { transactionId }),
  ).rejects.toThrow("FORBIDDEN");
  await expect(
    identity.mutation(api.concierge.ask, {
      transactionId,
      question: "what did the inspection find",
    }),
  ).rejects.toThrow("FORBIDDEN");
  await expect(
    identity.mutation(api.concierge.loadInspectionFindings, { transactionId }),
  ).rejects.toThrow("FORBIDDEN");
}

describe("concierge scope", () => {
  it("gathers only this transaction's facts and denies other files", async () => {
    const t = await seeded();
    const { asAlex, alexId, blairId } = await alexAndBlairIds(t);

    const facts = await asAlex.query(api.concierge.gatherContext, {
      transactionId: alexId,
    });
    const keys = facts.map((fact) => fact.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "next",
        "inspection_when",
        "missing",
        "cash",
        "inspection_findings",
        "counteroffer",
        "lender",
        "first_showing",
      ]),
    );
    expect(facts.find((fact) => fact.key === "next")?.text).toContain(
      "Schedule inspection",
    );
    expect(facts.find((fact) => fact.key === "cash")?.amountCents).toBe(45000);
    expect(facts.find((fact) => fact.key === "cash")?.provenance).toBe(
      "title_issued",
    );
    expect(facts.find((fact) => fact.key === "lender")?.text).toContain(
      "Jordan Hale",
    );
    expect(facts.find((fact) => fact.key === "inspection_findings")?.text).toBe(
      "inspection_report",
    );
    expectNoFindingsText(facts);

    await expect(
      asAlex.query(api.concierge.gatherContext, { transactionId: blairId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.query(api.concierge.gatherContext, { transactionId: alexId }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      t
        .withIdentity({ subject: "clerk_lender" })
        .query(api.concierge.gatherContext, { transactionId: alexId }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("does not return inspection findings text without document access", async () => {
    const t = await seeded();
    const { asAlex, asBlair, alexId } = await alexAndBlairIds(t);
    const asLender = t.withIdentity({ subject: "clerk_lender" });

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
    const docs = await asAlex.query(api.documents.listMine, {});
    const preapproval = docs.find((row) => row.type === "preapproval");
    if (preapproval === undefined) {
      throw new Error("seed documents missing");
    }
    await asAlex.mutation(api.documents.grant, {
      documentId: preapproval._id,
      granteeId: lenderId,
      scope: "view",
      expiresAt: Date.now() + 60_000,
    });

    const listed = await asLender.query(api.documents.listMine, {});
    expect(listed.map((row) => row.type)).toEqual(["preapproval"]);
    expect(listed[0]?.transactionId).toBe(alexId);

    await expectNoFindingsViaConcierge(asLender, alexId);
    await expectNoFindingsViaConcierge(asBlair, alexId);

    const facts = await asAlex.query(api.concierge.gatherContext, {
      transactionId: alexId,
    });
    expect(facts.find((fact) => fact.key === "inspection_findings")?.text).toBe(
      "inspection_report",
    );
    expectNoFindingsText(facts);

    const thread = await asAlex.query(api.concierge.listThread, {
      transactionId: alexId,
    });
    expectNoFindingsText(thread);

    const asked = await asAlex.mutation(api.concierge.ask, {
      transactionId: alexId,
      question: "what did the inspection find",
    });
    expect(
      asked.facts.find((fact) => fact.key === "inspection_findings")?.text,
    ).toContain(INSPECTION_FINDINGS);

    const loaded = await asAlex.mutation(api.concierge.loadInspectionFindings, {
      transactionId: alexId,
    });
    expect(loaded.found).toBe(true);
    if (loaded.found) {
      expect(loaded.text).toContain(INSPECTION_FINDINGS);
    }

    await asAlex.mutation(api.concierge.appendTurn, {
      transactionId: alexId,
      question: "what did the inspection find",
      answer: `${INSPECTION_FINDINGS}. No structural defects noted.`,
      kind: "answer",
    });
    await expectNoFindingsViaConcierge(asLender, alexId);
    await expectNoFindingsViaConcierge(asBlair, alexId);

    const audit = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(
      audit.filter((entry) => entry.action === "document.viewed").length,
    ).toBeGreaterThan(0);
  });

  it("denies vendor and stranger on appendTurn", async () => {
    const t = await seeded();
    const { alexId } = await alexAndBlairIds(t);
    const turn = {
      transactionId: alexId,
      question: "what happens next",
      answer: "Next is Schedule inspection.",
      kind: "answer" as const,
    };
    await expect(
      t
        .withIdentity({ subject: "clerk_lender" })
        .mutation(api.concierge.appendTurn, turn),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_stranger" })
        .mutation(api.concierge.appendTurn, turn),
    ).rejects.toThrow("FORBIDDEN");
    await expect(t.mutation(api.concierge.appendTurn, turn)).rejects.toThrow(
      "UNAUTHENTICATED",
    );
  });
});
