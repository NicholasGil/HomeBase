import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import { PATH_B_PREVIEW_ORG_NAME } from "./lib/pathBOrg";
import schema from "./schema";
import { modules } from "./test.setup";

describe("users.ensureBuyer", () => {
  it("provisions a new Clerk buyer and is idempotent", async () => {
    const t = convexTest(schema, modules);
    const asNew = t.withIdentity({
      subject: "clerk_path_b_new",
      email: "new.buyer@example.com",
      name: "New Buyer",
    });

    const first = await asNew.mutation(api.users.ensureBuyer, {});
    expect(first.created).toBe(true);

    const session = await asNew.query(api.me.getSession, {});
    expect(session.role).toBe("buyer");
    expect(session.name).toBe("New Buyer");

    const dashboard = await asNew.query(api.dashboard.getBuyerDashboard, {});
    expect(dashboard).toBeNull();

    const second = await asNew.mutation(api.users.ensureBuyer, {});
    expect(second.created).toBe(false);
    expect(second.userId).toBe(first.userId);

    const memberships = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_path_b_new"))
        .unique();
      if (user === null) {
        return [];
      }
      return await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    });
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.role).toBe("buyer");

    const org = await t.run(async (ctx) => {
      return await ctx.db
        .query("orgs")
        .withIndex("by_name", (q) => q.eq("name", PATH_B_PREVIEW_ORG_NAME))
        .unique();
    });
    expect(org?.flags).toEqual({
      FLAG_MLS: false,
      FLAG_VENDOR_COMP: false,
      FLAG_ESIGN: false,
      FLAG_IDV: false,
    });
  });

  it("does not provision agent or vendor identities as buyers", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    await expect(
      t.withIdentity({ subject: "clerk_agent" }).mutation(api.users.ensureBuyer, {}),
    ).rejects.toThrow("FORBIDDEN");

    await expect(
      t.withIdentity({ subject: "clerk_lender" }).mutation(api.users.ensureBuyer, {}),
    ).rejects.toThrow("FORBIDDEN");

    const pathBOrgCount = await t.run(async (ctx) => {
      const rows = await ctx.db
        .query("orgs")
        .withIndex("by_name", (q) => q.eq("name", PATH_B_PREVIEW_ORG_NAME))
        .collect();
      return rows.length;
    });
    expect(pathBOrgCount).toBe(0);
  });

  it("leaves seeded buyers unchanged", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});
    const asBuyer = t.withIdentity({ subject: "clerk_buyer_a" });

    const result = await asBuyer.mutation(api.users.ensureBuyer, {});
    expect(result.created).toBe(false);

    const view = await asBuyer.query(api.dashboard.getBuyerDashboard, {});
    expect(view).not.toBeNull();
  });
});
