import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  FIXTURE_ADVANCE_UNAVAILABLE,
  StageAdvancePanel,
  stageAdvanceReason,
} from "@/components/stage-advance-panel";
import { SEED_CLERK_IDS } from "../../convex/seedPlan";
import {
  seedDashboardForBuyer,
  seedDashboardForBuyerA,
} from "@/lib/seed-dashboard";

function buttonMarkup(html: string) {
  const match = /<button[^>]*data-testid="stage-advance"[^>]*>/.exec(html);
  if (match === null) {
    throw new Error("advance control not rendered");
  }
  return match[0];
}

describe("StageAdvancePanel", () => {
  it("renders the control disabled with the blocking task inline when blocked", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(StageAdvancePanel, { view, onAdvance: () => {} }),
    );
    expect(view.canAdvance).toBe(false);
    expect(buttonMarkup(html)).toContain(' disabled=""');
    expect(html).toContain('data-reason="blocked"');
    expect(html).toContain("Blocked while Schedule inspection is open.");
    expect(html).toContain('data-testid="stage-advance-blockers"');
    expect(html).toContain("Review inspection report");
    expect(html).toContain("Advance to Appraisal");
  });

  it("renders the control enabled when the server says the stage can advance", () => {
    const view = seedDashboardForBuyer(SEED_CLERK_IDS.buyerB);
    const html = renderToStaticMarkup(
      createElement(StageAdvancePanel, { view, onAdvance: () => {} }),
    );
    expect(view.canAdvance).toBe(true);
    expect(buttonMarkup(html)).not.toContain(' disabled=""');
    expect(html).toContain('data-reason="ready"');
    expect(html).not.toContain('data-testid="stage-advance-blockers"');
  });

  it("stays visible but disabled when there is no mutation to call", () => {
    const view = seedDashboardForBuyer(SEED_CLERK_IDS.buyerB);
    const html = renderToStaticMarkup(createElement(StageAdvancePanel, { view }));
    expect(buttonMarkup(html)).toContain(' disabled=""');
    expect(html).toContain('data-reason="unavailable"');
    expect(html).toContain(FIXTURE_ADVANCE_UNAVAILABLE);
  });

  it("names the last stage instead of a blocker when nothing follows", () => {
    const view = seedDashboardForBuyer(SEED_CLERK_IDS.buyerH);
    expect(view.nextStage).toBeNull();
    expect(stageAdvanceReason(view, true)).toEqual({
      kind: "last-stage",
      text: "This file is on its last stage.",
    });
    const html = renderToStaticMarkup(
      createElement(StageAdvancePanel, { view, onAdvance: () => {} }),
    );
    expect(buttonMarkup(html)).toContain(' disabled=""');
    expect(html).toContain(">Advance stage<");
  });

  it("links the control to its reason for assistive tech", () => {
    const html = renderToStaticMarkup(
      createElement(StageAdvancePanel, { view: seedDashboardForBuyerA() }),
    );
    const described = /aria-describedby="([^"]+)"/.exec(buttonMarkup(html));
    expect(described).not.toBeNull();
    expect(html).toContain(`id="${described![1]}"`);
    expect(buttonMarkup(html)).toContain("min-h-11");
  });
});
