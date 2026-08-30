import { describe, expect, it } from "vitest";

import { SEED_CLERK_IDS, SEED_VENDOR_IDS } from "../../convex/seedPlan";
import { writeFixtureCompensation } from "@/lib/vendor-access";
import { startTestSessionDecision } from "@/lib/test-session";
import {
  loadSeedHubForViewer,
  reengageSeedVendorForViewer,
} from "@/lib/homeownership-access";
import { SEED_CLOSED_TRANSACTION_ID } from "@/lib/seed-homeownership";

function sessionFor(clerkId: string) {
  const started = startTestSessionDecision(clerkId);
  if (!started.ok) {
    throw new Error(`session ${clerkId}`);
  }
  return started.session;
}

describe("fixture homeownership hub access", () => {
  it("lets the closed buyer open their hub with the four surfaces", () => {
    const loaded = loadSeedHubForViewer(
      sessionFor(SEED_CLERK_IDS.buyerH),
      SEED_CLOSED_TRANSACTION_ID,
    );
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      throw new Error("hub should load");
    }
    expect(loaded.view.status).toBe("closed");
    expect(loaded.view.maintenance.length).toBeGreaterThan(0);
    expect(loaded.view.warranties.length).toBeGreaterThan(0);
    expect(loaded.view.documents.map((row) => row.type)).toEqual(
      expect.arrayContaining(["closing_disclosure", "hvac_warranty"]),
    );
    expect(
      JSON.stringify(loaded.view).includes("extractedSummary"),
    ).toBe(false);
    const tax = loaded.view.values.find((row) => row.key === "taxAssessed");
    expect(tax?.figure).toBeNull();
    expect(loaded.view.vendors.every((row) => row.compensationModel === "none")).toBe(
      true,
    );
  });

  it("denies another buyer, a vendor, and an unauthenticated caller", () => {
    expect(
      loadSeedHubForViewer(
        sessionFor(SEED_CLERK_IDS.buyerA),
        SEED_CLOSED_TRANSACTION_ID,
      ),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      loadSeedHubForViewer(
        sessionFor(SEED_CLERK_IDS.buyerB),
        SEED_CLOSED_TRANSACTION_ID,
      ),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      loadSeedHubForViewer(
        sessionFor(SEED_CLERK_IDS.lender),
        SEED_CLOSED_TRANSACTION_ID,
      ),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(loadSeedHubForViewer(null, SEED_CLOSED_TRANSACTION_ID)).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
  });

  it("does not expose the hub on a non-closed transaction", () => {
    const alex = sessionFor(SEED_CLERK_IDS.buyerA);
    expect(loadSeedHubForViewer(alex, "seed:buyer-a")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    const indira = sessionFor(SEED_CLERK_IDS.buyerH);
    expect(loadSeedHubForViewer(indira, "seed:buyer-a")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });

  it("rejects a non-none compensation write on re-engage", () => {
    expect(writeFixtureCompensation("referral")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    const denied = reengageSeedVendorForViewer(
      sessionFor(SEED_CLERK_IDS.buyerH),
      {
        transactionId: SEED_CLOSED_TRANSACTION_ID,
        vendorId: SEED_VENDOR_IDS.hvac,
        compensationModel: "flat_fee",
      },
      [],
    );
    expect(denied).toEqual({ ok: false, reason: "FORBIDDEN" });
    const ok = reengageSeedVendorForViewer(
      sessionFor(SEED_CLERK_IDS.buyerH),
      {
        transactionId: SEED_CLOSED_TRANSACTION_ID,
        vendorId: SEED_VENDOR_IDS.hvac,
      },
      [],
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.compensationModel).toBe("none");
      expect(
        ok.view.vendors.find((row) => row.vendorId === SEED_VENDOR_IDS.hvac)
          ?.reengaged,
      ).toBe(true);
    }
  });
});
