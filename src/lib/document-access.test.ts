import { describe, expect, it } from "vitest";

import {
  grantFixtureDocument,
  listFixtureDocuments,
  resolveFixtureDocument,
  revokeFixtureGrant,
} from "@/lib/document-access";
import { SEED_DOCUMENT_IDS } from "@/lib/seed-documents";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";

const alex = {
  clerkId: SEED_CLERK_IDS.buyerA,
  role: "buyer" as const,
  transactionId: "seed:buyer-a",
};

const jordan = {
  clerkId: SEED_CLERK_IDS.lender,
  role: "vendor" as const,
};

describe("fixture document access", () => {
  it("keeps the inspection report off the granted preapproval", () => {
    const granted = grantFixtureDocument({
      viewer: alex,
      documentId: SEED_DOCUMENT_IDS.preapproval,
      granteeClerkId: SEED_CLERK_IDS.lender,
      grants: [],
    });
    expect(granted.ok).toBe(true);
    if (!granted.ok) {
      throw new Error("grant failed");
    }

    const preapproval = resolveFixtureDocument({
      viewer: jordan,
      documentId: SEED_DOCUMENT_IDS.preapproval,
      grants: granted.grants,
    });
    const inspection = resolveFixtureDocument({
      viewer: jordan,
      documentId: SEED_DOCUMENT_IDS.inspection,
      grants: granted.grants,
    });
    expect(preapproval.ok).toBe(true);
    expect(inspection).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      listFixtureDocuments({ viewer: jordan, grants: granted.grants }).map(
        (doc) => doc.type,
      ),
    ).toEqual(["preapproval"]);

    const grant = granted.grants[0];
    if (grant === undefined) {
      throw new Error("missing grant");
    }
    const revoked = revokeFixtureGrant({
      viewer: alex,
      grantId: grant.id,
      grants: granted.grants,
    });
    expect(revoked.ok).toBe(true);
    if (!revoked.ok) {
      throw new Error("revoke failed");
    }
    expect(
      resolveFixtureDocument({
        viewer: jordan,
        documentId: SEED_DOCUMENT_IDS.preapproval,
        grants: revoked.grants,
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("does not treat an agent as principal for another book", () => {
    const casey = {
      clerkId: SEED_CLERK_IDS.agent,
      role: "agent" as const,
    };
    expect(
      resolveFixtureDocument({
        viewer: casey,
        documentId: SEED_DOCUMENT_IDS.preapproval,
        grants: [],
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("omits extractedSummary from list payloads", () => {
    const listed = listFixtureDocuments({ viewer: alex, grants: [] });
    expect(listed.length).toBeGreaterThan(0);
    for (const row of listed) {
      expect(row).not.toHaveProperty("extractedSummary");
    }
  });

  it("denies an expired grant on open and list", () => {
    const grants = [
      {
        id: "grant-expired",
        documentId: SEED_DOCUMENT_IDS.preapproval,
        granteeClerkId: SEED_CLERK_IDS.lender,
        scope: "view" as const,
        expiresAt: Date.now() - 1_000,
        grantedBy: SEED_CLERK_IDS.buyerA,
      },
    ];
    expect(
      resolveFixtureDocument({
        viewer: jordan,
        documentId: SEED_DOCUMENT_IDS.preapproval,
        grants,
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(listFixtureDocuments({ viewer: jordan, grants })).toEqual([]);
  });

  it("refuses a grant to someone who is not the org vendor", () => {
    expect(
      grantFixtureDocument({
        viewer: alex,
        documentId: SEED_DOCUMENT_IDS.preapproval,
        granteeClerkId: SEED_CLERK_IDS.buyerB,
        grants: [],
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("keeps the closed-file closing disclosure off another buyer and the vendor", () => {
    const indira = {
      clerkId: SEED_CLERK_IDS.buyerH,
      role: "buyer" as const,
      transactionId: "seed:buyer-h",
    };
    const opened = resolveFixtureDocument({
      viewer: indira,
      documentId: SEED_DOCUMENT_IDS.closingDisclosure,
      grants: [],
    });
    expect(opened.ok).toBe(true);
    expect(
      resolveFixtureDocument({
        viewer: alex,
        documentId: SEED_DOCUMENT_IDS.closingDisclosure,
        grants: [],
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      resolveFixtureDocument({
        viewer: jordan,
        documentId: SEED_DOCUMENT_IDS.closingDisclosure,
        grants: [],
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("denies an unauthenticated open", () => {
    expect(
      resolveFixtureDocument({
        viewer: null,
        documentId: SEED_DOCUMENT_IDS.preapproval,
        grants: [],
      }),
    ).toEqual({ ok: false, reason: "UNAUTHENTICATED" });
  });
});
