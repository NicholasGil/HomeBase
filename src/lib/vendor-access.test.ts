import { describe, expect, it } from "vitest";

import { SEED_ASSIGNMENT_IDS, SEED_CLERK_IDS, SEED_VENDOR_IDS } from "../../convex/seedPlan";
import { startTestSessionDecision } from "@/lib/test-session";
import {
  compareSeedVendorsForViewer,
  emptyVendorPortalState,
  loadSeedAssignmentForViewer,
  loadSeedDirectoryForViewer,
  loadSeedPortalForViewer,
  requestSeedAppointmentForViewer,
  recoverLiveSeedAssignment,
  sendSeedVendorMessage,
  writeFixtureCompensation,
} from "@/lib/vendor-access";

function alex() {
  const started = startTestSessionDecision(SEED_CLERK_IDS.buyerA);
  if (!started.ok) {
    throw new Error("alex session");
  }
  return started.session;
}

function blair() {
  const started = startTestSessionDecision(SEED_CLERK_IDS.buyerB);
  if (!started.ok) {
    throw new Error("blair session");
  }
  return started.session;
}

function jordan() {
  const started = startTestSessionDecision(SEED_CLERK_IDS.lender);
  if (!started.ok) {
    throw new Error("jordan session");
  }
  return started.session;
}

describe("fixture vendor directory", () => {
  it("shows inspectors to Alex and none to Blair", () => {
    const alexDir = loadSeedDirectoryForViewer(alex(), "seed:buyer-a");
    const blairDir = loadSeedDirectoryForViewer(blair(), "seed:buyer-b");
    expect(alexDir.ok).toBe(true);
    if (alexDir.ok) {
      expect(alexDir.stage).toBe("inspection");
      expect(alexDir.vendors.map((row) => row.name)).toEqual(
        expect.arrayContaining(["Riley Brooks", "Sam Okonkwo"]),
      );
      expect(
        alexDir.vendors.every((row) => row.compensationModel === "none"),
      ).toBe(true);
    }
    expect(blairDir.ok).toBe(true);
    if (blairDir.ok) {
      expect(blairDir.vendors).toEqual([]);
    }
  });

  it("denies unauthenticated, vendor, and cross-client directory reads", () => {
    expect(loadSeedDirectoryForViewer(null, "seed:buyer-a")).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
    expect(loadSeedDirectoryForViewer(jordan(), "seed:buyer-a")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    expect(loadSeedDirectoryForViewer(alex(), "seed:buyer-b")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });

  it("compares the two inspectors and records a request", () => {
    const compared = compareSeedVendorsForViewer(alex(), "seed:buyer-a", [
      SEED_VENDOR_IDS.inspectorRiley,
      SEED_VENDOR_IDS.inspectorSam,
    ]);
    expect(compared.ok).toBe(true);
    const requested = requestSeedAppointmentForViewer(
      alex(),
      {
        transactionId: "seed:buyer-a",
        vendorId: SEED_VENDOR_IDS.inspectorRiley,
      },
      emptyVendorPortalState(),
    );
    expect(requested.ok).toBe(true);
    if (requested.ok) {
      expect(requested.state.requestedVendorIds).toEqual([
        SEED_VENDOR_IDS.inspectorRiley,
      ]);
    }
  });
});

describe("fixture vendor portal", () => {
  it("shows Jordan only the Rivera assignment", () => {
    const portal = loadSeedPortalForViewer(jordan(), {
      expired: false,
      state: emptyVendorPortalState(),
    });
    expect(portal.ok).toBe(true);
    if (portal.ok) {
      expect(portal.assignments).toHaveLength(1);
      expect(portal.assignments[0]?.transaction.transactionId).toBe(
        "seed:buyer-a",
      );
      expect(portal.assignments[0]?.transaction.propertyCity).toBe(
        "Huntsville",
      );
    }
    expect(loadSeedPortalForViewer(alex(), {
      expired: false,
      state: emptyVendorPortalState(),
    })).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("denies the assignment after expiry", () => {
    const expired = loadSeedAssignmentForViewer(
      jordan(),
      SEED_ASSIGNMENT_IDS.lenderAlex,
      { expired: true, state: emptyVendorPortalState() },
    );
    expect(expired).toEqual({ ok: false, reason: "FORBIDDEN" });
    const live = loadSeedAssignmentForViewer(
      jordan(),
      SEED_ASSIGNMENT_IDS.lenderAlex,
      { expired: false, state: emptyVendorPortalState() },
    );
    expect(live.ok).toBe(true);
  });

  it("lets Jordan message the assigned file", () => {
    const sent = sendSeedVendorMessage(
      jordan(),
      {
        assignmentId: SEED_ASSIGNMENT_IDS.lenderAlex,
        body: "Report is on the way.",
        expired: false,
      },
      emptyVendorPortalState(),
    );
    expect(sent.ok).toBe(true);
    if (sent.ok) {
      expect(sent.state.messages[0]?.body).toContain("Report");
    }
    expect(
      sendSeedVendorMessage(
        jordan(),
        {
          assignmentId: SEED_ASSIGNMENT_IDS.lenderAlex,
          body: "too late",
          expired: true,
        },
        emptyVendorPortalState(),
      ),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      sendSeedVendorMessage(
        jordan(),
        {
          assignmentId: SEED_ASSIGNMENT_IDS.lenderAlex,
          body: "   ",
          expired: false,
        },
        emptyVendorPortalState(),
      ),
    ).toEqual({ ok: false, reason: "EMPTY" });
    const recovered = recoverLiveSeedAssignment(jordan(), {
      expired: false,
      state: emptyVendorPortalState(),
    });
    expect(recovered.ok).toBe(true);
    if (recovered.ok) {
      expect(recovered.assignment.assignmentId).toBe(
        SEED_ASSIGNMENT_IDS.lenderAlex,
      );
    }
    const staleId = sendSeedVendorMessage(
      jordan(),
      {
        assignmentId: "missing-assignment",
        body: "Recovered the live file.",
        expired: false,
      },
      emptyVendorPortalState(),
    );
    expect(staleId.ok).toBe(true);
  });

  it("rejects a non-none compensation write", () => {
    expect(writeFixtureCompensation("referral")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    expect(writeFixtureCompensation("none")).toEqual({
      ok: true,
      compensationModel: "none",
    });
  });
});
