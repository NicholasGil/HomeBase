import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import { PATH_B_PREVIEW_ORG_NAME } from "./lib/pathBOrg";
import { SEED_ORG_INVITE_CODE } from "./seedPlan";
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
      { inviteCode: SEED_ORG_INVITE_CODE },
    );
    expect(joined.orgName).toBe("Lookout Realty");
    expect(joined.role).toBe("agent");

    const membershipRole = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_joining_agent"))
        .unique();
      if (user === null) {
        return null;
      }
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      return membership?.role ?? null;
    });
    expect(membershipRole).toBe("agent");

    await expect(
      asJoiner.mutation(api.brokerageOnboarding.createBrokerage, {
        name: "Duplicate",
        state: "AL",
        role: "agent",
      }),
    ).rejects.toThrow("ALREADY_MEMBER");
  });

  it("rejects client-supplied role on joinWithInviteCode (no broker/buyer escalation)", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const asAttacker = t.withIdentity({ subject: "clerk_invite_escalation" });
    for (const forgedRole of ["broker", "buyer"] as const) {
      await expect(
        asAttacker.mutation(api.brokerageOnboarding.joinWithInviteCode, {
          inviteCode: SEED_ORG_INVITE_CODE,
          role: forgedRole,
        } as { inviteCode: string }),
      ).rejects.toThrow();
    }

    const membershipsBeforeValidJoin = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_invite_escalation"))
        .unique();
      if (user === null) {
        return [];
      }
      return await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    });
    expect(membershipsBeforeValidJoin).toHaveLength(0);

    const joined = await asAttacker.mutation(
      api.brokerageOnboarding.joinWithInviteCode,
      { inviteCode: SEED_ORG_INVITE_CODE },
    );
    expect(joined.role).toBe("agent");
    const storedRole = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk_invite_escalation"))
        .unique();
      if (user === null) {
        return null;
      }
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      return membership?.role ?? null;
    });
    expect(storedRole).toBe("agent");
  });

  it("always assigns agent via joinWithInviteCode (buyers use joinAsBuyer)", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const asStaffJoiner = t.withIdentity({
      subject: "clerk_staff_via_invite",
      name: "Staff Joiner",
    });
    const staffJoin = await asStaffJoiner.mutation(
      api.brokerageOnboarding.joinWithInviteCode,
      { inviteCode: SEED_ORG_INVITE_CODE },
    );
    expect(staffJoin.role).toBe("agent");

    const asBuyerJoiner = t.withIdentity({
      subject: "clerk_buyer_via_invite",
      name: "Buyer Joiner",
    });
    const buyerJoin = await asBuyerJoiner.mutation(
      api.brokerageOnboarding.joinAsBuyer,
      { inviteCode: SEED_ORG_INVITE_CODE },
    );
    expect(buyerJoin.role).toBe("buyer");

    const roles = await t.run(async (ctx) => {
      const rows = [];
      for (const clerkId of ["clerk_staff_via_invite", "clerk_buyer_via_invite"]) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
          .unique();
        if (user === null) {
          continue;
        }
        const membership = await ctx.db
          .query("memberships")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        rows.push({ clerkId, role: membership?.role ?? null });
      }
      return rows;
    });
    expect(roles).toEqual([
      { clerkId: "clerk_staff_via_invite", role: "agent" },
      { clerkId: "clerk_buyer_via_invite", role: "buyer" },
    ]);
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
      inviteCode: SEED_ORG_INVITE_CODE,
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
