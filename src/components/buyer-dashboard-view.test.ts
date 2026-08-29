import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  BuyerDashboardViewPanel,
  OwedTodayFigure,
} from "@/components/buyer-dashboard-view";
import { seedDashboardForBuyerA } from "@/lib/seed-dashboard";

describe("BuyerDashboardViewPanel owedToday", () => {
  it("does not render $0.00 when owedToday is null", () => {
    const view = { ...seedDashboardForBuyerA(), owedToday: null };
    const html = renderToStaticMarkup(
      createElement(BuyerDashboardViewPanel, { view }),
    );

    expect(html).toContain("Not yet issued");
    expect(html).toContain("No sourced figure on this file");
    expect(html).not.toContain("$0.00");
    expect(html).not.toContain("Provenance");
  });

  it("keeps provenance on the surface for issued and estimate figures", () => {
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
    expect(issuedHtml).toContain("Issued");
    expect(issuedHtml).toContain("$450.00");
    expect(issuedHtml).toContain("Provenance title_issued");
    expect(issuedHtml).toContain("font-mono");
    expect(issuedHtml).not.toContain("italic");

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
    expect(estimateHtml).toContain("ESTIMATE");
    expect(estimateHtml).toContain("$1,200.00");
    expect(estimateHtml).toContain("Provenance ai_estimate");
    expect(estimateHtml).toContain("italic");
    expect(estimateHtml).not.toContain("font-mono");
  });
});
