import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ESIGN_LOCKED_DETAIL,
  OfferStatusRail,
  offerRailSteps,
} from "@/components/offer-status-rail";

const unreviewedDraft = {
  status: "draft",
  reviewedByLicenseeId: null,
  submittedAt: null,
};

describe("offerRailSteps", () => {
  it("locks submit and e-sign while e-sign is off, whatever the draft state", () => {
    for (const offer of [
      null,
      unreviewedDraft,
      { status: "ready", reviewedByLicenseeId: "licensee-1", submittedAt: null },
    ]) {
      const steps = offerRailSteps({ offer, esignEnabled: false });
      const byKey = Object.fromEntries(steps.map((step) => [step.key, step]));
      expect(byKey.submit?.state).toBe("locked");
      expect(byKey.esign?.state).toBe("locked");
      expect(byKey.submit?.detail).toBe(ESIGN_LOCKED_DETAIL);
      expect(byKey.esign?.detail).toBe(ESIGN_LOCKED_DETAIL);
    }
  });

  it("points at draft when there is none, then at licensee review", () => {
    const none = offerRailSteps({ offer: null, esignEnabled: false });
    expect(none.map((step) => step.state)).toEqual([
      "current",
      "upcoming",
      "locked",
      "locked",
    ]);

    const draft = offerRailSteps({ offer: unreviewedDraft, esignEnabled: false });
    expect(draft.map((step) => step.state)).toEqual([
      "done",
      "current",
      "locked",
      "locked",
    ]);
  });

  it("only unlocks submit once e-sign is on and the licensee has reviewed", () => {
    const unreviewed = offerRailSteps({
      offer: unreviewedDraft,
      esignEnabled: true,
    });
    expect(unreviewed[2]?.state).toBe("upcoming");

    const reviewed = offerRailSteps({
      offer: { status: "ready", reviewedByLicenseeId: "licensee-1", submittedAt: null },
      esignEnabled: true,
    });
    expect(reviewed[1]?.state).toBe("done");
    expect(reviewed[2]?.state).toBe("current");
  });
});

describe("OfferStatusRail", () => {
  it("renders locked steps with the unlock copy and no links", () => {
    const html = renderToStaticMarkup(
      createElement(OfferStatusRail, {
        steps: offerRailSteps({ offer: unreviewedDraft, esignEnabled: false }),
      }),
    );
    expect(html).toContain('data-testid="offer-rail-submit"');
    expect(html).toContain('data-state="locked"');
    expect(html.match(new RegExp(ESIGN_LOCKED_DETAIL, "g"))).toHaveLength(2);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("/sign");
  });
});
