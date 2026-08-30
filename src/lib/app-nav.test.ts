import { describe, expect, it } from "vitest";

import {
  navContextFromFixtureSession,
  navLinksFor,
  wordmarkHrefFor,
} from "@/lib/app-nav";
import { startTestSessionDecision } from "@/lib/test-session";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

function labels(role: Parameters<typeof navLinksFor>[0]["role"], extra?: {
  buyerClosed?: boolean;
  hubHref?: string;
}) {
  return navLinksFor({ role, ...extra }).map((link) => link.label);
}

describe("navLinksFor", () => {
  it("keeps buyer chrome to Home, Search, Tours, and Vault", () => {
    expect(labels("buyer")).toEqual(["Home", "Search", "Tours", "Vault"]);
    expect(labels("buyer")).not.toContain("Command center");
    expect(labels("buyer")).not.toContain("Vendor portal");
    expect(labels("buyer")).not.toContain("Sign");
    expect(labels("buyer")).not.toContain("Identity");
    expect(labels("buyer")).not.toContain("Hub");
    expect(labels("buyer")).not.toContain("Offers");
  });

  it("adds Hub only for a closed buyer file", () => {
    expect(
      labels("buyer", {
        buyerClosed: true,
        hubHref: "/homeownership/seed:buyer-h",
      }),
    ).toEqual(["Home", "Search", "Tours", "Vault", "Hub"]);
    expect(labels("buyer", { buyerClosed: true })).not.toContain("Hub");
  });

  it("keeps agent and vendor entries on their own chrome", () => {
    expect(labels("agent")[0]).toBe("Command center");
    expect(labels("vendor")).toEqual(["Vendor portal", "Vault"]);
    expect(labels("guest")).toEqual([]);
  });
});

describe("navContextFromFixtureSession", () => {
  it("maps seeded identities without dumping every route", () => {
    const local = { VERCEL_ENV: "development" };
    const alex = startTestSessionDecision(SEED_CLERK_IDS.buyerA, local);
    const indira = startTestSessionDecision(SEED_CLERK_IDS.buyerH, local);
    const casey = startTestSessionDecision(SEED_CLERK_IDS.agent, local);
    const jordan = startTestSessionDecision(SEED_CLERK_IDS.lender, local);
    if (!alex.ok || !indira.ok || !casey.ok || !jordan.ok) {
      throw new Error("seed sessions");
    }

    expect(navContextFromFixtureSession(null)).toEqual({
      role: "guest",
      buyerClosed: false,
    });
    expect(navContextFromFixtureSession(alex.session)).toMatchObject({
      role: "buyer",
      buyerClosed: false,
      name: "Alex Rivera",
    });
    expect(navContextFromFixtureSession(indira.session)).toMatchObject({
      role: "buyer",
      buyerClosed: true,
      hubHref: "/homeownership/seed:buyer-h",
    });
    expect(navContextFromFixtureSession(casey.session).role).toBe("agent");
    expect(navContextFromFixtureSession(jordan.session).role).toBe("vendor");
    expect(wordmarkHrefFor("buyer")).toBe("/dashboard");
    expect(wordmarkHrefFor("guest")).toBe("/");
  });

  it("gives every fixture identity a name so AppNav can render the avatar", () => {
    const local = { VERCEL_ENV: "development" };
    const ids = [
      SEED_CLERK_IDS.buyerA,
      SEED_CLERK_IDS.buyerB,
      SEED_CLERK_IDS.buyerH,
      SEED_CLERK_IDS.agent,
      SEED_CLERK_IDS.lender,
    ];
    for (const clerkId of ids) {
      const started = startTestSessionDecision(clerkId, local);
      if (!started.ok) {
        throw new Error(`seed session ${clerkId}`);
      }
      expect(navContextFromFixtureSession(started.session).name).toEqual(
        started.session.name,
      );
    }
  });
});
