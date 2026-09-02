import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  BuyerDashboardViewPanel,
  OwedTodayFigure,
} from "@/components/buyer-dashboard-view";
import {
  ESTIMATE_AMOUNT_CLASS_NAME,
  ESTIMATE_LABEL,
  ISSUED_AMOUNT_CLASS_NAME,
} from "@/lib/owed-today-display";
import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";

describe("BuyerDashboardViewPanel ten-second answers", () => {
  it("renders the seeded mid-flight answers and current stage", () => {
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, {
        view: seedDashboardForBuyerA(),
        buyerName: "Alex Rivera",
      }),
    );
    expect(html).toContain('data-testid="ten-second-where"');
    expect(html).toContain("Inspection");
    expect(html).toContain("Sign purchase agreement");
    expect(html).toContain("Schedule inspection");
    expect(html).not.toContain('href="/tours"');
    expect(html).not.toContain('href="/vault"');
    expect(html).not.toContain("#assumptions-panel");
    expect(html).toContain("data-state=\"current\"");
    expect(html).toContain("Cannot leave Inspection");
    expect(html).toContain('data-testid="journey-stage-inspection"');
    expect(html).toContain('data-testid="journey-tracker"');
    expect(html).toContain("814 Maple Ave");
    expect(html.indexOf("h-40")).toBeLessThan(html.indexOf("Inspection"));
  });

  it("drills Next, Due today and every stage chip into the transaction route", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view }),
    );
    const href = `href="/transactions/${view.transactionId}"`;
    const next = /data-testid="ten-second-next".*?<\/section>/.exec(html)?.[0];
    const owe = /data-testid="ten-second-owe".*?<\/section>/.exec(html)?.[0];
    expect(next).toContain(href);
    expect(owe).toContain(href);
    const tracker = /data-testid="journey-tracker".*?<\/ol>/.exec(html)?.[0];
    expect(tracker?.match(new RegExp(href, "g"))).toHaveLength(view.stages.length);
    expect(tracker).toMatch(/<a [^>]*title="Inspection · current stage"/);
    expect(tracker).toContain(" · stage 8 of 13, current stage</span>");
    expect(html).not.toMatch(/<a [^>]*><\/a>/);
  });

  it("renders the hero without self-links on the transaction route", () => {
    const view = seedDashboardForBuyerA();
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view, detailHref: null }),
    );
    expect(html).not.toContain(`href="/transactions/${view.transactionId}"`);
    expect(html).toContain('data-testid="ten-second-next"');
    expect(html).toContain("Schedule inspection");
    expect(html).toContain('data-testid="journey-stage-inspection"');
  });
});

describe("BuyerDashboardViewPanel owedToday", () => {
  it("does not render a dollar amount when owedToday is null", () => {
    const view = { ...seedDashboardForBuyerA(), owedToday: null };
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view }),
    );

    expect(html).toContain("None");
    expect(html).not.toMatch(/\$\d/);
    expect(html).not.toContain("$0.00");
  });

  it("styles estimate and issued amounts differently", () => {
    const issuedHtml = renderToStaticMarkup(
      createElement(OwedTodayFigure, {
        owed: {
          amountCents: 45000,
          currency: "USD",
          provenance: "title_issued",
          asOf: 0,
          label: "Inspection invoice due today",
        },
      }),
    );
    const estimateHtml = renderToStaticMarkup(
      createElement(OwedTodayFigure, {
        owed: {
          amountCents: 120000,
          currency: "USD",
          provenance: "ai_estimate",
          asOf: 0,
        },
      }),
    );
    const enteredHtml = renderToStaticMarkup(
      createElement(OwedTodayFigure, {
        owed: {
          amountCents: 0,
          currency: "USD",
          provenance: "user_entered",
          asOf: 0,
          label: "Nothing due today",
        },
      }),
    );

    expect(issuedHtml).toContain("$450.00");
    expect(issuedHtml).toContain(ISSUED_AMOUNT_CLASS_NAME);
    expect(issuedHtml).toContain("title_issued");
    expect(issuedHtml).not.toContain(ESTIMATE_LABEL);
    expect(issuedHtml).not.toContain(ESTIMATE_AMOUNT_CLASS_NAME);

    expect(estimateHtml).toContain("$1,200.00");
    expect(estimateHtml).toContain(ESTIMATE_LABEL);
    expect(estimateHtml).toContain(ESTIMATE_AMOUNT_CLASS_NAME);
    expect(estimateHtml).toContain("ai_estimate");
    expect(estimateHtml).not.toContain(ISSUED_AMOUNT_CLASS_NAME);

    expect(enteredHtml).toContain("$0.00");
    expect(enteredHtml).toContain(ESTIMATE_LABEL);
    expect(enteredHtml).toContain(ESTIMATE_AMOUNT_CLASS_NAME);
    expect(enteredHtml).toContain("user_entered");
    expect(estimateHtml).not.toBe(issuedHtml);
  });
});
