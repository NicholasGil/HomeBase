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
