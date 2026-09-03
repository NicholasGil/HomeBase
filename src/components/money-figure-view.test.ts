import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ASSUMPTIONS_LABEL,
  MoneyFigureView,
} from "@/components/money-figure-view";
import {
  ESTIMATE_AMOUNT_CLASS_NAME,
  ESTIMATE_LABEL,
  ISSUED_AMOUNT_CLASS_NAME,
} from "@/lib/owed-today-display";
import { moneyFigure } from "../../convex/lib/offerModel";

describe("MoneyFigureView", () => {
  it("labels unofficial figures ESTIMATE and uses the muted estimate style", () => {
    const html = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({
          amountCents: 32800000,
          provenance: "ai_estimate",
          asOf: 0,
          label: "Estimated loan",
        }),
        testId: "sim-estimatedLoan",
      }),
    );

    expect(html).toContain(ESTIMATE_LABEL);
    expect(html).toContain(ESTIMATE_AMOUNT_CLASS_NAME);
    expect(html).not.toContain(ISSUED_AMOUNT_CLASS_NAME);
    expect(html).toContain("ai_estimate");
    expect(html).toContain("Estimated loan");
  });

  it("renders a missing figure as None, never $0.00", () => {
    const html = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: null,
        testId: "hub-figure-taxAssessed",
      }),
    );
    expect(html).toContain("None");
    expect(html).not.toContain("$0.00");
    expect(html).not.toContain("$0");
  });

  it("keeps issued figures unlabeled and full-weight", () => {
    const html = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({
          amountCents: 45000,
          provenance: "title_issued",
          asOf: 0,
          label: "Title invoice",
        }),
        testId: "issued-title",
      }),
    );

    expect(html).not.toContain(ESTIMATE_LABEL);
    expect(html).toContain(ISSUED_AMOUNT_CLASS_NAME);
    expect(html).not.toContain(ESTIMATE_AMOUNT_CLASS_NAME);
    expect(html).toContain("title_issued");
    expect(html).toContain("issued");
  });

  it("gives every estimate a reachable Assumptions disclosure and issued figures none", () => {
    const estimate = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({
          amountCents: 1200000,
          provenance: "ai_estimate",
          asOf: Date.UTC(2026, 7, 30),
        }),
        size: "md",
        assumptionsHref: "#assumptions-panel",
        assumptions: ["Rate 675 bps."],
      }),
    );
    expect(estimate).toContain("<details");
    expect(estimate).toContain(`<summary`);
    expect(estimate).toContain(ASSUMPTIONS_LABEL);
    expect(estimate).toContain('href="#assumptions-panel"');
    expect(estimate).toContain("Rate 675 bps.");
    expect(estimate).toContain("Aug 30, 2026");
    expect(estimate).toContain('data-figure="estimate"');
    expect(estimate).toContain('data-provenance="ai_estimate"');

    const issued = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({
          amountCents: 1200000,
          provenance: "lender_issued",
          asOf: Date.UTC(2026, 7, 30),
        }),
        size: "md",
        assumptionsHref: "#assumptions-panel",
      }),
    );
    expect(issued).not.toContain("<details");
    expect(issued).not.toContain(ASSUMPTIONS_LABEL);
    expect(issued).toContain('data-figure="issued"');
  });

  it("keeps the three cues at every size and only swaps the type scale", () => {
    const sizes = ["sm", "md", "display"] as const;
    for (const size of sizes) {
      const estimate = renderToStaticMarkup(
        createElement(MoneyFigureView, {
          figure: moneyFigure({
            amountCents: 500000,
            provenance: "user_entered",
            asOf: 0,
          }),
          size,
        }),
      );
      expect(estimate).toContain(ESTIMATE_LABEL);
      expect(estimate).toContain("italic");
      expect(estimate).toContain("user_entered");
      expect(estimate).toContain(">estimate<");
      expect(estimate).toContain(ASSUMPTIONS_LABEL);
      expect(estimate).not.toContain("font-mono");

      const issued = renderToStaticMarkup(
        createElement(MoneyFigureView, {
          figure: moneyFigure({
            amountCents: 500000,
            provenance: "title_issued",
            asOf: 0,
          }),
          size,
        }),
      );
      expect(issued).toContain("font-mono");
      expect(issued).toContain("font-semibold");
      expect(issued).toContain("tabular-nums");
      expect(issued).toContain("title_issued");
      expect(issued).toContain(">issued<");
      expect(issued).not.toContain(ESTIMATE_LABEL);
      expect(issued).not.toContain("italic");
    }

    const small = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({ amountCents: 1, provenance: "title_issued", asOf: 0 }),
        size: "sm",
      }),
    );
    expect(small).toContain("text-body");
    expect(small).not.toContain("text-4xl");
    const display = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({ amountCents: 1, provenance: "title_issued", asOf: 0 }),
        size: "display",
      }),
    );
    expect(display).toContain("text-4xl");
    expect(display).toContain("lg:text-5xl");
  });

  it("carries one chip per figure with the provenance token as quiet text", () => {
    for (const provenance of ["ai_estimate", "title_issued"] as const) {
      const html = renderToStaticMarkup(
        createElement(MoneyFigureView, {
          figure: moneyFigure({ amountCents: 500000, provenance, asOf: 0 }),
          size: "sm",
        }),
      );
      expect(html.match(/data-slot="badge"/g)?.length).toBe(1);
      expect(html).toContain(`data-slot="money-provenance">${provenance}<`);
      expect(html).not.toContain("bg-primary");
    }
  });

  it("hides the figure label when the surface already names it", () => {
    const shown = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({
          amountCents: 860000,
          provenance: "ai_estimate",
          asOf: 0,
          label: "Earnest money",
        }),
        size: "sm",
      }),
    );
    expect(shown).toContain("Earnest money");
    const hidden = renderToStaticMarkup(
      createElement(MoneyFigureView, {
        figure: moneyFigure({
          amountCents: 860000,
          provenance: "ai_estimate",
          asOf: 0,
          label: "Earnest money",
        }),
        size: "sm",
        showLabel: false,
      }),
    );
    expect(hidden).not.toContain("Earnest money");
  });
});
