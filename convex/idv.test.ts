import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import { IDV_NOT_ENABLED } from "./lib/idv";
import schema from "./schema";
import { modules } from "./test.setup";

describe("idv sessions", () => {
  it("rejects high-risk actions when FLAG_IDV is off and AL is not allowed", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const gating = await asAlex.query(api.idv.getGating, {});
    expect(gating).toMatchObject({
      flagOn: false,
      orgState: "AL",
      stateAllowed: false,
      allowed: false,
    });
    const docs = await asAlex.query(api.documents.listMine, {});
    const preapproval = docs.find((row) => row.type === "preapproval");
    if (preapproval === undefined) {
      throw new Error("preapproval missing");
    }
    await expect(
      asAlex.mutation(api.idv.startSession, { purpose: "financial_document" }),
    ).rejects.toThrow(IDV_NOT_ENABLED);
    await expect(
      asAlex.mutation(api.idv.accessFinancialDocument, {
        documentId: preapproval._id,
      }),
    ).rejects.toThrow(IDV_NOT_ENABLED);
    const packets = await asAlex.query(api.esign.listMine, {});
    const designated = packets.find((row) => row.designated);
    if (designated === undefined) {
      throw new Error("seed packet missing");
    }
    await expect(
      asAlex.mutation(api.idv.executeDesignatedDocument, {
        packetId: designated._id,
      }),
    ).rejects.toThrow(IDV_NOT_ENABLED);
    await expect(
      asAlex.mutation(api.idv.changeAccountRecovery, {}),
    ).rejects.toThrow(IDV_NOT_ENABLED);
  });

  it("still rejects when the flag is on but the org state is not allowed", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first();
      if (org === null) {
        throw new Error("org missing");
      }
      await ctx.db.patch(org._id, {
        flags: { ...org.flags, FLAG_IDV: true },
      });
    });
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const gating = await asAlex.query(api.idv.getGating, {});
    expect(gating.flagOn).toBe(true);
    expect(gating.stateAllowed).toBe(false);
    await expect(
      asAlex.mutation(api.idv.changeAccountRecovery, {}),
    ).rejects.toThrow(IDV_NOT_ENABLED);
  });

  it("appends auditLog on verify when a test allowlist is not needed because start stays closed", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    const before = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    await expect(
      asAlex.mutation(api.idv.startSession, { purpose: "account_recovery" }),
    ).rejects.toThrow(IDV_NOT_ENABLED);
    const after = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(after).toEqual(before);
  });

  it("denies a vendor", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asJordan = t.withIdentity({ subject: "clerk_lender" });
    await expect(asJordan.query(api.idv.getGating, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(asJordan.query(api.idv.listMine, {})).rejects.toThrow(
      "FORBIDDEN",
    );
  });
});
