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
    const issuedAmount = issuedHtml.match(/<p class="[^"]*tabular-nums[^"]*">[\s\S]*?<\/p>/)?.[0];
    expect(issuedAmount).toBeDefined();
    expect(issuedAmount).toContain("$450.00");
    expect(issuedAmount).toContain("font-mono");
    expect(issuedAmount).toContain("font-semibold");
    expect(issuedAmount).not.toContain("ESTIMATE");
    expect(issuedAmount).not.toMatch(/class="[^"]*italic/);
    expect(issuedHtml).toContain("Provenance title_issued");

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
    const estimateAmount = estimateHtml.match(/<p class="[^"]*tabular-nums[^"]*">[\s\S]*?<\/p>/)?.[0];
    expect(estimateAmount).toBeDefined();
    expect(estimateAmount).toContain("ESTIMATE");
    expect(estimateAmount).toContain("$1,200.00");
    expect(estimateAmount).toContain("italic");
    expect(estimateAmount).toContain("text-muted-foreground");
    expect(estimateAmount).not.toContain("font-mono");
    expect(estimateHtml).toContain("Provenance ai_estimate");
    expect(estimateAmount).not.toBe(issuedAmount);
  });
});
