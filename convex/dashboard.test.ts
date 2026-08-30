import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("buyer dashboard", () => {
  it("answers the ten-second test for the seeded buyer", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asBuyerA = t.withIdentity({ subject: "clerk_buyer_a" });

    const view = await asBuyerA.query(api.dashboard.getBuyerDashboard, {});
    expect(view).not.toBeNull();
    expect(view?.where.key).toBe("inspection");
    expect(view?.where.label).toBe("Inspection");
    expect(view?.done).toEqual([
      "Sign purchase agreement",
      "Submit earnest money",
    ]);
    expect(view?.next).toEqual({
      title: "Schedule inspection",
      assigneeRole: "agent",
    });
    expect(view?.waitingOn).toBe("agent");
    expect(view?.owedToday?.amountCents).toBe(45000);
    expect(view?.owedToday?.provenance).toBe("title_issued");
    expect(view?.stages.find((stage) => stage.key === "inspection")?.state).toBe(
      "current",
    );
    expect(view?.stages.find((stage) => stage.key === "under_contract")?.state).toBe(
      "complete",
    );
    expect(view?.stages.find((stage) => stage.key === "appraisal")?.state).toBe(
      "upcoming",
    );
    expect(view?.canAdvance).toBe(false);
    expect(view?.blockingTasks[0]?.title).toBe("Schedule inspection");
    expect(view?.contacts[0]?.name).toBe("Casey Holt");
  });

  it("denies agent, vendor, and unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first();
      if (org === null) {
        throw new Error("missing org");
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

    await expect(t.query(api.dashboard.getBuyerDashboard, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t
        .withIdentity({ subject: "clerk_agent" })
        .query(api.dashboard.getBuyerDashboard, {}),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t
        .withIdentity({ subject: "clerk_vendor" })
        .query(api.dashboard.getBuyerDashboard, {}),
    ).rejects.toThrow("FORBIDDEN");
    await expect(t.query(api.me.getSession, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
  });
});
