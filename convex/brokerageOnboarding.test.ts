import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import { PATH_B_PREVIEW_ORG_NAME } from "./lib/pathBOrg";
import schema from "./schema";
import { modules } from "./test.setup";

describe("brokerageOnboarding", () => {
  it("creates a brokerage with journey stages and invite code", async () => {
    const t = convexTest(schema, modules);
    const asNew = t.withIdentity({
      subject: "clerk_new_broker",
      email: "broker@example.com",
      name: "Morgan Lee",
    });

    const created = await asNew.mutation(api.brokerageOnboarding.createBrokerage, {
      name: "Summit Homes",
      state: "tx",
      role: "broker",
    });
    expect(created.orgName).toBe("Summit Homes");
    expect(created.orgState).toBe("TX");
    expect(created.inviteCode).toMatch(/^[A-Z0-9]{8}$/);

    const status = await asNew.query(api.brokerageOnboarding.getStatus, {});
    expect(status.status).toBe("ready");
    if (status.status === "ready") {
      expect(status.role).toBe("broker");
      expect(status.orgName).toBe("Summit Homes");
    }

    const stages = await t.run(async (ctx) => {
      return await ctx.db
        .query("journeyStages")
        .withIndex("by_org", (q) => q.eq("orgId", created.orgId))
        .collect();
    });
    expect(stages.length).toBeGreaterThan(0);

    const commandCenter = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_new_broker"))
        .unique();
      if (user === null) {
        return null;
      }
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      return memberships;
    });
    expect(commandCenter).toHaveLength(1);
  });

  it("lets an agent join with invite code", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const asJoiner = t.withIdentity({
      subject: "clerk_joining_agent",
      name: "Riley Chen",
    });
    const joined = await asJoiner.mutation(
      api.brokerageOnboarding.joinWithInviteCode,
      {
        inviteCode: "LOOKOUT1",
        role: "agent",
      },
    );
    expect(joined.orgName).toBe("Lookout Realty");
    expect(joined.role).toBe("agent");

    await expect(
      asJoiner.mutation(api.brokerageOnboarding.createBrokerage, {
        name: "Duplicate",
        state: "AL",
        role: "agent",
      }),
    ).rejects.toThrow("ALREADY_MEMBER");
  });

  it("moves Path B buyers onto a brokerage when invited", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const asBuyer = t.withIdentity({
      subject: "clerk_path_b_invite",
      email: "invite.buyer@example.com",
      name: "Invite Buyer",
    });
    await asBuyer.mutation(api.users.ensureBuyer, {});

    const pathBBefore = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_path_b_invite"))
        .unique();
      if (user === null) {
        return [];
      }
      return await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    });
    expect(pathBBefore).toHaveLength(1);

    const pathBOrg = await t.run(async (ctx) => {
      return await ctx.db
        .query("orgs")
        .withIndex("by_name", (q) => q.eq("name", PATH_B_PREVIEW_ORG_NAME))
        .unique();
    });
    expect(pathBOrg).not.toBeNull();

    await asBuyer.mutation(api.brokerageOnboarding.joinAsBuyer, {
      inviteCode: "LOOKOUT1",
    });

    const memberships = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_path_b_invite"))
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

    const lookout = await t.run(async (ctx) => {
      return await ctx.db
        .query("orgs")
        .withIndex("by_name", (q) => q.eq("name", "Lookout Realty"))
        .unique();
    });
    expect(memberships[0]?.orgId).toBe(lookout?._id);

    const dashboard = await asBuyer.query(api.dashboard.getBuyerDashboard, {});
    expect(dashboard).toBeNull();
  });
});
