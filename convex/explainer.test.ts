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

describe("contract explainer", () => {
  it("routes Ask my agent into the concierge thread with section context", async () => {
    const t = await seeded();
    const asBlair = t.withIdentity({ subject: "clerk_buyer_b" });
    const mine = await asBlair.query(api.explainer.listMine, {});
    if (mine === null) {
      throw new Error("missing explainer");
    }
    expect(mine.sections).toHaveLength(6);
    expect(mine.sections.every((row) => row.askAgent === "Ask my agent")).toBe(
      true,
    );

    const routed = await asBlair.mutation(api.explainer.askAboutSection, {
      transactionId: mine.transactionId,
      sectionId: "earnest-money",
    });
    expect(routed.ok).toBe(true);
    expect(routed.question).toContain("Earnest money");
    expect(routed.question).toContain("This section states");

    const thread = await asBlair.query(api.concierge.listThread, {
      transactionId: mine.transactionId,
    });
    expect(thread.some((row) => row.content.includes("Earnest money"))).toBe(
      true,
    );
    expect(
      thread.some((row) => row.content.includes("This section states")),
    ).toBe(true);

    const asAlex = t.withIdentity({ subject: "clerk_buyer_a" });
    await expect(
      asAlex.mutation(api.explainer.askAboutSection, {
        transactionId: mine.transactionId,
        sectionId: "earnest-money",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
