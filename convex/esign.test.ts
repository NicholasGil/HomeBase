import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import { ESIGN_NOT_ENABLED } from "./lib/esign";
import schema from "./schema";
import { modules } from "./test.setup";

async function alexIds(t: ReturnType<typeof convexTest>) {
  const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
  const docs = await asAlex.query(api.documents.listMine, {});
  const purchase = docs.find((row) => row.type === "purchase_agreement");
  if (purchase === undefined) {
    throw new Error("seed purchase agreement missing");
  }
  return {
    asAlex,
    transactionId: purchase.transactionId,
    documentId: purchase._id,
  };
}

describe("esign packets", () => {
  it("rejects provider send and sign while FLAG_ESIGN is off", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const { asAlex, transactionId, documentId } = await alexIds(t);
    const prepared = await asAlex.mutation(api.esign.prepare, {
      transactionId,
      documentId,
    });
    await asAlex.mutation(api.esign.attachExplain, {
      packetId: prepared.packetId,
    });
    const asCasey = t.withIdentity({ subject: "clerk_agent" });
    await asCasey.mutation(api.esign.submitAgentReview, {
      packetId: prepared.packetId,
    });
    await asAlex.mutation(api.esign.submitBuyerReview, {
      packetId: prepared.packetId,
    });
    await asAlex.mutation(api.esign.verifyPacket, {
      packetId: prepared.packetId,
    });
    await expect(
      asAlex.mutation(api.esign.sendToProvider, {
        packetId: prepared.packetId,
      }),
    ).rejects.toThrow(ESIGN_NOT_ENABLED);
    const flags = await asAlex.query(api.orgs.getFlags, {});
    expect(flags.FLAG_ESIGN).toBe(false);

    await t.run(async (ctx) => {
      await ctx.db.patch(prepared.packetId, {
        status: "sign",
        providerRef: "sandbox:packet:forced",
      });
    });
    await expect(
      asAlex.mutation(api.esign.signWithProvider, {
        packetId: prepared.packetId,
      }),
    ).rejects.toThrow(ESIGN_NOT_ENABLED);
  });

  it("appends auditLog on verify and never patches it", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const { asAlex, transactionId, documentId } = await alexIds(t);
    const prepared = await asAlex.mutation(api.esign.prepare, {
      transactionId,
      documentId,
    });
    await asAlex.mutation(api.esign.attachExplain, {
      packetId: prepared.packetId,
    });
    await t.withIdentity({ subject: "clerk_agent" }).mutation(
      api.esign.submitAgentReview,
      { packetId: prepared.packetId },
    );
    await asAlex.mutation(api.esign.submitBuyerReview, {
      packetId: prepared.packetId,
    });
    const before = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    await asAlex.mutation(api.esign.verifyPacket, {
      packetId: prepared.packetId,
    });
    const after = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(after.length).toBe(before.length + 1);
    const latest = after[after.length - 1];
    expect(latest?.action).toBe("esign.verified");
    expect(latest?.targetType).toBe("signaturePacket");
    expect(before.map((row) => row._id)).not.toContain(latest?._id);
    for (const prior of before) {
      const still = after.find((row) => row._id === prior._id);
      expect(still).toEqual(prior);
    }
  });

  it("walks the sandbox path when FLAG_ESIGN is on and appends sign audit", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const { asAlex, transactionId, documentId } = await alexIds(t);
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first();
      if (org === null) {
        throw new Error("org missing");
      }
      await ctx.db.patch(org._id, {
        flags: { ...org.flags, FLAG_ESIGN: true },
      });
    });
    const prepared = await asAlex.mutation(api.esign.prepare, {
      transactionId,
      documentId,
    });
    expect(prepared.designated).toBe(true);
    await asAlex.mutation(api.esign.attachExplain, {
      packetId: prepared.packetId,
    });
    await t
      .withIdentity({ subject: "clerk_agent" })
      .mutation(api.esign.submitAgentReview, { packetId: prepared.packetId });
    await asAlex.mutation(api.esign.submitBuyerReview, {
      packetId: prepared.packetId,
    });
    await asAlex.mutation(api.esign.verifyPacket, {
      packetId: prepared.packetId,
    });
    await expect(
      asAlex.mutation(api.esign.sendToProvider, {
        packetId: prepared.packetId,
      }),
    ).resolves.toMatchObject({ status: "sign" });
    await expect(
      asAlex.mutation(api.esign.signWithProvider, {
        packetId: prepared.packetId,
      }),
    ).rejects.toThrow("IDV_NOT_ENABLED");

    const inspection = await asAlex.query(api.documents.listMine, {});
    const report = inspection.find((row) => row.type === "inspection_report");
    if (report === undefined) {
      throw new Error("inspection report missing");
    }
    const openPacket = await asAlex.mutation(api.esign.prepare, {
      transactionId,
      documentId: report._id,
    });
    expect(openPacket.designated).toBe(false);
    await asAlex.mutation(api.esign.attachExplain, {
      packetId: openPacket.packetId,
    });
    await t
      .withIdentity({ subject: "clerk_agent" })
      .mutation(api.esign.submitAgentReview, { packetId: openPacket.packetId });
    await asAlex.mutation(api.esign.submitBuyerReview, {
      packetId: openPacket.packetId,
    });
    await asAlex.mutation(api.esign.verifyPacket, {
      packetId: openPacket.packetId,
    });
    const sent = await asAlex.mutation(api.esign.sendToProvider, {
      packetId: openPacket.packetId,
    });
    expect(sent.providerRef.startsWith("sandbox:packet:")).toBe(true);
    const beforeSign = await t.run(async (ctx) =>
      ctx.db.query("auditLog").collect(),
    );
    await asAlex.mutation(api.esign.signWithProvider, {
      packetId: openPacket.packetId,
    });
    const afterSign = await t.run(async (ctx) =>
      ctx.db.query("auditLog").collect(),
    );
    expect(afterSign.length).toBe(beforeSign.length + 1);
    expect(afterSign[afterSign.length - 1]?.action).toBe("esign.signed");
    const stored = await asAlex.mutation(api.esign.storeSigned, {
      packetId: openPacket.packetId,
    });
    const opened = await asAlex.mutation(api.documents.open, {
      documentId: stored.storedDocumentId,
    });
    expect(opened.type).toBe("inspection_report");
  });

  it("denies a stranger on list and get", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const { asAlex, transactionId, documentId } = await alexIds(t);
    const prepared = await asAlex.mutation(api.esign.prepare, {
      transactionId,
      documentId,
    });
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    await expect(
      asBlair.query(api.esign.getPacket, { packetId: prepared.packetId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asBlair.query(api.esign.listForTransaction, { transactionId }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
